// =================================================================
// SCENE SERVICE - Business Logic Layer
// =================================================================
// Handles all scene-related business logic
// Independent of database implementation

import { supabaseClient } from '../api/supabaseClient.js';

export class SceneService {
    static async getAll(projectId) {
        return await supabaseClient.getScenes(projectId);
    }

    static async getById(sceneId) {
        return await supabaseClient.getScene(sceneId);
    }

    static async create(projectId, sceneData) {
        // Calculate next story order
        const existingScenes = await this.getAll(projectId);
        const maxOrder = existingScenes.length > 0 
            ? Math.max(...existingScenes.map(s => s.story_order))
            : 0;

        const scene = {
            project_id: projectId,
            scene_number: sceneData.scene_number,
            description: sceneData.description,
            story_order: maxOrder + 1,
            shooting_days: sceneData.shooting_days || [],
            shooting_dates: sceneData.shooting_dates || [],
            // Include all optional fields (only if they exist in DB schema)
            ...(sceneData.time && { time: sceneData.time }),
            ...(sceneData.conditions && { conditions: sceneData.conditions }),
            ...(sceneData.location_id && { location_id: sceneData.location_id }),
            ...(sceneData.int_ext && { int_ext: sceneData.int_ext }),
            ...(sceneData.continuity && { continuity: sceneData.continuity }),
            ...(sceneData.day_night && { day_night: sceneData.day_night }),
            ...(sceneData.script_day && { script_day: sceneData.script_day }),
            ...(sceneData.pages && { pages: sceneData.pages }),
            ...(sceneData.split_group_id && { split_group_id: sceneData.split_group_id }),
            ...(sceneData.shooting_days_count != null && { shooting_days_count: sceneData.shooting_days_count })
        };

        return await supabaseClient.createScene(scene);
    }

    static async createDemoScenes(projectId) {
        const demoScenes = [
            {
                project_id: projectId,
                scene_number: "1",
                description: "EXT. CITY STREET - DAY",
                story_order: 1,
                shooting_days: [3, 7],
                shooting_dates: []
            },
            {
                project_id: projectId,
                scene_number: "2",
                description: "INT. COFFEE SHOP - DAY",
                story_order: 2,
                shooting_days: [1],
                shooting_dates: []
            },
            {
                project_id: projectId,
                scene_number: "3",
                description: "EXT. PARK - DAY",
                story_order: 3,
                shooting_days: [2],
                shooting_dates: []
            }
        ];

        return await supabaseClient.createScenes(demoScenes);
    }

    /**
     * Bulk create scenes (optimized for script import)
     * Maintains story_order sequence
     * @param {string} projectId - Project UUID
     * @param {Array} scenesData - Array of scene data objects
     * @returns {Promise<Array>} Created scenes
     */
    static async createBulk(projectId, scenesData) {
        if (!scenesData || scenesData.length === 0) {
            return [];
        }

        // Get existing scenes to calculate starting story_order
        const existingScenes = await this.getAll(projectId);
        let maxOrder = existingScenes.length > 0 
            ? Math.max(...existingScenes.map(s => s.story_order))
            : 0;
        
        // Prepare scenes with story_order
        const scenesWithOrder = scenesData.map((sceneData, index) => ({
            project_id: projectId,
            scene_number: sceneData.scene_number,
            description: sceneData.description,
            story_order: maxOrder + index + 1,
            shooting_days: sceneData.shooting_days || [],
            shooting_dates: sceneData.shooting_dates || [],
            // Include all optional fields (only if they exist in DB schema)
            ...(sceneData.time && { time: sceneData.time }),
            ...(sceneData.conditions && { conditions: sceneData.conditions }),
            ...(sceneData.location_id && { location_id: sceneData.location_id }),
            ...(sceneData.int_ext && { int_ext: sceneData.int_ext }),
            ...(sceneData.continuity && { continuity: sceneData.continuity }),
            ...(sceneData.day_night && { day_night: sceneData.day_night }),
            ...(sceneData.script_day && { script_day: sceneData.script_day }),
            ...(sceneData.pages && { pages: sceneData.pages }),
            ...(sceneData.split_group_id && { split_group_id: sceneData.split_group_id }),
            ...(sceneData.shooting_days_count != null && { shooting_days_count: sceneData.shooting_days_count })
        }));
        
        // Single database transaction for all scenes
        return await supabaseClient.createScenes(scenesWithOrder);
    }

