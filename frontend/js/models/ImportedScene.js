// =================================================================
// IMPORTED SCENE MODEL
// =================================================================
// Normalized scene object from script import
// Compliant with existing scenes table schema

export class ImportedScene {
    constructor(data = {}) {
        // Required fields (for database)
        this.scene_number = data.scene_number || '';
        this.description = data.description || '';
        this.story_order = data.story_order || 0;
        
        // Parsed components (for UI editing)
        this.int_ext = data.int_ext || null;
        this.location = data.location || '';
        this.time = data.time || null;
        this.continuity = data.continuity || null;
        
        // Raw content & metadata
        this.rawText = data.rawText || '';
        this.characters = data.characters || [];
        
        // Source tracing
        this.sourceMeta = {
            lineStart: data.sourceMeta?.lineStart || 0,
            lineEnd: data.sourceMeta?.lineEnd || 0,
            confidence: data.sourceMeta?.confidence || 1.0,
            warnings: data.sourceMeta?.warnings || []
        };
        
        // UI state (temporary, not saved to database)
        this.isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
        this.hasChanges = false;
    }
    
    /**
     * Convert to database-compatible scene object
     */
    toDatabaseObject(projectId) {
        const dbObj = {
            project_id: projectId,
            scene_number: this.scene_number,
            description: this.description,
            story_order: this.story_order,
            raw_text: this.rawText || null,
            ...(this.int_ext && { int_ext: this.int_ext }),
            ...(this.location && { location: this.location }),
            ...(this.time && { time: this.time }),
            ...(this.continuity && { continuity: this.continuity }),
            shooting_days: [],
            shooting_dates: []
        };
        console.log('[ImportedScene] toDatabaseObject for scene:', this.scene_number, 'raw_text length:', dbObj.raw_text?.length || 0);
        return dbObj;
    }
    
    /**
     * Get display title for UI
     */
    getDisplayTitle() {
        if (this.description) {
            return this.description;
        }
        
        const parts = [];
        if (this.int_ext) parts.push(this.int_ext);
        if (this.location) parts.push(this.location);
        if (this.time) parts.push(this.time);
        
        return parts.join(' - ') || 'UNTITLED SCENE';
    }
}

/**
 * Script import result container
 */
export class ScriptImportResult {
    constructor() {
        this.scenes = [];
        this.metadata = {
            title: '',
            author: '',
            totalScenes: 0,
            totalCharacters: 0,
            parseWarnings: []
        };
        this.rawText = '';
    }
    
    /**
     * Get unique character names across all scenes
     */
    getAllCharacters() {
        const characterSet = new Set();
        this.scenes.forEach(scene => {
            scene.characters.forEach(char => characterSet.add(char));
        });
        return Array.from(characterSet).sort();
    }
    
    /**
     * Get scenes that have warnings
     */
    getScenesWithWarnings() {
        return this.scenes.filter(s => s.sourceMeta.warnings.length > 0);
    }
    
    /**
     * Get scenes with low confidence
     */
    getLowConfidenceScenes(threshold = 0.7) {
        return this.scenes.filter(s => s.sourceMeta.confidence < threshold);
    }
}
