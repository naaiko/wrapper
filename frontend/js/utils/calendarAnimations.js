// =================================================================
// CALENDAR ANIMATION CONTROLLER - "Pink Mode"
// =================================================================
// Handles smooth animations for dragging scenes in/out of calendar

export class CalendarAnimationController {
    constructor() {
        this.animationContainer = null;
        this.currentClone = null;
        this.dragStartData = null;
        this.dragPreview = null; // Element that follows cursor
        this.init();
        console.log('🎨 CalendarAnimationController initialized');
    }

    init() {
        // Create animation container if it doesn't exist
        if (!document.getElementById('calendar-animation-container')) {
            const container = document.createElement('div');
            container.id = 'calendar-animation-container';
            document.body.appendChild(container);
            this.animationContainer = container;
            console.log('🎨 Animation container created');
        } else {
            this.animationContainer = document.getElementById('calendar-animation-container');
            console.log('🎨 Animation container found');
        }

        // Setup mouse move listener for drag preview
        document.addEventListener('mousemove', (e) => {
            if (this.dragPreview) {
                this.updateDragPreviewPosition(e.clientX, e.clientY);
            }
        });
    }

    /**
     * Called when drag starts - captures the original calendar event's appearance
     * @param {HTMLElement} sourceElement - The element being dragged (could be scene card or calendar event)
     * @param {Object} sceneData - Scene information
     * @param {MouseEvent} event - The drag event
     */
    onDragStart(sourceElement, sceneData, event) {
        console.log('�🎨🎨 ANIMATION: Drag start', sceneData);
        console.log('🎨 Source element:', sourceElement);
        console.log('🎨 Event:', event);

        // If dragging from calendar (moving an already placed event), capture its state
        const isFromCalendar = sourceElement.closest('.toastui-calendar-weekday-event-block');
        
        if (isFromCalendar) {
            const rect = sourceElement.getBoundingClientRect();
            
            this.dragStartData = {
                isFromCalendar: true,
                element: sourceElement,
                initialRect: rect,
                sceneData: sceneData,
                isMultiDay: sceneData.shooting_dates && sceneData.shooting_dates.length > 1
            };

            // Create a clone to animate
            this.createShrinkClone(sourceElement, rect, event.clientX, event.clientY);
        } else {
            // Dragging from unscheduled list
            this.dragStartData = {
                isFromCalendar: false,
                element: sourceElement,
                sceneData: sceneData,
                isMultiDay: sceneData.shooting_days_count > 1
            };
        }

        // Create drag preview that follows cursor - ALWAYS create this!
        this.createDragPreview(sourceElement, sceneData, event);

        // Add dragging class to source
        sourceElement.classList.add('dragging');
    }

    /**
     * Creates a clone element that shrinks from calendar event to cursor
     */
    createShrinkClone(sourceElement, rect, cursorX, cursorY) {
        const clone = sourceElement.cloneNode(true);
        clone.classList.add('calendar-event-clone', 'shrinking');
        
        // Copy styles
        const computedStyle = window.getComputedStyle(sourceElement);
        clone.style.backgroundColor = computedStyle.backgroundColor;
        clone.style.color = computedStyle.color;
        clone.style.border = computedStyle.border;
        clone.style.padding = computedStyle.padding;
        clone.style.fontSize = computedStyle.fontSize;
        clone.style.fontWeight = computedStyle.fontWeight;

        // Set initial position (where it currently is on calendar)
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';

        this.animationContainer.appendChild(clone);
        this.currentClone = clone;

        // Trigger shrink animation to cursor position
        requestAnimationFrame(() => {
            const targetX = cursorX - (rect.width * 0.2) / 2; // Center the shrunken version
            const targetY = cursorY - (rect.height * 0.2) / 2;
            
            clone.style.left = targetX + 'px';
            clone.style.top = targetY + 'px';
            clone.style.width = (rect.width * 0.2) + 'px';
            clone.style.height = (rect.height * 0.2) + 'px';
        });

        // Clean up after animation
        setTimeout(() => {
            if (this.currentClone === clone) {
                clone.remove();
                this.currentClone = null;
            }
        }, 500);
    }

    /**     * Creates a preview element that follows the cursor during drag
     */
    createDragPreview(sourceElement, sceneData, event) {
        console.log('🎨 Creating drag preview');
        
        // Remove any existing preview
        if (this.dragPreview) {
            this.dragPreview.remove();
        }

        // Clone the source element
        const preview = sourceElement.cloneNode(true);
        preview.style.position = 'fixed';
        preview.style.pointerEvents = 'none';
        preview.style.zIndex = '99999';
        preview.style.opacity = '0.95';
        preview.style.transform = 'scale(1.1)';
        preview.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
        preview.style.transition = 'none'; // No transition for smooth following
        preview.style.border = '3px solid #f0f'; // Bright magenta border for visibility
        preview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        // Position at cursor
        const rect = sourceElement.getBoundingClientRect();
        const left = event.clientX - rect.width / 2;
        const top = event.clientY - rect.height / 2;
        
        preview.style.left = left + 'px';
        preview.style.top = top + 'px';
        preview.style.width = rect.width + 'px';

        this.animationContainer.appendChild(preview);
        this.dragPreview = preview;

        console.log('🎨✅ Drag preview created at:', left, top, 'Size:', rect.width, 'x', rect.height);
        console.log('🎨✅ Preview element:', preview);
    }

