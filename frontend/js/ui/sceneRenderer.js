// =================================================================
// SCENE RENDERER - UI Rendering Layer
// =================================================================
// Renders scene cards for different views (timeline, calendar, etc.)

export class SceneRenderer {
    
    /**
     * Render a single scene card
     */
    static renderCard(scene, options = {}) {
        const {
            showDragHandle = true,
            showDeleteButton = true,
            showStoryOrder = true,
            showShootingInfo = true,
            isDraggable = true,
            additionalClasses = ''
        } = options;

        const dragHandle = showDragHandle ? `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        ` : '';

        const deleteButton = showDeleteButton ? `
            <button class="btn btn-ghost btn-xs btn-square delete-scene-btn" data-scene-id="${scene.id}" title="Delete scene">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        ` : '';

        const storyOrderBadge = showStoryOrder ? `
            <div class="badge badge-outline">Story #${scene.story_order}</div>
        ` : '';

        const shootingInfo = showShootingInfo && scene.shooting_days?.length > 0 ? `
            <div class="text-xs text-base-content/60 mt-2">
                Shooting: Day ${scene.shooting_days.join(', Day ')}
            </div>
        ` : '';

        const shootingDatesInfo = showShootingInfo && scene.shooting_dates?.length > 0 ? `
            <div class="text-xs text-base-content/60 mt-2">
                📅 ${this.formatDates(scene.shooting_dates)}
            </div>
        ` : '';

        const draggableAttr = isDraggable ? 'draggable="true"' : '';
        const cursorClass = isDraggable ? 'cursor-move' : '';

        return `
            <div 
                class="card bg-base-100 shadow-md flex-shrink-0 w-80 min-h-[200px] scene-card ${cursorClass} ${additionalClasses}" 
                ${draggableAttr}
                data-scene-id="${scene.id}"
            >
                <div class="card-body p-4">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                ${dragHandle}
                                <h3 class="card-title text-lg">
                                    Scene ${scene.scene_number}
                                </h3>
                            </div>
                            <p class="text-sm text-base-content/70">${scene.description}</p>
                        </div>
                        <div class="flex flex-col gap-2 items-end">
                            ${storyOrderBadge}
                            ${deleteButton}
                        </div>
                    </div>
                    ${shootingInfo}
                    ${shootingDatesInfo}
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    static renderEmptyState(message = 'No scenes yet', subMessage = 'Click the + button to add your first scene') {
        return `
            <div class="flex items-center justify-center w-full h-full text-base-content/50">
                <div class="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    <p class="text-xl">${message}</p>
                    <p class="text-sm mt-2">${subMessage}</p>
                </div>
            </div>
        `;
    }

    /**
     * Format dates for display
     */
    static formatDates(dates) {
        if (!dates || dates.length === 0) return '';
        
        const formatted = dates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        if (formatted.length === 1) return formatted[0];
        if (formatted.length === 2) return formatted.join(' & ');
        
        return formatted.slice(0, -1).join(', ') + ' & ' + formatted[formatted.length - 1];
    }

    /**
     * Render scene card for calendar view (compact)
     */
    static renderCalendarCard(scene, options = {}) {
        const { showRemoveButton = false, sourceDate = null } = options;
        
        const removeButton = showRemoveButton ? `
            <button class="btn btn-ghost btn-circle btn-xs ml-auto remove-from-date-btn" 
                    data-scene-id="${scene.id}" 
                    data-date="${sourceDate || ''}"
                    title="Remove from this date"
                    onclick="event.stopPropagation();">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        ` : '';
        
        return `
            <div 
                class="calendar-scene-card bg-base-100 p-2 mb-1 rounded shadow-sm border-l-4 border-primary cursor-move text-xs flex items-start gap-1"
                draggable="true"
                data-scene-id="${scene.id}"
            >
                <div class="flex-1 min-w-0">
                    <div class="font-semibold">Scene ${scene.scene_number}</div>
                    <div class="text-base-content/70 truncate">${scene.description}</div>
                </div>
                ${removeButton}
            </div>
        `;
    }
}
