// =================================================================
// SCRIPT IMPORT SERVICE - Orchestration Layer
// =================================================================
// High-level service for script parsing and scene import
// Coordinates parsers, validation, and database integration

import { ScriptImportResult } from '../models/ImportedScene.js';
import { FountainAdapter } from '../parsers/fountainAdapter.js';
import { PlainTextParser } from '../parsers/plainTextParser.js';
import { SceneService } from './sceneService.js';
import { CharacterService } from './characterService.js';

export class ScriptImportService {
    
    /**
     * Parse script text into ImportedScenes
     * @param {string} text - Raw script text
     * @param {string} format - 'auto', 'fountain', 'plaintext'
     * @returns {ScriptImportResult}
     */
    static async parseScript(text, format = 'auto') {
        if (!text || text.trim().length === 0) {
            throw new Error('Script text is empty');
        }
        
        const result = new ScriptImportResult();
        result.rawText = text;
        
        // Auto-detect format if needed
        if (format === 'auto') {
            format = this.detectFormat(text);
        }
        
        // Select parser
        let scenes = [];
        
        try {
            if (format === 'fountain') {
                const parser = new FountainAdapter();
                scenes = await parser.parse(text);
                
                // Extract metadata
                const metadata = FountainAdapter.extractMetadata(text);
                result.metadata.title = metadata.title;
                result.metadata.author = metadata.author;
            } 
            else if (format === 'plaintext') {
                const parser = new PlainTextParser();
                scenes = parser.parse(text);
            }
            else {
                throw new Error(`Unknown format: ${format}`);
            }
        } catch (error) {
            console.error('Parsing error:', error);
            throw new Error(`Failed to parse script: ${error.message}`);
        }
        
        result.scenes = scenes;
        result.metadata.totalScenes = scenes.length;
        result.metadata.totalCharacters = result.getAllCharacters().length;
        
        // Collect global warnings
        const lowConfidenceScenes = result.getLowConfidenceScenes();
        if (lowConfidenceScenes.length > 0) {
            result.metadata.parseWarnings.push(
                `${lowConfidenceScenes.length} scene(s) have low confidence - review carefully`
            );
        }
        
        return result;
    }
    
    /**
     * Detect script format
     * @param {string} text
     * @returns {string} 'fountain' | 'plaintext' | 'fdx'
     */
    static detectFormat(text) {
        // Check for Final Draft XML
        if (text.trim().startsWith('<?xml') && text.includes('FinalDraft')) {
            return 'fdx'; // Not supported yet, but detected
        }
        
        // Check for Fountain
        if (FountainAdapter.isFountain(text)) {
            return 'fountain';
        }
        
        // Check for screenplay structure
        if (PlainTextParser.isScreenplay(text)) {
            return 'plaintext';
        }
        
        // Default to plaintext (most forgiving)
        return 'plaintext';
    }
    
