// =================================================================
// PLAIN TEXT PARSER - Heuristic-based Screenplay Parser
// =================================================================
// Parses traditional screenplay format (non-Fountain)
// Uses pattern matching and formatting heuristics

import { ImportedScene } from '../models/ImportedScene.js';
import { SceneNormalizer } from '../utils/sceneNormalizer.js';

export class PlainTextParser {
    
    /**
     * Parse plain text screenplay into ImportedScene array
     * @param {string} text - Raw screenplay text
     * @returns {ImportedScene[]} Array of normalized scenes
     */
    parse(text) {
        if (!text || text.trim().length === 0) {
            return [];
        }
        
        const lines = text.split('\n');
        const scenes = [];
        let currentScene = null;
        let sceneIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Check if this is a scene heading
            if (this.isSceneHeading(trimmed)) {
                // Save previous scene
                if (currentScene) {
                    currentScene.sourceMeta.lineEnd = i;
                    scenes.push(this.finalizeScene(currentScene));
                }
                
                // Start new scene
                currentScene = this.createScene(trimmed, i, sceneIndex++);
            }
            // Add content to current scene
            else if (currentScene && trimmed.length > 0) {
                this.addLineToScene(currentScene, line, trimmed);
            }
        }
        
        // Don't forget last scene
        if (currentScene) {
            currentScene.sourceMeta.lineEnd = lines.length;
            scenes.push(this.finalizeScene(currentScene));
        }
        
        return scenes;
    }
    
    /**
     * Check if a line is a scene heading
     * Heuristics:
     * - Starts with INT, EXT, INT/EXT, INT./EXT., I/E
     * - Often all caps
     * - May have scene number prefix
     * @private
     */
    isSceneHeading(line) {
        if (!line || line.length === 0) return false;
        
        // Skip common screenplay elements that are all caps but not scene headings
        if (this.isTransition(line)) return false;
        if (this.isCharacterName(line)) return false;
        
        // Pattern 1: Classic INT/EXT heading (case insensitive)
        const intExtPattern = /^(INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT\.?|EXT\.?|I\/E)\s+/i;
        if (intExtPattern.test(line)) {
            return true;
        }
        
        // Pattern 2: Scene number + INT/EXT
        // Example: "1. INT. BEDROOM - DAY"
        const numberedPattern = /^\d+[A-Z]?\.\s+(INT|EXT|I\/E)/i;
        if (numberedPattern.test(line)) {
            return true;
        }
        
        // Pattern 3: All caps with location-like structure
        // Must be all caps and contain at least one word + dash
        if (line === line.toUpperCase() && line.includes('-')) {
            // Check if it has location-like structure
            const parts = line.split('-');
            if (parts.length >= 2 && parts[0].trim().length > 3) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if line is a transition (CUT TO:, FADE IN:, etc.)
     * @private
     */
    isTransition(line) {
        const transitions = [
            'CUT TO:', 'FADE IN:', 'FADE OUT:', 'FADE TO:', 
            'DISSOLVE TO:', 'SMASH CUT TO:', 'MATCH CUT TO:',
            'FADE TO BLACK', 'THE END'
        ];
        
        return transitions.some(t => line.toUpperCase().includes(t));
    }
    
    /**
     * Check if line is a character name (for dialogue)
     * Character names are centered and often all caps
     * @private
     */
    isCharacterName(line) {
        // Must be all caps
        if (line !== line.toUpperCase()) return false;
        
        // Check for parentheticals (V.O.), (O.S.), etc.
        if (line.includes('(')) {
            return /^[A-Z\s]+\([^)]+\)$/.test(line);
        }
        
        // Must be reasonably short (names aren't very long)
        if (line.length > 30) return false;
        
        // Must not contain numbers or special chars (except spaces)
        if (/[0-9!@#$%^&*]/.test(line)) return false;
        
        return true;
    }
    
    /**
     * Create ImportedScene from heading line
     * @private
     */
    createScene(heading, lineNumber, index) {
        // Parse heading
        const parsed = SceneNormalizer.parseHeading(heading);
        
        // Extract scene number if present
        const sceneNumber = SceneNormalizer.extractSceneNumber(heading) || String(index + 1);
        
        return new ImportedScene({
            scene_number: sceneNumber,
            description: heading,
            story_order: index + 1,
            int_ext: parsed.int_ext,
            location: SceneNormalizer.normalizeLocation(parsed.location),
            time: parsed.time,
            continuity: parsed.continuity,
            rawText: '',
            characters: [],
            sourceMeta: {
                lineStart: lineNumber + 1, // 1-indexed for user display
                lineEnd: 0,
                confidence: 0.8, // Lower confidence for plain text parsing
                warnings: []
            }
        });
    }
    
    /**
     * Add line to current scene
     * Detect characters, dialogue, action
     * @private
     */
    addLineToScene(scene, line, trimmed) {
        // Add to raw text
        scene.rawText += line + '\n';
        
        // Check if this is a character name (before dialogue)
        if (this.isCharacterName(trimmed)) {
            const characterName = this.normalizeCharacterName(trimmed);
            if (characterName && !scene.characters.includes(characterName)) {
                scene.characters.push(characterName);
            }
        }
    }
    
    /**
     * Finalize scene
     * @private
     */
    finalizeScene(scene) {
        // Trim raw text
        scene.rawText = scene.rawText.trim();
        
        // Calculate confidence
        scene.sourceMeta.confidence = SceneNormalizer.calculateConfidence(scene);
        
        // Plain text has lower confidence by default
        scene.sourceMeta.confidence *= 0.9;
        
        // Add warning if no INT/EXT was detected
        if (!scene.int_ext) {
            scene.sourceMeta.warnings.push('No INT/EXT designation found');
        }
        
        return scene;
    }
    
    /**
     * Normalize character name
     * Remove parentheticals, trim whitespace
     * @private
     */
    normalizeCharacterName(name) {
        if (!name) return '';
        
        return name
            .replace(/\s*\([^)]*\)/g, '') // Remove (V.O.), (O.S.), etc.
            .trim();
    }
    
    /**
     * Detect if text looks like a screenplay
     * @param {string} text
     * @returns {boolean}
     */
    static isScreenplay(text) {
        if (!text) return false;
        
        // Count potential scene headings
        const lines = text.split('\n');
        let headingCount = 0;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (/^(INT|EXT|INT\/EXT|I\/E)[\.\s]/i.test(trimmed)) {
                headingCount++;
            }
        }
        
        // If we found at least 3 scene headings, it's probably a screenplay
        return headingCount >= 3;
    }
}
