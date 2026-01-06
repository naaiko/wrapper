// =================================================================
// FOUNTAIN ADAPTER - Fountain.js Integration Layer
// =================================================================
// Wraps fountain.js library and converts output to our ImportedScene model
// Isolates fountain.js dependency for easy replacement if needed

import { ImportedScene } from '../models/ImportedScene.js';
import { SceneNormalizer } from '../utils/sceneNormalizer.js';

export class FountainAdapter {
    
    /**
     * Wait for fountain.js to be available
     */
    static async waitForFountain() {
        // If already loaded, return immediately
        if (typeof window.fountain !== 'undefined') {
            return;
        }
        
        // Wait up to 5 seconds for fountain to load
        const maxWait = 5000;
        const checkInterval = 100;
        let waited = 0;
        
        while (typeof window.fountain === 'undefined' && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        if (typeof window.fountain === 'undefined') {
            throw new Error('Fountain.js library failed to load. Check your internet connection and CDN availability.');
        }
    }
    
    /**
     * Parse Fountain text into ImportedScene array
     * @param {string} text - Raw Fountain text
     * @returns {ImportedScene[]} Array of normalized scenes
     */
    async parse(text) {
        if (!text || text.trim().length === 0) {
            return [];
        }
        
        // Wait for fountain.js to be available
        await FountainAdapter.waitForFountain();
        
        // Parse with fountain.js
        // fountain.parse(text, tokens_only = true) returns AST with tokens
        const output = window.fountain.parse(text, true);
        
        if (!output || !output.tokens) {
            console.warn('Fountain parsing returned no tokens');
            return [];
        }
        
        // Extract scenes from tokens
        const scenes = this.extractScenes(output.tokens, text);
        
        return scenes;
    }
    
    /**
     * Extract scenes from Fountain tokens
     * @private
     */
    extractScenes(tokens, rawText) {
        const scenes = [];
        let currentScene = null;
        let sceneIndex = 0;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Scene heading token
            if (token.type === 'scene_heading') {
                // Save previous scene if exists
                if (currentScene) {
                    scenes.push(this.finalizeScene(currentScene));
                }
                
                // Start new scene
                currentScene = this.createSceneFromToken(token, sceneIndex++, rawText);
            }
            // Add content to current scene
            else if (currentScene) {
                this.addTokenToScene(currentScene, token);
            }
        }
        
        // Don't forget last scene
        if (currentScene) {
            scenes.push(this.finalizeScene(currentScene));
        }
        
        return scenes;
    }
    
    /**
     * Create ImportedScene from scene heading token
     * @private
     */
    createSceneFromToken(token, index, rawText) {
        const heading = token.text || '';
        
        // Parse heading into components
        const parsed = SceneNormalizer.parseHeading(heading);
        
        // Extract scene number from heading if present
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
                lineStart: this.getLineNumber(rawText, token),
                lineEnd: 0, // Will be set when scene ends
                confidence: 1.0,
                warnings: []
            }
        });
    }
    
    /**
     * Add token content to current scene
     * @private
     */
    addTokenToScene(scene, token) {
        // Append to raw text
        if (token.text) {
            scene.rawText += token.text + '\n';
        }
        
        // Extract characters from dialogue
        if (token.type === 'character') {
            const characterName = this.normalizeCharacterName(token.text);
            if (characterName && !scene.characters.includes(characterName)) {
                scene.characters.push(characterName);
            }
        }
        
        // Track action and dialogue separately (for future use)
        if (token.type === 'action') {
            // Could analyze action for props, etc.
        }
        
        if (token.type === 'dialogue') {
            // Dialogue content
        }
    }
    
    /**
     * Finalize scene (calculate confidence, warnings, etc.)
     * @private
     */
    finalizeScene(scene) {
        // Calculate confidence score
        scene.sourceMeta.confidence = SceneNormalizer.calculateConfidence(scene);
        
        // Trim raw text
        scene.rawText = scene.rawText.trim();
        
        return scene;
    }
    
    /**
     * Normalize character name
     * Remove parentheticals like (V.O.), (O.S.), etc.
     * @private
     */
    normalizeCharacterName(name) {
        if (!name) return '';
        
        return name
            .replace(/\s*\([^)]*\)/g, '') // Remove (V.O.), (O.S.), etc.
            .replace(/\^/g, '')           // Remove dual dialogue marker
            .trim();
    }
    
    /**
     * Get approximate line number of token in raw text
     * @private
     */
    getLineNumber(rawText, token) {
        if (!token.text) return 0;
        
        const position = rawText.indexOf(token.text);
        if (position === -1) return 0;
        
        // Count newlines before this position
        const textBefore = rawText.substring(0, position);
        const lines = textBefore.split('\n');
        return lines.length;
    }
    
    /**
     * Detect if text is valid Fountain format
     * @param {string} text
     * @returns {boolean}
     */
    static isFountain(text) {
        if (!text) return false;
        
        // Fountain indicators:
        // - Title page elements (Title:, Author:, etc.)
        // - Scene headings with INT/EXT
        // - Forced scene headings (.INT, .EXT)
        
        const hasTitlePage = /^(Title|Credit|Author|Source|Draft date|Contact):/m.test(text);
        const hasForcedHeading = /^\.[A-Z]/m.test(text);
        const hasSceneHeadings = /^(INT|EXT|INT\/EXT|I\/E)[\.\s]/mi.test(text);
        
        return hasTitlePage || hasForcedHeading || hasSceneHeadings;
    }
    
    /**
     * Extract title page metadata from Fountain
     * @param {string} text
     * @returns {Object} { title, author, etc. }
     */
    static extractMetadata(text) {
        const metadata = {
            title: '',
            author: '',
            source: '',
            draftDate: '',
            contact: ''
        };
        
        const lines = text.split('\n');
        
        for (const line of lines) {
            // Title page ends at first empty line or scene heading
            if (line.trim() === '' || /^(INT|EXT)/i.test(line)) {
                break;
            }
            
            // Parse key: value
            const match = line.match(/^(Title|Author|Source|Draft date|Contact):\s*(.+)$/i);
            if (match) {
                const key = match[1].toLowerCase().replace(/\s+/g, '');
                const value = match[2].trim();
                
                if (key === 'title') metadata.title = value;
                if (key === 'author') metadata.author = value;
                if (key === 'source') metadata.source = value;
                if (key === 'draftdate') metadata.draftDate = value;
                if (key === 'contact') metadata.contact = value;
            }
        }
        
        return metadata;
    }
}