    static async update(sceneId, updates) {
        return await supabaseClient.updateScene(sceneId, updates);
    }

    static async delete(sceneId) {
        return await supabaseClient.deleteScene(sceneId);
    }

    static async reorder(scenes) {
        const updates = scenes.map(s => ({ id: s.id, story_order: s.story_order }));
        return await supabaseClient.updateScenes(updates);
    }

    /**
     * Check if scenes are demo scenes (created at project initialization)
     * @param {Array} scenes - Array of scenes to check
     * @returns {boolean} True if all scenes match demo pattern
     */
    static areDemoScenes(scenes) {
        if (!scenes || scenes.length === 0) return false;
        if (scenes.length !== 3) return false;
        
        const demoPatterns = [
            "EXT. CITY STREET - DAY",
            "INT. COFFEE SHOP - DAY",
            "EXT. PARK - DAY"
        ];
        
        return scenes.every((scene, index) => 
            scene.description === demoPatterns[index] &&
            scene.scene_number === String(index + 1)
        );
    }

    /**
     * Delete all scenes for a project
     * @param {string} projectId - Project UUID
     */
    static async deleteAll(projectId) {
        const scenes = await this.getAll(projectId);
        const deletePromises = scenes.map(scene => this.delete(scene.id));
        return await Promise.all(deletePromises);
    }

    // =================================================================
    // CALENDAR OPERATIONS
    // =================================================================

    static async getByDate(projectId, date) {
        return await supabaseClient.getScenesByDate(projectId, date);
    }

    static async getByDateRange(projectId, startDate, endDate) {
        return await supabaseClient.getScenesByDateRange(projectId, startDate, endDate);
    }

    static async addShootingDate(sceneId, date) {
        const scene = await this.getById(sceneId);
        const dates = scene.shooting_dates || [];
        
        if (!dates.includes(date)) {
            dates.push(date);
            dates.sort();
            await this.update(sceneId, { shooting_dates: dates });
        }
    }

    static async removeShootingDate(sceneId, date) {
        const scene = await this.getById(sceneId);
        const dates = (scene.shooting_dates || []).filter(d => d !== date);
        await this.update(sceneId, { shooting_dates: dates });
    }

    static async setShootingDates(sceneId, dates) {
        await this.update(sceneId, { shooting_dates: dates.sort() });
    }

    // =================================================================
    // GROUPING & SORTING
    // =================================================================

    static groupByShootingDay(scenes) {
        const sceneDayPairs = [];
        scenes.forEach(scene => {
            (scene.shooting_days || []).forEach(day => {
                sceneDayPairs.push({ scene, day });
            });
        });

        const groupedByDay = {};
        sceneDayPairs.forEach(pair => {
            if (!groupedByDay[pair.day]) {
                groupedByDay[pair.day] = [];
            }
            groupedByDay[pair.day].push(pair.scene);
        });

        return groupedByDay;
    }

    static groupByShootingDate(scenes) {
        const sceneDatePairs = [];
        scenes.forEach(scene => {
            (scene.shooting_dates || []).forEach(date => {
                sceneDatePairs.push({ scene, date });
            });
        });

        const groupedByDate = {};
        sceneDatePairs.forEach(pair => {
            if (!groupedByDate[pair.date]) {
                groupedByDate[pair.date] = [];
            }
            groupedByDate[pair.date].push(pair.scene);
        });

        return groupedByDate;
    }
}