    /**     * Called when drag ends - cleans up dragging state
     */
    onDragEnd(sourceElement) {
        console.log('🎬 Animation: Drag end');
        
        if (sourceElement) {
            sourceElement.classList.remove('dragging');
        }

        if (this.currentClone) {
            this.currentClone.remove();
            this.currentClone = null;
        }
        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }
        this.dragStartData = null;
    }

    /**
     * Called when scene is dropped on calendar - creates grow animation
     * @param {Object} dropInfo - Information about where the scene was dropped
     * @param {Function} callback - Called after animation completes
     */
    async onDrop(dropInfo, callback) {
        console.log('�🎨🎨 ANIMATION: Drop triggered', dropInfo);
        console.log('🎨 Cursor position:', dropInfo.cursorX, dropInfo.cursorY);

        const { sceneData, targetDate, cursorX, cursorY } = dropInfo;

        // Wait a frame for the calendar to potentially update
        await new Promise(resolve => setTimeout(resolve, 50));

        // Find the new calendar event element
        const calendarEvents = document.querySelectorAll('.toastui-calendar-weekday-event-block');
        let targetElement = null;

        // Try to find the event by scene ID or scene number
        for (const eventEl of calendarEvents) {
            const eventTitle = eventEl.querySelector('.toastui-calendar-event-title');
            if (eventTitle && eventTitle.textContent.includes(sceneData.scene_number)) {
                targetElement = eventEl;
                break;
            }
        }

        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            this.createGrowClone(sceneData, cursorX, cursorY, targetRect, targetElement);
        } else {
            console.warn('🎬 Animation: Could not find target calendar element');
        }

        // Execute callback after animation
        setTimeout(() => {
            if (callback) callback();
        }, 600);
    }

    /**
     * Creates a clone that grows from cursor to final calendar position
     */
    createGrowClone(sceneData, startX, startY, targetRect, targetElement) {
        console.log('🎨 Creating GROW animation from', startX, startY, 'to', targetRect);
        
        // Create a placeholder clone at cursor position
        const clone = document.createElement('div');
        clone.classList.add('calendar-event-clone', 'growing');
        
        if (sceneData.shooting_dates && sceneData.shooting_dates.length > 1) {
            clone.classList.add('multi-day');
        }

        // Copy content from target element
        clone.innerHTML = targetElement.innerHTML;

        // Copy styles from target
        const computedStyle = window.getComputedStyle(targetElement);
        clone.style.backgroundColor = computedStyle.backgroundColor;
        clone.style.color = computedStyle.color;
        clone.style.border = computedStyle.border;
        clone.style.padding = computedStyle.padding;
        clone.style.fontSize = computedStyle.fontSize;
        clone.style.fontWeight = computedStyle.fontWeight;
        clone.style.borderRadius = computedStyle.borderRadius;

        // Start small at cursor
        const smallWidth = 80;
        const smallHeight = 30;
        clone.style.left = (startX - smallWidth / 2) + 'px';
        clone.style.top = (startY - smallHeight / 2) + 'px';
        clone.style.width = smallWidth + 'px';
        clone.style.height = smallHeight + 'px';
        clone.style.opacity = '0.5';

        this.animationContainer.appendChild(clone);
        this.currentClone = clone;

        // Hide the real target temporarily
        targetElement.style.opacity = '0';

        // Trigger grow animation to final position
        requestAnimationFrame(() => {
            clone.style.left = targetRect.left + 'px';
            clone.style.top = targetRect.top + 'px';
            clone.style.width = targetRect.width + 'px';
            clone.style.height = targetRect.height + 'px';
            clone.style.opacity = '1';
        });

        // Clean up and reveal real element after animation
        setTimeout(() => {
            clone.remove();
            this.currentClone = null;
            targetElement.style.opacity = '1';
            targetElement.classList.add('calendar-event-placed');
            
            // Remove highlight after it completes
            setTimeout(() => {
                targetElement.classList.remove('calendar-event-placed');
            }, 1000);
        }, sceneData.shooting_dates && sceneData.shooting_dates.length > 1 ? 600 : 500);
    }

    /**
     * Updates cursor position during drag
     */
    onDragMove(cursorX, cursorY) {
        // Update drag preview position to follow cursor
        if (this.dragPreview) {
            const rect = this.dragStartData?.element?.getBoundingClientRect() || { width: 100, height: 40 };
            const left = cursorX - rect.width / 2;
            const top = cursorY - rect.height / 2;
            this.dragPreview.style.left = left + 'px';
            this.dragPreview.style.top = top + 'px';
            console.log('🎨 Preview moved to:', left, top);
        } else {
            console.warn('🎨 ⚠️ No drag preview to move!');
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.animationContainer) {
            this.animationContainer.remove();
        }
        this.currentClone = null;
        this.dragStartData = null;
    }
}

// Export singleton instance
export const calendarAnimationController = new CalendarAnimationController();
