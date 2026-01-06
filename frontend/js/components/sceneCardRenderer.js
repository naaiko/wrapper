// =================================================================
// SCENE CARD RENDERER - Reusable component for rendering scene cards
// =================================================================

/**
 * Renders a scene card with all visual elements
 * Used for: unscheduled scenes list, previews, demos, etc.
 * 
 * @param {Object} scene - Scene object with all properties
 * @param {Object} options - Rendering options
 * @param {Array} options.locations - Available locations
 * @param {Array} options.times - Available times
 * @param {Array} options.conditions - Available conditions
 * @param {Object} options.settings - Project settings (show_int_ext, etc.)
 * @param {Array} options.continuityOptions - Continuity options
 * @param {Array} options.characters - Characters in this scene (with actor info)
 * @param {Object} options.highlightClasses - Optional classes to add for highlighting
 * @returns {HTMLElement} The rendered scene card element
 */
export function renderSceneCard(scene, options = {}) {
    const {
        locations = [],
        times = [],
        conditions = [],
        settings = {},
        continuityOptions = [],
        characters = [],
        highlightClasses = {},
        hideSplitIndicator = false
    } = options;

    const card = document.createElement('div');
    card.className = 'card bg-white border border-base-300 shadow-sm hover:shadow-md transition-shadow';
    card.style.borderRadius = '6px';
    card.dataset.sceneId = scene.id;
    
    // Build scene heading
    const heading = buildSceneHeading(scene, {
        locations,
        times,
        settings,
        continuityOptions,
        highlightClasses
    });

    // Add visual indicator if scene is part of a split group
    const isSplitScene = !!scene.split_group_id;
    const splitIndicator = (isSplitScene && !hideSplitIndicator) ? `
        <div class="tooltip tooltip-right" data-tip="Part of a split scene group">
            <div class="badge badge-xs badge-outline badge-info flex-shrink-0">🔗</div>
        </div>
    ` : '';
    
    // Get time icon if available
    let timeIconHtml = '';
    if (scene.time) {
        const timeData = times.find(t => t.id === scene.time);
        if (timeData) {
            const timeIconClass = highlightClasses.timeIcon || '';
            timeIconHtml = `
                <div class="flex-shrink-0 flex items-center justify-center ${timeIconClass}" style="width: 25px; height: 25px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.1);">
                    <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0" style="width: 15px; height: 15px; color: rgba(0, 0, 0, 0.7);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        ${timeData.icon}
                    </svg>
                </div>
            `;
        }
    }
    
    // Get condition icons if available
    let conditionIconsHtml = '';
    if (scene.conditions && scene.conditions.length > 0) {
        const icons = scene.conditions
            .map(condId => {
                const condData = conditions.find(c => c.id === condId);
                return condData ? condData.icon : null;
            })
            .filter(icon => icon !== null);
        
        if (icons.length > 0) {
            const isSingle = icons.length === 1;
            const iconSvgs = icons.map(icon => `
                <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0" style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${icon}
                </svg>
            `).join('');
            const containerStyle = isSingle 
                ? 'width: 25px; height: 25px; border-radius: 50%;' 
                : 'height: 25px; padding: 0 8px; border-radius: 12px;';
            const conditionIconClass = highlightClasses.conditionIcon || '';
            conditionIconsHtml = `
                <div class="flex-shrink-0 flex items-center justify-center gap-1 ${conditionIconClass}" style="${containerStyle} background-color: rgba(0, 0, 0, 0.05);">
                    ${iconSvgs}
                </div>
            `;
        }
    }

    // Days indicator for unscheduled scenes
    const daysCount = scene.shooting_days_count || 1;
    const daysIndicator = daysCount > 1 ? `
        <div class="badge badge-ghost badge-xs flex-shrink-0" style="padding: 2px 6px; font-size: 10px; opacity: 0.7;">
            ${daysCount}d
        </div>
    ` : '';
    
    // Characters display
    let charactersHtml = '';
    if (characters && characters.length > 0) {
        const displayCharacters = characters.slice(0, 3);
        const remaining = characters.length - displayCharacters.length;
        
        charactersHtml = `
            <div class="flex items-center gap-1 flex-wrap" style="margin-top: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-base-content/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                ${displayCharacters.map(char => {
                    const hasActor = char.character?.actor_assignments?.length > 0;
                    const badgeClass = hasActor ? 'badge-primary' : 'badge-ghost';
                    return `<div class="badge badge-xs ${badgeClass}" style="padding: 2px 4px; font-size: 9px;">${char.character?.name || 'Unknown'}</div>`;
                }).join('')}
                ${remaining > 0 ? `<div class="badge badge-xs badge-ghost" style="padding: 2px 4px; font-size: 9px;">+${remaining}</div>` : ''}
            </div>
        `;
    }

    card.innerHTML = `
        <div class="card-body p-1.5">
            <div class="flex items-center gap-2">
                <div class="badge badge-primary badge-xs flex-shrink-0" style="padding: 2px 6px; font-size: 10px;">${scene.scene_number}</div>
                ${scene.script_day ? `<div class="badge badge-ghost badge-xs flex-shrink-0" style="padding: 2px 6px; font-size: 10px;">SD ${scene.script_day}</div>` : ''}
                ${splitIndicator}
                ${daysIndicator}
                <p class="text-xs flex-1 line-clamp-2 text-base-content/80" id="scene-heading-${scene.id}">${heading}</p>
                ${timeIconHtml}
                ${conditionIconsHtml}
            </div>
            ${charactersHtml}
        </div>
    `;
    
    return card;
}

/**
 * Build a properly formatted scene heading from scene properties
 * Follows industry standard format: INT./EXT. LOCATION - TIME - CONTINUITY
 * 
 * @param {Object} scene - Scene object with properties
 * @param {Object} options - Build options (locations, times, settings, continuityOptions)
 * @param {Object} options.highlightClasses - Optional classes for highlighting parts
 * @returns {string} Formatted scene heading with optional highlight spans
 */
export function buildSceneHeading(scene, options = {}) {
    const {
        locations = [],
        times = [],
        settings = {},
        continuityOptions = [],
        highlightClasses = {}
    } = options;

    const parts = [];
    
    // INT/EXT prefix
    if (settings.show_int_ext && scene.int_ext) {
        parts.push(scene.int_ext + '.');
    }
    
    // Location
    if (settings.show_location && scene.location_id) {
        const location = locations.find(l => l.id === scene.location_id);
        if (location) {
            parts.push(location.name);
        }
    }
    
    // If we have INT/EXT and/or location, join them
    let heading = parts.join(' ');
    
    // Time of day (after a dash)
    if (settings.show_time && scene.time) {
        const timeObj = times.find(t => t.id === scene.time);
        if (timeObj) {
            const timeClass = highlightClasses.timeLabel ? `class="${highlightClasses.timeLabel}"` : '';
            const timeLabel = `<span ${timeClass}>${timeObj.label.toUpperCase()}</span>`;
            heading += (heading ? ' - ' : '') + timeLabel;
        }
    }
    
    // Continuity (after a dash)
    if (settings.show_continuity && scene.continuity) {
        const continuityObj = continuityOptions.find(c => c.id === scene.continuity);
        if (continuityObj) {
            heading += (heading ? ' - ' : '') + continuityObj.label;
        }
    }
    
    // Fall back to description if no heading built
    if (!heading && scene.description) {
        heading = scene.description;
    }
    
    // Ultimate fallback to scene number
    if (!heading) {
        heading = `Scene ${scene.scene_number}`;
    }
    
    return heading;
}
