// =================================================================
// SCENE NORMALIZER - Data Normalization Layer
// =================================================================
// Normalizes parsed scene data into standard format
// Maps heading components to database fields

export class SceneNormalizer {
    
    /**
     * Parse scene heading into components
     * Examples:
     *   "INT. BEDROOM - DAY" -> { int_ext: "INT", location: "BEDROOM", time: "DAY" }
     *   "EXT./INT. OFFICE - CONTINUOUS" -> { int_ext: "EXT/INT", location: "OFFICE", continuity: "CONTINUOUS" }
     */
    static parseHeading(heading) {
        if (!heading || typeof heading !== 'string') {
            return { int_ext: null, location: '', time: null, continuity: null };
        }
        
        // Normalize whitespace
        const normalized = heading.replace(/\s+/g, ' ').trim();
        
        // Pattern: (INT/EXT/etc.) (LOCATION) - (TIME/CONTINUITY)
        // More flexible pattern that handles variations
        const pattern = /^(INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT\.?|EXT\.?|I\/E)\s+(.+?)(?:\s+-\s+(.+))?$/i;
        const match = normalized.match(pattern);
        
        if (!match) {
            // Couldn't parse - return raw as location
            return {
                int_ext: null,
                location: normalized,
                time: null,
                continuity: null
            };
        }
        
        const [, intExtRaw, location, timeOrContinuity] = match;
        
        // Normalize INT/EXT
        const int_ext = this.normalizeIntExt(intExtRaw);
        
        // Parse time/continuity
        const { time, continuity } = this.parseTimeOrContinuity(timeOrContinuity);
        
        return {
            int_ext,
            location: location.trim(),
            time,
            continuity
        };
    }
    
    /**
     * Normalize INT/EXT variations to standard format
     * INT., INT, I/E -> "INT"
     * EXT., EXT -> "EXT"
     * INT./EXT., INT/EXT, I/E -> "INT/EXT"
     */
    static normalizeIntExt(value) {
        if (!value) return null;
        
        const normalized = value.toUpperCase().replace(/\./g, '');
        
        // Map variations
        const mapping = {
            'INT': 'INT',
            'EXT': 'EXT',
            'INT/EXT': 'INT/EXT',
            'EXT/INT': 'EXT/INT',
            'I/E': 'INT/EXT',
            'E/I': 'EXT/INT'
        };
        
        return mapping[normalized] || null;
    }
    
    /**
     * Parse time or continuity from the third part of heading
     * DAY, NIGHT, MORNING -> time
     * CONTINUOUS, LATER, SAME TIME -> continuity
     */
    static parseTimeOrContinuity(value) {
        if (!value) {
            return { time: null, continuity: null };
        }
        
        const normalized = value.toUpperCase().trim();
        
        // Known time values
        const timeValues = ['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING', 'DAWN', 'DUSK', 'SUNRISE', 'SUNSET'];
        
        // Known continuity values
        const continuityValues = [
            'CONTINUOUS', 'LATER', 'SAME TIME', 'MOMENTS LATER', 
            'FLASHBACK', 'FLASH FORWARD', 'DREAM SEQUENCE', 'MONTAGE'
        ];
        
        // Check time first
        if (timeValues.includes(normalized)) {
            return { time: normalized, continuity: null };
        }
        
        // Check continuity
        if (continuityValues.includes(normalized)) {
            return { time: null, continuity: normalized };
        }
        
        // Check partial matches for continuity (e.g., "CONT" -> "CONTINUOUS")
        for (const cont of continuityValues) {
            if (cont.startsWith(normalized) || normalized.startsWith(cont)) {
                return { time: null, continuity: cont };
            }
        }
        
        // Default: treat as time if it's a single word, otherwise continuity
        if (!normalized.includes(' ')) {
            return { time: normalized, continuity: null };
        }
        
        return { time: null, continuity: normalized };
    }
    
    /**
     * Extract scene number from heading
     * Handles: "1", "1A", "12B", "001"
     */
    static extractSceneNumber(heading) {
        if (!heading) return null;
        
        // Pattern: number + optional letter at start of line
        const pattern = /^(\d+[A-Z]?)\b/i;
        const match = heading.match(pattern);
        
        return match ? match[1] : null;
    }
    
    /**
     * Calculate confidence score for a parsed scene
     * 1.0 = perfect, 0.0 = very uncertain
     */
    static calculateConfidence(scene) {
        let score = 1.0;
        
        // Penalties for missing data
        if (!scene.int_ext) score -= 0.1;
        if (!scene.location || scene.location.length === 0) score -= 0.2;
        if (!scene.time && !scene.continuity) score -= 0.1;
        if (scene.characters.length === 0) score -= 0.05;
        
        // Warnings for suspicious data
        if (scene.location.length > 50) {
            scene.sourceMeta.warnings.push('Very long location name - might include extra text');
            score -= 0.1;
        }
        
        if (scene.description.length > 200) {
            scene.sourceMeta.warnings.push('Very long scene heading - verify correctness');
            score -= 0.05;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * Normalize location name
     * Remove extra spaces, standardize capitalization
     */
    static normalizeLocation(location) {
        if (!location) return '';
        
        return location
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase(); // Locations are typically all caps in screenplays
    }
    
    /**
     * Detect language of script (for future internationalization)
     * Returns: 'en', 'nl', 'de', 'fr', etc.
     */
    static detectLanguage(text) {
        const intlPatterns = {
            nl: /\b(BINNEN|BUITEN)\b/gi,
            de: /\b(INNEN|AUSSEN)\b/gi,
            fr: /\b(INT|EXT)\b/gi,  // French uses English INT/EXT
            es: /\b(INT|EXT)\b/gi   // Spanish uses English INT/EXT
        };
        
        for (const [lang, pattern] of Object.entries(intlPatterns)) {
            const matches = text.match(pattern);
            if (matches && matches.length > 3) {
                return lang;
            }
        }
        
        return 'en'; // Default to English
    }
}
