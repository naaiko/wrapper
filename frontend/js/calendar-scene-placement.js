// =================================================================
// SCENE PLACEMENT LOGIC
// =================================================================
// Handles placement of scenes with shooting_days_count awareness
// Accounts for non-shooting days and automatic splitting

/**
 * Place a scene starting from a given date, accounting for shooting_days_count and non-shooting days
 * @param {Date} startDate - Starting date for placement
 * @param {number} shootingDaysCount - Total number of shooting days needed
 * @param {function} isNonShootingDay - Function to check if a date string is a non-shooting day
 * @returns {Object} { shootingDates: string[], needsSplit: boolean, splitInfo: {...} }
 */
export function calculateScenePlacement(startDate, shootingDaysCount, isNonShootingDay) {
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const shootingDates = [];
    const allDatesInSpan = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let shootingDaysAdded = 0;
    let maxIterations = 365; // Safety limit
    let iterations = 0;
    
    // Collect shooting days until we reach the required count
    while (shootingDaysAdded < shootingDaysCount && iterations < maxIterations) {
        const dateStr = formatDate(currentDate);
        allDatesInSpan.push(dateStr);
        
        if (!isNonShootingDay(dateStr)) {
            shootingDates.push(dateStr);
            shootingDaysAdded++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
        iterations++;
    }
    
    if (iterations >= maxIterations) {
        throw new Error('Could not place scene: too many iterations');
    }
    
    // Check if there are non-shooting days in the middle of the span
    const nonShootingDaysInSpan = allDatesInSpan.filter(date => isNonShootingDay(date));
    
    if (nonShootingDaysInSpan.length === 0) {
        // No non-shooting days, simple placement
        return {
            shootingDates,
            needsSplit: false,
            allDatesInSpan
        };
    }
    
    // Check if any non-shooting days are in the middle (not at edges)
    const firstShootingDate = shootingDates[0];
    const lastShootingDate = shootingDates[shootingDates.length - 1];
    const nonShootingInMiddle = nonShootingDaysInSpan.filter(nsDay => 
        nsDay > firstShootingDate && nsDay < lastShootingDate
    );
    
    if (nonShootingInMiddle.length === 0) {
        // Non-shooting days only at edges, no split needed
        return {
            shootingDates,
            needsSplit: false,
            allDatesInSpan
        };
    }
    
    // Find all continuous groups of shooting days (split by non-shooting days)
    const splitParts = [];
    let currentPart = [];
    
    for (const date of allDatesInSpan) {
        if (isNonShootingDay(date)) {
            // End current part if it has dates
            if (currentPart.length > 0) {
                splitParts.push([...currentPart]);
                currentPart = [];
            }
        } else if (shootingDates.includes(date)) {
            // Add shooting date to current part
            currentPart.push(date);
        }
    }
    
    // Add last part if any
    if (currentPart.length > 0) {
        splitParts.push(currentPart);
    }
    
    // Only split if we have multiple parts with non-shooting days between them
    if (splitParts.length <= 1) {
        return {
            shootingDates,
            needsSplit: false,
            allDatesInSpan
        };
    }
    
    return {
        shootingDates,
        needsSplit: true,
        allDatesInSpan,
        splitInfo: {
            nonShootingDays: nonShootingInMiddle,
            parts: splitParts, // Array of arrays, each sub-array is a continuous group
            totalParts: splitParts.length
        }
    };
}

/**
 * Delete all scenes in a split group except the specified one
 * @param {string} keepSceneId - ID of scene to keep
 * @param {string} splitGroupId - Split group ID
 * @param {Array} allScenes - Array of all scenes
 * @param {Object} SceneService - Scene service for deletion
 * @returns {Promise<Array>} Updated scenes array
 */
export async function deleteSplitGroupScenes(keepSceneId, splitGroupId, allScenes, SceneService) {
    const scenesToDelete = allScenes.filter(s => 
        s.split_group_id === splitGroupId && s.id !== keepSceneId
    );
    
    for (const scene of scenesToDelete) {
        await SceneService.delete(scene.id);
    }
    
    return allScenes.filter(s => 
        s.split_group_id !== splitGroupId || s.id === keepSceneId
    );
}

/**
 * Get total shooting_days_count for a scene (accounting for split groups)
 * @param {Object} scene - Scene object
 * @param {Array} allScenes - Array of all scenes
 * @returns {number} Total shooting days count
 */
export function getSceneShootingDaysCount(scene, allScenes) {
    // If scene has explicit shooting_days_count, use it
    if (scene.shooting_days_count != null) {
        return scene.shooting_days_count;
    }
    
    // Otherwise, calculate from current shooting_dates
    if (scene.split_group_id) {
        // Sum all shooting dates from all scenes in split group
        const splitGroupScenes = allScenes.filter(s => s.split_group_id === scene.split_group_id);
        return splitGroupScenes.reduce((total, s) => {
            return total + (s.shooting_dates ? s.shooting_dates.length : 0);
        }, 0);
    }
    
    // Single scene, just count its dates
    return scene.shooting_dates ? scene.shooting_dates.length : 0;
}