    /**
     * Validate scenes before database insert
     * @param {ImportedScene[]} scenes
     * @returns {{ valid: boolean, errors: string[] }}
     */
    static validateScenes(scenes) {
        const errors = [];
        
        if (!scenes || scenes.length === 0) {
            errors.push('No scenes to import');
            return { valid: false, errors };
        }
        
        // Check for duplicate scene numbers
        const sceneNumbers = scenes.map(s => s.scene_number);
        const duplicates = sceneNumbers.filter((n, i) => sceneNumbers.indexOf(n) !== i);
        
        if (duplicates.length > 0) {
            errors.push(`Duplicate scene numbers: ${[...new Set(duplicates)].join(', ')}`);
        }
        
        // Check for empty descriptions
        const emptyDescriptions = scenes.filter(s => !s.description || s.description.trim().length === 0);
        if (emptyDescriptions.length > 0) {
            errors.push(`${emptyDescriptions.length} scene(s) have empty descriptions`);
        }
        
        // Check for scenes with very low confidence
        const veryLowConfidence = scenes.filter(s => s.sourceMeta.confidence < 0.5);
        if (veryLowConfidence.length > 0) {
            errors.push(`${veryLowConfidence.length} scene(s) have very low confidence (<0.5)`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Create scenes in database from import
     * Uses SceneService for consistent scene creation
     * @param {string} projectId
     * @param {ImportedScene[]} importedScenes - Only enabled scenes
     * @returns {Promise<Scene[]>} Created scenes
     */
    static async createScenesFromImport(projectId, importedScenes) {
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        
        // Filter to only enabled scenes
        const enabledScenes = importedScenes.filter(s => s.isEnabled);
        
        if (enabledScenes.length === 0) {
            throw new Error('No scenes enabled for import');
        }
        
        // Validate
        const validation = this.validateScenes(enabledScenes);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Extract unique locations from scenes
        const uniqueLocations = [...new Set(
            enabledScenes
                .filter(scene => scene.location) // Only scenes with location
                .map(scene => scene.location)
        )];
        
        // Create location records and build location map
        const { supabaseClient } = await import('../api/supabaseClient.js');
        const locationMap = {}; // locationName -> location_id
        
        for (const locationName of uniqueLocations) {
            const location = await supabaseClient.getOrCreateLocation(projectId, locationName);
            locationMap[locationName] = location.id;
        }
        
        // Extract unique characters from scenes
        const uniqueCharacters = [...new Set(
            enabledScenes
                .filter(scene => scene.characters && scene.characters.length > 0)
                .flatMap(scene => scene.characters)
        )];
        
        // OPTIMIZED: Bulk create all characters in single operation
        const characters = await CharacterService.createBulkOptimized(projectId, uniqueCharacters);
        
        // Build character name → ID map for fast lookups
        const characterMap = {}; // characterName → character_id
        characters.forEach(char => {
            characterMap[char.name] = char.id;
            // Also map normalized name for fuzzy matching
            characterMap[char.normalized_name] = char.id;
        });
        
        // Helper to find character ID by name (with normalization fallback)
        const findCharacterId = (name) => {
            return characterMap[name] || 
                   characterMap[CharacterService.normalizeCharacterName(name)];
        };
        
        // Convert to database objects and add location_id
        const scenesData = enabledScenes.map(scene => {
            const dbObject = scene.toDatabaseObject(projectId);
            
            // Add location_id if location exists
            if (scene.location && locationMap[scene.location]) {
                dbObject.location_id = locationMap[scene.location];
            }
            
            return dbObject;
        });
        
        // Use SceneService for bulk creation
        // This ensures story_order is calculated correctly
        const createdScenes = await SceneService.createBulk(projectId, scenesData);
        
        // OPTIMIZED: Bulk link characters to scenes in single query
        const sceneCharacterLinks = [];
        
        for (let i = 0; i < createdScenes.length; i++) {
            const scene = createdScenes[i];
            const importedScene = enabledScenes[i];
            
            // Build links for all characters in this scene
            if (importedScene.characters && importedScene.characters.length > 0) {
                for (const characterName of importedScene.characters) {
                    const characterId = findCharacterId(characterName);
                    if (characterId) {
                        sceneCharacterLinks.push({
                            sceneId: scene.id,
                            characterId: characterId
                        });
                    }
                }
            }
        }
        
        // Execute bulk link in single query
        if (sceneCharacterLinks.length > 0) {
            await CharacterService.addToScenesBulk(sceneCharacterLinks);
        }
        
        return createdScenes;
    }
    
    /**
     * Get import summary for UI display
     * @param {ScriptImportResult} result
     * @returns {Object}
     */
    static getImportSummary(result) {
        const enabledScenes = result.scenes.filter(s => s.isEnabled);
        const disabledScenes = result.scenes.filter(s => !s.isEnabled);
        const scenesWithWarnings = result.getScenesWithWarnings();
        const lowConfidenceScenes = result.getLowConfidenceScenes();
        
        return {
            totalScenes: result.scenes.length,
            enabledScenes: enabledScenes.length,
            disabledScenes: disabledScenes.length,
            scenesWithWarnings: scenesWithWarnings.length,
            lowConfidenceScenes: lowConfidenceScenes.length,
            totalCharacters: result.metadata.totalCharacters,
            characters: result.getAllCharacters(),
            title: result.metadata.title,
            author: result.metadata.author,
            warnings: result.metadata.parseWarnings
        };
    }
    
    /**
     * Re-number scenes sequentially
     * Useful after user reordering
     * @param {ImportedScene[]} scenes
     */
    static renumberScenes(scenes) {
        scenes.forEach((scene, index) => {
            scene.scene_number = String(index + 1);
            scene.story_order = index + 1;
        });
    }
    
    /**
     * Merge multiple scenes into one
     * @param {ImportedScene[]} scenes - Scenes to merge
     * @returns {ImportedScene}
     */
    static mergeScenes(scenes) {
        if (scenes.length === 0) {
            throw new Error('No scenes to merge');
        }
        
        if (scenes.length === 1) {
            return scenes[0];
        }
        
        const first = scenes[0];
        const merged = new ImportedScene({
            ...first,
            scene_number: first.scene_number,
            description: first.description,
            rawText: scenes.map(s => s.rawText).join('\n\n'),
            characters: [...new Set(scenes.flatMap(s => s.characters))],
            sourceMeta: {
                lineStart: first.sourceMeta.lineStart,
                lineEnd: scenes[scenes.length - 1].sourceMeta.lineEnd,
                confidence: Math.min(...scenes.map(s => s.sourceMeta.confidence)),
                warnings: [...new Set(scenes.flatMap(s => s.sourceMeta.warnings))]
            }
        });
        
        merged.sourceMeta.warnings.push(`Merged from ${scenes.length} scenes`);
        
        return merged;
    }
}
