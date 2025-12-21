// =================================================================
// CALENDAR VIEW - Toast UI Calendar Implementation
// =================================================================

import { SceneService } from './services/sceneService.js';
import { LocationService } from './services/locationService.js';
import settingsService from './services/settingsService.js';
import { IconPicker } from './components/iconPicker.js';
import { calculateScenePlacement, deleteSplitGroupScenes, getSceneShootingDaysCount } from './calendar-scene-placement.js';
import { renderSceneCard, buildSceneHeading } from './components/sceneCardRenderer.js';
import demoDataService from './services/demoDataService.js';

const CURRENT_PROJECT_KEY = 'continuityManager_currentProject';

let currentProject = null;
let scenes = [];
let locations = [];
let calendar = null;
let selectedTime = null; // Currently selected time in drawer
let selectedConditions = []; // Currently selected conditions in drawer (array)
let selectedContinuity = null; // Currently selected continuity in drawer
let currentSettingsTab = 'scene-headings'; // Currently active tab in settings subdock

// Default times if project doesn't have times configured
const DEFAULT_TIMES = [
    { id: 'morning', label: 'Morning', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />', enabled: true },
    { id: 'day', label: 'Day', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />', enabled: true },
    { id: 'evening', label: 'Evening', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />', enabled: true },
    { id: 'night', label: 'Night', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />', enabled: true },
];

// Default conditions if project doesn't have conditions configured
const DEFAULT_CONDITIONS = [
    { id: 'sunny', label: 'Sunny', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', enabled: true },
    { id: 'rainy', label: 'Rainy', icon: '<path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v8"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>', enabled: true },
    { id: 'stormy', label: 'Stormy', icon: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>', enabled: true },
    { id: 'cold', label: 'Cold', icon: '<path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/>', enabled: true },
    { id: 'hot', label: 'Hot', icon: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', enabled: true },
    { id: 'chilly', label: 'Chilly', icon: '<path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/>', enabled: true },
];

// =================================================================
// SCENE HEADING BUILDER (Wrapper for imported function)
// =================================================================

/**
 * Build a properly formatted scene heading from scene properties
 * This is a wrapper around the imported buildSceneHeading function
 * that provides the necessary context from the calendar view
 */
function buildSceneHeadingForCalendar(scene) {
    return buildSceneHeading(scene, {
        locations: locations,
        times: getProjectTimes(),
        settings: {
            show_int_ext: settingsService.isFeatureEnabled('show_int_ext'),
            show_location: settingsService.isFeatureEnabled('show_location'),
            show_time: settingsService.isFeatureEnabled('show_time'),
            show_continuity: settingsService.isFeatureEnabled('show_continuity')
        },
        continuityOptions: settingsService.getContinuityOptions()
    });
}

// =================================================================
// INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Calendar App v1.2.3 - Non-Shooting Days Feature');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    const projectId = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!projectId) {
        window.location.href = 'projects.html';
        return;
    }

    // Load project
    const { data, error } = await window.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
    
    if (error || !data) {
        window.location.href = 'projects.html';
        return;
    }

    currentProject = data;
    
    // Load project settings
    await settingsService.loadSettings(currentProject.id);
    console.log('⚙️ Settings loaded:', settingsService.getAllFeatures());
    
    // Load scenes and locations
    scenes = await SceneService.getAll(currentProject.id);
    locations = await LocationService.getAll(currentProject.id);
    console.log('📋 Loaded scenes:', scenes.map(s => ({ id: s.id, number: s.scene_number, time: s.time, conditions: s.conditions })));
    console.log('📍 Loaded locations:', locations.length, 'locations');
    
    // Update navbar
    document.querySelector('.navbar .btn-ghost.text-xl').textContent = currentProject.name;
    
    // Initialize Toast UI Calendar
    initializeCalendar();
    
    // Render calendar and unscheduled scenes
    renderCalendarEvents();
    renderUnscheduledScenes();
    
    // Setup event listeners
    setupEventListeners();
    
    // Listen for settings changes to update UI visibility
    window.addEventListener('settingsChanged', (event) => {
        console.log('⚙️ Settings changed, updating UI');
        updateDrawerVisibility();
        renderCalendarEvents();
        renderUnscheduledScenes();
    });
});

// =================================================================
// TOAST UI CALENDAR INITIALIZATION
// =================================================================

function initializeCalendar() {
    const container = document.getElementById('calendar');
    
    // Toast UI Calendar with Monday start (European/Belgian standard)
    calendar = new tui.Calendar(container, {
        defaultView: 'month',
        useFormPopup: false,
        useDetailPopup: false,
        isReadOnly: false,
        week: {
            startDayOfWeek: 1, // 0 = Sunday, 1 = Monday
        },
        month: {
            startDayOfWeek: 1, // Monday start for month view
            visibleEventCount: 2, // Max 2 events visible per day
        },
        template: {
            monthGridHeaderExceed(hiddenEvents) {
                return `<span class="text-sm text-base-content/60">+${hiddenEvents} more</span>`;
            },
            monthDayName(model) {
                return `<span class="text-sm font-semibold text-base-content/60">${model.label}</span>`;
            },
            time(event) {
                // Custom rendering for events to show badge + description
                const sceneNumber = event.raw?.sceneNumber || event.title.split(':')[0];
                const description = event.raw?.description || event.title.split(':').slice(1).join(':').trim();
                
                return `<div class="flex items-start gap-2 w-full">
                    <span class="badge badge-primary badge-xs flex-shrink-0" style="font-size: 11.25px; padding: 3px 6px;">${sceneNumber}</span>
                    <span class="text-sm line-clamp-2 flex-1" style="font-size: 13.75px; line-height: 1.4;">${description}</span>
                </div>`;
            },
            allday(event) {
                // Same for allday events
                const sceneNumber = event.raw?.sceneNumber || event.title.split(':')[0];
                const description = event.raw?.description || event.title.split(':').slice(1).join(':').trim();
                const isSplitScene = !!event.raw?.splitGroupId;
                
                console.log('🎨 Template rendering for:', sceneNumber, {
                    hasTimeIcon: !!event.raw?.timeIcon,
                    timeIconPreview: event.raw?.timeIcon ? event.raw.timeIcon.substring(0, 50) : 'none',
                    isSplitScene
                });
                
                // Split indicator
                const splitIndicator = isSplitScene ? `<span style="font-size: 10px; opacity: 0.6; flex-shrink: 0;">🔗</span>` : '';
                
                // Get time icon if available
                let timeIconHtml = '';
                if (event.raw?.timeIcon) {
                    timeIconHtml = `
                        <div style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 25px; height: 25px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.1);">
                            <svg xmlns="http://www.w3.org/2000/svg" style="width: 15px; height: 15px; color: rgba(0, 0, 0, 0.7); flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                ${event.raw.timeIcon}
                            </svg>
                        </div>
                    `;
                }
                
                // Get condition icons if available
                let conditionIconsHtml = '';
                if (event.raw?.conditionIcons && event.raw.conditionIcons.length > 0) {
                    const isSingle = event.raw.conditionIcons.length === 1;
                    const iconSvgs = event.raw.conditionIcons.map(icon => `
                        <svg xmlns="http://www.w3.org/2000/svg" style="width: 15px; height: 15px; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            ${icon}
                        </svg>
                    `).join('');
                    const containerStyle = isSingle 
                        ? 'display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 25px; height: 25px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.05);' 
                        : 'display: flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0; padding: 5px 10px; border-radius: 12.5px; background-color: rgba(0, 0, 0, 0.05);';
                    conditionIconsHtml = `
                        <div style="${containerStyle}">
                            ${iconSvgs}
                        </div>
                    `;
                }
                
                return `<div style="display: flex; align-items: center; gap: 5px; width: 100%; height: 100%;">
                    <span class="badge badge-primary badge-xs" style="font-size: 11.25px; padding: 3px 6px; flex-shrink: 0;">${sceneNumber}</span>
                    ${splitIndicator}
                    <span style="font-size: 13.75px; line-height: 1.4; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${description}</span>
                    ${timeIconHtml}
                    ${conditionIconsHtml}
                </div>`;
            },
        },
    });

    // Event handlers
    calendar.on('beforeUpdateEvent', handleEventUpdate);
    calendar.on('beforeCreateEvent', handleBeforeCreateEvent);
    calendar.on('beforeDeleteEvent', handleEventDelete);
    calendar.on('clickEvent', handleEventClick);
    
    // Setup click handler for empty days
    setupEmptyDayClickHandler();
    
    console.log('📅 Toast UI Calendar initialized with defaults');
}

// =================================================================
// RENDER CALENDAR EVENTS
// =================================================================

function renderCalendarEvents() {
    if (!calendar) return;
    
    // Clear existing events
    calendar.clear();
    
    // Convert scenes to Toast UI events
    const events = scenes
        .filter(scene => scene.shooting_dates && scene.shooting_dates.length > 0)
        .map(sceneToEvent);
    
    // Create events
    calendar.createEvents(events);
    
    // Apply non-shooting day styling after render
    setTimeout(() => applyNonShootingDayStyling(), 100);
}

function sceneToEvent(scene) {
    const sortedDates = [...scene.shooting_dates].sort();
    const isMultiDay = sortedDates.length > 1;
    
    // Parse dates in LOCAL timezone to avoid day shift
    const parseLocalDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0);
    };
    
    const start = parseLocalDate(sortedDates[0]);
    const end = isMultiDay 
        ? parseLocalDate(sortedDates[sortedDates.length - 1])
        : parseLocalDate(sortedDates[0]);
    
    // Get time icon if available
    let timeIcon = null;
    if (scene.time) {
        const times = getProjectTimes();
        const timeData = times.find(t => t.id === scene.time);
        if (timeData) {
            timeIcon = timeData.icon;
        }
    }
    
    console.log('🎨 sceneToEvent:', {
        sceneNumber: scene.scene_number,
        hasTime: !!scene.time,
        timeValue: scene.time,
        timeIcon: timeIcon ? 'present' : 'missing'
    });
    
    // Get condition icons if available
    let conditionIcons = [];
    if (scene.conditions && scene.conditions.length > 0) {
        const conditions = getProjectConditions();
        conditionIcons = scene.conditions
            .map(condId => {
                const condData = conditions.find(c => c.id === condId);
                return condData ? condData.icon : null;
            })
            .filter(icon => icon !== null);
    }
    
    // Get location name if available
    let locationName = '';
    if (scene.location_id) {
        const location = locations.find(l => l.id === scene.location_id);
        if (location) {
            locationName = location.name;
        }
    }
    
    // Format title with INT./EXT. prefix and location
    const displayTitle = buildSceneHeadingForCalendar(scene);
    
    return {
        id: scene.id,
        calendarId: 'scenes',
        title: `${scene.scene_number}: ${displayTitle}`,
        start,
        end,
        category: 'allday',
        isAllday: true,
        backgroundColor: 'hsl(var(--b1))',
        borderColor: 'hsl(var(--b3))',
        color: 'hsl(var(--bc))',
        raw: {
            sceneNumber: scene.scene_number,
            description: displayTitle,
            shootingDates: scene.shooting_dates,
            timeIcon: timeIcon,
            conditionIcons: conditionIcons,
            splitGroupId: scene.split_group_id,
        },
    };
}

// =================================================================
// EVENT HANDLERS
// =================================================================

async function handleEventUpdate({ event, changes }) {
    const formatDate = (d) => {
        if (!d) return 'unknown';
        // Handle TZDate objects from Toast UI
        if (d.toDate && typeof d.toDate === 'function') {
            const dateObj = d.toDate();
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        // Handle regular Date objects
        if (d instanceof Date) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        // Already a string
        return d;
    };
    
    // Check if moving to a different month
    if (changes.start) {
        const newStartDate = changes.start?.toDate ? changes.start.toDate() : new Date(changes.start);
        const currentDate = calendar.getDate();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const newMonth = newStartDate.getMonth();
        const newYear = newStartDate.getFullYear();
        
        if (newMonth !== currentMonth || newYear !== currentYear) {
            console.log('🔄 Moving to other month, navigating...');
            calendar.setDate(new Date(newYear, newMonth, 1));
            updateCalendarTitle();
            setTimeout(() => applyNonShootingDayStyling(), 100);
            return; // Prevent the update, let user drop again in the new month
        }
    }
    
    const scene = scenes.find(s => s.id === event.id);
    if (!scene) return;
    
    // Remember original number of shooting days
    const originalShootingDays = scene.shooting_dates ? scene.shooting_dates.length : 1;
    
    // Calculate new dates based on changes
    let newDates = [...scene.shooting_dates];
    let isResize = false; // Track if this is a resize operation
    
    if (changes.start || changes.end) {
        const originalStart = event.start.toDate ? event.start.toDate() : new Date(event.start);
        const originalEnd = event.end.toDate ? event.end.toDate() : new Date(event.end);
        const startDate = changes.start?.toDate ? changes.start.toDate() : originalStart;
        const endDate = changes.end?.toDate ? changes.end.toDate() : originalEnd;
        
        // Determine if this is a MOVE or RESIZE:
        // MOVE = both start AND end are provided in changes (dragging the event)
        // RESIZE = only end is provided (dragging the resize handle)
        const isMove = !!(changes.start && changes.end);
        isResize = !!(changes.end && !changes.start);
        
        console.log('🔄 Event update type:', isMove ? 'MOVE' : (isResize ? 'RESIZE' : 'UNKNOWN'), {
            changesStart: !!changes.start,
            changesEnd: !!changes.end,
            originalDays: originalShootingDays,
            shootingDaysCount: scene.shooting_days_count,
            splitGroupId: scene.split_group_id
        });
        
        if (isMove) {
            // MOVE: Delete all linked scenes, recalculate placement with shooting_days_count
            
            // First, delete all other scenes in the split group
            if (scene.split_group_id) {
                const linkedScenes = scenes.filter(s => 
                    s.split_group_id === scene.split_group_id && s.id !== scene.id
                );
                
                console.log('🗑️ Deleting', linkedScenes.length, 'linked scenes in split group');
                
                for (const linkedScene of linkedScenes) {
                    await SceneService.delete(linkedScene.id);
                }
                
                // Remove from local array
                scenes = scenes.filter(s => 
                    s.split_group_id !== scene.split_group_id || s.id === scene.id
                );
            }
            
            // Use shooting_days_count (or fall back to original shooting days)
            const totalShootingDays = scene.shooting_days_count || originalShootingDays;
            
            console.log('📦 MOVE: Recalculating placement for', totalShootingDays, 'shooting days', {
                sceneShootingDaysCount: scene.shooting_days_count,
                originalShootingDays: originalShootingDays,
                usingValue: totalShootingDays
            });
            
            // Calculate new placement
            const placement = calculateScenePlacement(startDate, totalShootingDays, isNonShootingDay);
            newDates = placement.shootingDates;
            
            console.log('📦 MOVE result:', newDates.length, 'shooting days, needsSplit:', placement.needsSplit, 
                placement.needsSplit ? `into ${placement.splitInfo.totalParts} parts` : '');
            
            // If split is needed, execute multi-part split directly
            if (placement.needsSplit) {
                await executeMultiPartSplit(scene, placement.splitInfo.parts, totalShootingDays);
                return;
            }
        } else {
            // RESIZE: Use the new selected range, filter out non-shooting days
            const fullRange = [];
            let loopDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const loopEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            while (loopDate <= loopEndDate) {
                const dateStr = formatDate(loopDate);
                fullRange.push(dateStr);
                loopDate.setDate(loopDate.getDate() + 1);
            }
            
            console.log('📏 RESIZE selected range:', fullRange.length, 'calendar days');
            
            newDates = fullRange.filter(date => !isNonShootingDay(date));
            
            if (newDates.length === 0) {
                alert('Cannot schedule scenes on non-shooting days');
                return;
            }
            
            console.log('📏 RESIZE after filtering non-shooting:', newDates.length, 'shooting days');
            
            // Check for splits using the placement helper
            const resizePlacement = calculateScenePlacement(startDate, newDates.length, isNonShootingDay);
            
            if (resizePlacement.needsSplit) {
                console.log(`📏 RESIZE needs split into ${resizePlacement.splitInfo.totalParts} parts`);
                await executeMultiPartSplit(scene, resizePlacement.splitInfo.parts, newDates.length);
                return;
            }
        }
        
        newDates.sort();
    }
    
    try {
        // Update shooting_days_count when resizing
        const updates = {
            shooting_dates: newDates
        };
        
        if (isResize) {
            // On resize, update the shooting_days_count
            updates.shooting_days_count = newDates.length;
            scene.shooting_days_count = newDates.length;
        }
        
        await SceneService.update(event.id, updates);
        scene.shooting_dates = newDates;
        // Only re-render after successful save
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('❌ Error updating event:', error);
        alert('Failed to update scene dates');
        renderCalendarEvents(); // Revert on error
    }
}

async function handleBeforeCreateEvent({ start, end, isAllday, state }) {
    // This is triggered when dropping on calendar or clicking
    // Prevent default event creation and use our own logic
    
    const formatDate = (d) => {
        if (d.toDate && typeof d.toDate === 'function') {
            return d.toDate().toISOString().split('T')[0];
        }
        if (d instanceof Date) {
            return d.toISOString().split('T')[0];
        }
        return d;
    };
    
    const dropDate = formatDate(start);
    
    console.log('📝 beforeCreateEvent:', {
        dropDate,
        state,
        hasDraggedScene: !!draggedSceneId,
        draggedSceneId,
    });
    
    // Check if trying to drop on a non-shooting day
    if (draggedSceneId && isNonShootingDay(dropDate)) {
        alert('Cannot schedule scenes on non-shooting days');
        draggedSceneId = null;
        return false;
    }
    
    // If we have a dragged scene, schedule it
    if (draggedSceneId) {
        console.log('🎬 Scheduling scene:', draggedSceneId, 'on', dropDate);
        const sceneIdToSchedule = draggedSceneId;
        draggedSceneId = null;
        await scheduleScene(sceneIdToSchedule, dropDate);
        return false; // Prevent Toast UI from creating event
    }
    
    // Allow regular calendar interactions to proceed
    console.log('⚠️ No dragged scene, ignoring create event');
    return false;
}

async function handleEventDelete({ event }) {
    console.log('🗑️ EVENT DELETE:', {
        scene: event.title,
        dates: event.raw.shootingDates,
    });
    
    try {
        const scene = scenes.find(s => s.id === event.id);
        if (!scene) return;
        
        // If this scene is part of a split group, unschedule all parts
        if (scene.split_group_id) {
            const splitGroupScenes = scenes.filter(s => 
                s.split_group_id === scene.split_group_id
            );
            
            if (splitGroupScenes.length > 1) {
                console.log(`🔗 Unscheduling ${splitGroupScenes.length} split scenes`);
                
                // Keep the shooting_days_count but clear shooting_dates for all parts
                for (const linkedScene of splitGroupScenes) {
                    if (linkedScene.id !== scene.id) {
                        // Delete the other parts entirely
                        await SceneService.delete(linkedScene.id);
                        scenes = scenes.filter(s => s.id !== linkedScene.id);
                    }
                }
                
                // Update this scene: clear dates, remove split_group_id, keep shooting_days_count
                await SceneService.update(scene.id, { 
                    shooting_dates: [],
                    split_group_id: null
                    // shooting_days_count is preserved
                });
                scene.shooting_dates = [];
                scene.split_group_id = null;
                // scene.shooting_days_count stays the same
                
                console.log(`📅 Unscheduled with shooting_days_count preserved:`, scene.shooting_days_count);
                
                renderCalendarEvents();
                renderUnscheduledScenes();
                return;
            }
        }
        
        // Normal unschedule - just remove dates
        await SceneService.setShootingDates(event.id, []);
        scene.shooting_dates = [];
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        alert('Failed to remove scene from calendar');
    }
}

function handleEventClick({ event }) {
    console.log('👆 EVENT CLICK:', {
        scene: event.raw.sceneNumber,
        description: event.raw.description,
        dates: event.raw.shootingDates,
    });
    
    // Open drawer with scene details
    openSceneDrawer(event);
}

function setupEmptyDayClickHandler() {
    const calendarEl = document.getElementById('calendar');
    
    calendarEl.addEventListener('click', (e) => {
        // Check if click is on a day cell (not on an event)
        const cell = e.target.closest('.toastui-calendar-daygrid-cell');
        
        if (!cell) return;
        
        // Check if clicked on an event (we want to ignore those)
        if (e.target.closest('.toastui-calendar-weekday-event')) {
            return;
        }
        
        console.log('📅 Clicked on calendar cell:', cell);
        
        // Get all cells to calculate index
        const dayCells = document.querySelectorAll('.toastui-calendar-daygrid-cell');
        const cellIndex = Array.from(dayCells).indexOf(cell);
        
        if (cellIndex === -1) {
            console.log('⚠️ Could not find cell index');
            return;
        }
        
        // Calculate the exact date using same logic as applyNonShootingDayStyling
        const currentDate = calendar.getDate();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-indexed
        
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const startDayOfWeek = firstDayOfMonth.getDay();
        const daysFromPrevMonth = (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1);
        const gridStartDate = new Date(currentYear, currentMonth, 1 - daysFromPrevMonth);
        
        // Calculate the actual date for this cell
        const cellDate = new Date(gridStartDate);
        cellDate.setDate(gridStartDate.getDate() + cellIndex);
        
        const clickedYear = cellDate.getFullYear();
        const clickedMonth = cellDate.getMonth(); // 0-indexed
        const clickedDay = cellDate.getDate();
        const clickedDateStr = `${clickedYear}-${String(clickedMonth + 1).padStart(2, '0')}-${String(clickedDay).padStart(2, '0')}`;
        
        console.log('📅 Calculated clicked date:', clickedDateStr);
        
        // Check if this date has any scenes scheduled
        const hasSceneOnDate = scenes.some(scene => 
            scene.shooting_dates && scene.shooting_dates.includes(clickedDateStr)
        );
        
        if (hasSceneOnDate) {
            console.log('⚠️ Cannot mark as non-shooting day: scenes are scheduled on this date');
            return;
        }
        
        // Check if clicked date is in a different month
        if (clickedMonth !== currentMonth || clickedYear !== currentYear) {
            console.log('🔄 Clicked on other month, navigating...');
            calendar.setDate(new Date(clickedYear, clickedMonth, 1));
            updateCalendarTitle();
            setTimeout(() => applyNonShootingDayStyling(), 100);
            return;
        }
        
        // Open non-shooting day modal for current month days
        openNonShootingDayModal(clickedDateStr);
    });
}

let currentDrawerEvent = null;

function openSceneDrawer(event) {
    const scene = scenes.find(s => s.id === event.id);
    if (!scene) return;
    
    currentDrawerEvent = event;
    
    // Set selected time
    selectedTime = scene.time || null;
    
    // Set selected conditions (copy array to avoid reference issues)
    selectedConditions = scene.conditions ? [...scene.conditions] : [];
    
    // Set selected continuity
    selectedContinuity = scene.continuity || null;
    
    // Populate editable fields
    document.getElementById('drawerSceneNumberInput').value = scene.scene_number;
    
    // Populate location dropdown
    renderLocationDropdown(scene.location_id);
    
    // Set INT/EXT toggle
    updateIntExtToggle(scene.int_ext);
    
    // Render time selector
    renderTimeSelector();
    
    // Render conditions selector
    renderConditionsSelector();
    
    // Render continuity selector
    renderContinuitySelector();
    
    // Update field visibility based on settings
    updateDrawerVisibility();
    
    // Format dates (read-only)
    const dates = scene.shooting_dates || [];
    if (dates.length === 0) {
        document.getElementById('drawerSceneDatesInfo').textContent = 'Not scheduled';
    } else if (dates.length === 1) {
        document.getElementById('drawerSceneDatesInfo').textContent = formatDateReadable(dates[0]);
    } else {
        const sortedDates = [...dates].sort();
        document.getElementById('drawerSceneDatesInfo').textContent = `${formatDateReadable(sortedDates[0])} - ${formatDateReadable(sortedDates[sortedDates.length - 1])} (${dates.length} days)`;
    }
    
    // Show drawer
    const drawer = document.getElementById('sceneDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    
    drawer.style.transform = 'translateY(0)';
    backdrop.classList.remove('pointer-events-none');
    backdrop.style.opacity = '1';
}

function closeSceneDrawer() {
    const drawer = document.getElementById('sceneDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    
    drawer.style.transform = 'translateY(100%)';
    backdrop.style.opacity = '0';
    
    setTimeout(() => {
        backdrop.classList.add('pointer-events-none');
        currentDrawerEvent = null;
    }, 300);
}

function updateIntExtToggle(value) {
    const radios = document.querySelectorAll('input[name="intExt"]');
    const labels = document.querySelectorAll('label:has(input[name="intExt"])');
    
    // Reset all labels
    labels.forEach(label => {
        label.classList.remove('btn-primary');
        label.classList.add('btn-outline');
    });
    
    // Find and select the matching radio
    radios.forEach((radio, index) => {
        if (radio.value === value) {
            radio.checked = true;
            labels[index].classList.remove('btn-outline');
            labels[index].classList.add('btn-primary');
        } else {
            radio.checked = false;
        }
    });
}

function getSelectedIntExt() {
    const selected = document.querySelector('input[name="intExt"]:checked');
    return selected ? selected.value : null;
}

function renderLocationDropdown(selectedLocationId) {
    const select = document.getElementById('drawerLocationSelect');
    select.innerHTML = '<option value="">Select location...</option>';
    
    // Add existing locations
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        if (location.id === selectedLocationId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Add "Create new location" option
    const newOption = document.createElement('option');
    newOption.value = 'CREATE_NEW';
    newOption.textContent = '+ Create new location...';
    select.appendChild(newOption);
}

function populateAddSceneLocationDropdown() {
    const select = document.getElementById('addSceneLocation');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select location...</option>';
    
    // Add existing locations
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        select.appendChild(option);
    });
    
    // Add "Create new location" option
    const newOption = document.createElement('option');
    newOption.value = 'CREATE_NEW';
    newOption.textContent = '+ Create new location...';
    select.appendChild(newOption);
}

function renderContinuitySelector() {
    const select = document.getElementById('drawerContinuitySelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">None</option>';
    
    const continuityOptions = settingsService.getContinuityOptions();
    continuityOptions.forEach(option => {
        const optEl = document.createElement('option');
        optEl.value = option.id;
        optEl.textContent = option.label;
        optEl.title = option.description || '';
        if (option.id === selectedContinuity) {
            optEl.selected = true;
        }
        select.appendChild(optEl);
    });
    
    // Update selected continuity on change
    select.addEventListener('change', (e) => {
        selectedContinuity = e.target.value || null;
    });
}

function updateDrawerVisibility() {
    // Show/hide drawer sections based on feature flags
    const features = settingsService.getAllFeatures();
    
    // INT/EXT section (find by radio button)
    const intExtSection = document.querySelector('input[name="intExt"]')?.closest('.form-control');
    if (intExtSection) {
        intExtSection.style.display = features.show_int_ext ? '' : 'none';
    }
    
    // Location section
    const locationSection = document.getElementById('drawerLocationSelect')?.closest('.form-control');
    if (locationSection) {
        locationSection.style.display = features.show_location ? '' : 'none';
    }
    
    // Time section
    const timeSection = document.getElementById('drawerTimeSelector')?.closest('.form-control');
    if (timeSection) {
        timeSection.style.display = features.show_time ? '' : 'none';
    }
    
    // Conditions section
    const conditionsSection = document.getElementById('drawerConditionsSelector')?.closest('.form-control');
    if (conditionsSection) {
        conditionsSection.style.display = features.show_conditions ? '' : 'none';
    }
    
    // Continuity section
    const continuitySection = document.getElementById('drawerContinuitySelect')?.closest('.form-control');
    if (continuitySection) {
        continuitySection.style.display = features.show_continuity ? '' : 'none';
    }
}

function formatDateReadable(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

let draggedSceneId = null;

async function scheduleScene(sceneId, dateStr) {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    console.log('🎯 SCENE SCHEDULED:', {
        scene: `${scene.scene_number} - ${scene.description}`,
        onDate: dateStr,
    });
    
    try {
        // Only set shooting_days_count to 1 if it doesn't exist yet
        // Otherwise use the existing placement calculation with the preserved count
        const existingCount = scene.shooting_days_count;
        
        if (existingCount && existingCount > 1) {
            // Scene was previously scheduled with multiple days, recalculate placement
            console.log('📦 Rescheduling scene with preserved count:', existingCount);
            const startDate = new Date(dateStr);
            const placement = calculateScenePlacement(startDate, existingCount, isNonShootingDay);
            
            if (placement.needsSplit) {
                // Need to split immediately
                await executeMultiPartSplit(scene, placement.splitInfo.parts, existingCount);
            } else {
                // Simple placement without split
                await SceneService.update(sceneId, {
                    shooting_dates: placement.shootingDates
                    // Keep existing shooting_days_count
                });
                scene.shooting_dates = placement.shootingDates;
            }
        } else {
            // First time scheduling or was a 1-day scene
            await SceneService.update(sceneId, {
                shooting_dates: [dateStr],
                shooting_days_count: 1
            });
            scene.shooting_dates = [dateStr];
            scene.shooting_days_count = 1;
        }
        
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('❌ Error scheduling scene:', error);
        alert('Failed to schedule scene');
    }
}

// =================================================================
// UNSCHEDULED SCENES
// =================================================================

function renderUnscheduledScenes() {
    const container = document.getElementById('unscheduledScenes');
    container.innerHTML = '';
    
    const unscheduled = scenes.filter(s => !s.shooting_dates || s.shooting_dates.length === 0);
    
    if (unscheduled.length === 0) {
        container.innerHTML = '<p class="text-sm text-base-content/50">No unscheduled scenes</p>';
        return;
    }
    
    unscheduled.forEach(scene => {
        const card = createUnscheduledSceneCard(scene);
        container.appendChild(card);
    });
}

function createUnscheduledSceneCard(scene) {
    console.log('🎬 Creating card for scene:', scene.scene_number, 'time:', scene.time, 'conditions:', scene.conditions);
    
    // Use the reusable scene card renderer
    const card = renderSceneCard(scene, {
        locations: locations,
        times: getProjectTimes(),
        conditions: getProjectConditions(),
        settings: {
            show_int_ext: settingsService.isFeatureEnabled('show_int_ext'),
            show_location: settingsService.isFeatureEnabled('show_location'),
            show_time: settingsService.isFeatureEnabled('show_time'),
            show_continuity: settingsService.isFeatureEnabled('show_continuity')
        },
        continuityOptions: settingsService.getContinuityOptions()
    });
    
    // Make it draggable
    card.draggable = true;
    card.classList.add('cursor-move');
    
    // Drag start
    card.addEventListener('dragstart', (e) => {
        draggedSceneId = scene.id;
        e.dataTransfer.setData('sceneId', scene.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('opacity-50');
        console.log('🔵 DRAG START:', { 
            scene: scene.scene_number, 
            id: scene.id,
            hasLocation: !!scene.location_id,
            hasIntExt: !!scene.int_ext
        });
    });
    
    card.addEventListener('dragend', () => {
        card.classList.remove('opacity-50');
        console.log('🔴 DRAG END for scene:', scene.scene_number);
        draggedSceneId = null;
    });
    
    return card;
}

// Setup drop zone on calendar
function setupCalendarDropZone() {
    const calendarEl = document.getElementById('calendar');
    
    calendarEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    calendarEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        
        if (!draggedSceneId) {
            console.log('⚠️ No draggedSceneId on drop');
            return;
        }
        
        console.log('💧 DROP EVENT triggered');
        
        // Find the calendar cell - Toast UI uses 'toastui-calendar-daygrid-cell'
        let cell = e.target.closest('.toastui-calendar-daygrid-cell');
        if (!cell && e.target.classList.contains('toastui-calendar-daygrid-cell')) {
            cell = e.target;
        }
        
        if (!cell) {
            console.log('⚠️ Could not find calendar cell');
            draggedSceneId = null;
            return;
        }
        
        console.log('📍 Found cell!');
        
        // Get all cells to calculate index
        const dayCells = document.querySelectorAll('.toastui-calendar-daygrid-cell');
        const cellIndex = Array.from(dayCells).indexOf(cell);
        
        if (cellIndex === -1) {
            console.log('⚠️ Could not find cell index');
            draggedSceneId = null;
            return;
        }
        
        // Calculate the exact date using same logic as applyNonShootingDayStyling
        const currentDate = calendar.getDate();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-indexed
        
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const startDayOfWeek = firstDayOfMonth.getDay();
        const daysFromPrevMonth = (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1);
        const gridStartDate = new Date(currentYear, currentMonth, 1 - daysFromPrevMonth);
        
        // Calculate the actual date for this cell
        const cellDate = new Date(gridStartDate);
        cellDate.setDate(gridStartDate.getDate() + cellIndex);
        
        const dropYear = cellDate.getFullYear();
        const dropMonth = cellDate.getMonth(); // 0-indexed
        const dropDay = cellDate.getDate();
        const dateStr = `${dropYear}-${String(dropMonth + 1).padStart(2, '0')}-${String(dropDay).padStart(2, '0')}`;
        
        console.log('📅 Drop date calculated:', {
            cellIndex,
            dropYear,
            dropMonth: dropMonth + 1,
            dropDay,
            fullDate: dateStr,
        });
        
        // Check if dropping on a different month - navigate there instead
        if (dropMonth !== currentMonth || dropYear !== currentYear) {
            console.log('🔄 Dropped on other month, navigating...');
            calendar.setDate(new Date(dropYear, dropMonth, 1));
            updateCalendarTitle();
            setTimeout(() => applyNonShootingDayStyling(), 100);
            draggedSceneId = null;
            return;
        }
        
        // Check if trying to drop on a non-shooting day
        if (isNonShootingDay(dateStr)) {
            alert('Cannot schedule scenes on non-shooting days');
            draggedSceneId = null;
            return;
        }
        
        // Schedule the scene
        const sceneIdToSchedule = draggedSceneId;
        draggedSceneId = null;
        await scheduleScene(sceneIdToSchedule, dateStr);
    });
}

// =================================================================
// NAVIGATION
// =================================================================

function setupEventListeners() {
    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        calendar.prev();
        updateCalendarTitle();
        setTimeout(() => applyNonShootingDayStyling(), 100);
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        calendar.next();
        updateCalendarTitle();
        setTimeout(() => applyNonShootingDayStyling(), 100);
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        calendar.today();
        updateCalendarTitle();
        setTimeout(() => applyNonShootingDayStyling(), 100);
    });
    
    // Add scene modal
    document.getElementById('addSceneBtn').addEventListener('click', () => {
        populateAddSceneLocationDropdown();
        document.getElementById('addSceneModal').showModal();
    });
    
    document.getElementById('addSceneFromCalendar').addEventListener('click', () => {
        populateAddSceneLocationDropdown();
        document.getElementById('addSceneModal').showModal();
    });
    
    document.getElementById('cancelSceneBtn').addEventListener('click', () => {
        document.getElementById('addSceneModal').close();
    });
    
    document.getElementById('addSceneForm').addEventListener('submit', handleAddScene);
    
    // Add Scene modal INT/EXT radio button styling
    const addIntExtRadios = document.querySelectorAll('input[name="addIntExt"]');
    if (addIntExtRadios.length > 0) {
        addIntExtRadios.forEach((radio, index) => {
            radio.addEventListener('change', () => {
                const labels = document.querySelectorAll('label:has(input[name="addIntExt"])');
                labels.forEach(label => {
                    label.classList.remove('btn-primary');
                    label.classList.add('btn-outline');
                });
                if (radio.checked) {
                    labels[index].classList.remove('btn-outline');
                    labels[index].classList.add('btn-primary');
                }
            });
        });
    }
    
    // Add Scene location dropdown - create new location on select
    const addSceneLocationSelect = document.getElementById('addSceneLocation');
    if (addSceneLocationSelect) {
        addSceneLocationSelect.addEventListener('change', async (e) => {
            if (e.target.value === 'CREATE_NEW') {
                const name = prompt('Enter new location name:');
                if (!name) {
                    e.target.value = '';
                    return;
                }
                
                try {
                    const newLocation = await LocationService.create(currentProject.id, { name: name.trim().toUpperCase() });
                    locations.push(newLocation);
                    populateAddSceneLocationDropdown();
                    e.target.value = newLocation.id;
                } catch (error) {
                    console.error('Error creating location:', error);
                    alert('Failed to create location');
                    e.target.value = '';
                }
            }
        });
    }
    
    // Settings subdock - replaces old modal
    document.getElementById('settingsBtn').addEventListener('click', toggleSettingsSubdock);
    document.getElementById('settingsBackdrop').addEventListener('click', closeSettingsSubdock);
    
    // Tab switching
    document.querySelectorAll('[role="tab"]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchSettingsTab(tabName);
        });
    });
    
    // Settings preview update
    document.addEventListener('change', (e) => {
        if (e.target.id.startsWith('settingShow')) {
            updateSettingsPreview();
        }
    });
    
    // Location dropdown - create new location on select
    document.getElementById('drawerLocationSelect').addEventListener('change', async (e) => {
        if (e.target.value === 'CREATE_NEW') {
            const name = prompt('Enter new location name:');
            if (!name) {
                e.target.value = '';
                return;
            }
            
            try {
                const newLocation = await LocationService.create(currentProject.id, { name: name.trim().toUpperCase() });
                locations.push(newLocation);
                renderLocationDropdown();
                e.target.value = newLocation.id;
            } catch (error) {
                console.error('Error creating location:', error);
                alert('Failed to create location');
                e.target.value = '';
            }
        }
    });
    
    // Non-shooting day modal
    document.getElementById('closeNonShootingDayBtn').addEventListener('click', () => {
        document.getElementById('nonShootingDayModal').close();
    });
    document.getElementById('saveNonShootingDayBtn').addEventListener('click', async () => {
        if (!currentNonShootingDate) return;
        
        const isNonShooting = document.getElementById('nonShootingDayToggle').checked;
        await toggleNonShootingDay(currentNonShootingDate, isNonShooting);
        
        document.getElementById('nonShootingDayModal').close();
        currentNonShootingDate = null;
    });
    
    // Split scene modal
    document.getElementById('cancelSplitBtn').addEventListener('click', () => {
        document.getElementById('splitSceneModal').close();
        pendingSplitData = null;
    });
    document.getElementById('confirmSplitBtn').addEventListener('click', async () => {
        if (pendingSplitData) {
            await executeSplitScene(pendingSplitData);
            document.getElementById('splitSceneModal').close();
            pendingSplitData = null;
        }
    });
    
    // INT/EXT radio button styling
    document.querySelectorAll('input[name="intExt"]').forEach((radio, index) => {
        radio.addEventListener('change', () => {
            const labels = document.querySelectorAll('label:has(input[name="intExt"])');
            labels.forEach(label => {
                label.classList.remove('btn-primary');
                label.classList.add('btn-outline');
            });
            if (radio.checked) {
                labels[index].classList.remove('btn-outline');
                labels[index].classList.add('btn-primary');
            }
        });
    });
    
    // Drawer controls
    document.getElementById('closeDrawer').addEventListener('click', closeSceneDrawer);
    document.getElementById('drawerBackdrop').addEventListener('click', closeSceneDrawer);
    
    // Drawer form submission
    document.getElementById('drawerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentDrawerEvent) return;
        
        const sceneId = currentDrawerEvent.id;
        const sceneNumber = document.getElementById('drawerSceneNumberInput').value.trim();
        const locationId = document.getElementById('drawerLocationSelect').value || null;
        const intExt = getSelectedIntExt();
        
        if (!sceneNumber) return;
        
        // Get location name for description field (for backward compatibility)
        let description = '';
        if (locationId) {
            const location = locations.find(l => l.id === locationId);
            if (location) {
                const prefix = intExt ? `${intExt}. - ` : '';
                description = `${prefix}${location.name}`;
            }
        }
        
        try {
            console.log('💾 Saving scene with time:', selectedTime, 'conditions:', selectedConditions, 'location_id:', locationId, 'int_ext:', intExt, 'continuity:', selectedContinuity);
            
            // Update local data
            const scene = scenes.find(s => s.id === sceneId);
            if (scene) {
                const updates = {
                    scene_number: sceneNumber,
                    description: description,
                    location_id: locationId,
                    time: selectedTime,
                    conditions: selectedConditions,
                    int_ext: intExt,
                    continuity: selectedContinuity,
                };
                
                // Update this scene
                await SceneService.update(sceneId, updates);
                scene.scene_number = sceneNumber;
                scene.description = description;
                scene.location_id = locationId;
                scene.time = selectedTime;
                scene.conditions = [...selectedConditions];
                scene.int_ext = intExt;
                scene.continuity = selectedContinuity;
                
                // If this scene is part of a split group, update all scenes in the group
                if (scene.split_group_id) {
                    const splitGroupScenes = scenes.filter(s => 
                        s.split_group_id === scene.split_group_id && s.id !== scene.id
                    );
                    
                    for (const splitScene of splitGroupScenes) {
                        // Update all properties with the same values
                        await SceneService.update(splitScene.id, {
                            scene_number: sceneNumber,
                            description: description,
                            location_id: locationId,
                            time: selectedTime,
                            conditions: selectedConditions,
                            location: scene.location,
                            int_ext: scene.int_ext,
                            continuity: selectedContinuity,
                            day_night: scene.day_night,
                            script_day: scene.script_day,
                            pages: scene.pages
                        });
                        
                        splitScene.scene_number = sceneNumber;
                        splitScene.description = description;
                        splitScene.location_id = locationId;
                        splitScene.time = selectedTime;
                        splitScene.conditions = [...selectedConditions];
                        splitScene.location = scene.location;
                        splitScene.int_ext = scene.int_ext;
                        splitScene.continuity = selectedContinuity;
                        splitScene.day_night = scene.day_night;
                        splitScene.script_day = scene.script_day;
                        splitScene.pages = scene.pages;
                    }
                    
                    console.log(`🔗 Updated ${splitGroupScenes.length} linked scene(s) in split group with synced properties`);
                }
            }
            
            // Re-render calendar and unscheduled scenes
            renderCalendarEvents();
            renderUnscheduledScenes();
            
            // Update current drawer event
            currentDrawerEvent.title = `${sceneNumber}: ${description}`;
            currentDrawerEvent.raw.sceneNumber = sceneNumber;
            currentDrawerEvent.raw.description = description;
            
            closeSceneDrawer();
        } catch (error) {
            console.error('❌ Error updating scene:', error);
            alert('Failed to update scene');
        }
    });
    
    document.getElementById('drawerRemoveBtn').addEventListener('click', async () => {
        if (!currentDrawerEvent) return;
        
        const confirmDelete = confirm(`Remove "${currentDrawerEvent.title}" from calendar?`);
        if (confirmDelete) {
            await handleEventDelete({ event: currentDrawerEvent });
            closeSceneDrawer();
        }
    });
    
    document.getElementById('drawerDeleteBtn').addEventListener('click', async () => {
        if (!currentDrawerEvent) return;
        
        const scene = scenes.find(s => s.id === currentDrawerEvent.id);
        if (!scene) return;
        
        // Check if this scene is part of a split group
        let confirmMessage = `Permanently delete scene "${scene.scene_number}: ${scene.description}"?\n\nThis action cannot be undone.`;
        let scenesToDelete = [scene];
        
        if (scene.split_group_id) {
            const splitGroupScenes = scenes.filter(s => s.split_group_id === scene.split_group_id);
            if (splitGroupScenes.length > 1) {
                const sceneNumbers = splitGroupScenes.map(s => s.scene_number).join(', ');
                confirmMessage = `This scene is part of a split group (${sceneNumbers}).\n\nDelete ALL scenes in this group?\n\nThis action cannot be undone.`;
                scenesToDelete = splitGroupScenes;
            }
        }
        
        const confirmDelete = confirm(confirmMessage);
        if (confirmDelete) {
            try {
                // Delete all scenes in the group
                for (const sceneToDelete of scenesToDelete) {
                    await SceneService.delete(sceneToDelete.id);
                }
                
                // Remove from local array
                const deleteIds = scenesToDelete.map(s => s.id);
                scenes = scenes.filter(s => !deleteIds.includes(s.id));
                
                renderCalendarEvents();
                renderUnscheduledScenes();
                closeSceneDrawer();
                console.log(`✅ Deleted ${scenesToDelete.length} scene(s) successfully`);
            } catch (error) {
                console.error('❌ Error deleting scene:', error);
                alert('Failed to delete scene');
            }
        }
    });
    
    // Setup calendar drop zone
    setupCalendarDropZone();
    
    // Initial title
    updateCalendarTitle();
}

function updateCalendarTitle() {
    const date = calendar.getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarTitle').textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

async function handleAddScene(e) {
    e.preventDefault();
    
    const sceneNumber = document.getElementById('addSceneNumber').value.trim();
    const locationId = document.getElementById('addSceneLocation').value;
    const intExtRadio = document.querySelector('input[name="addIntExt"]:checked');
    const intExt = intExtRadio ? intExtRadio.value : null;
    
    if (!sceneNumber || !locationId) {
        alert('Please fill in scene number and location');
        return;
    }
    
    try {
        // Build description from location and int_ext for backward compatibility
        let description = '';
        if (locationId) {
            const location = locations.find(l => l.id === locationId);
            if (location) {
                const prefix = intExt ? `${intExt}. ` : '';
                description = `${prefix}${location.name}`;
            }
        }
        
        const newScene = await SceneService.create(currentProject.id, {
            scene_number: sceneNumber,
            description: description,
            location_id: locationId,
            int_ext: intExt,
            shooting_dates: [],
        });
        
        scenes.push(newScene);
        renderUnscheduledScenes();
        
        // Clear form and close modal
        document.getElementById('addSceneNumber').value = '';
        document.getElementById('addSceneLocation').value = '';
        // Reset INT/EXT radio buttons
        const addIntExtRadios = document.querySelectorAll('input[name="addIntExt"]');
        addIntExtRadios.forEach(radio => radio.checked = false);
        const addIntExtLabels = document.querySelectorAll('label:has(input[name="addIntExt"])');
        addIntExtLabels.forEach(label => {
            label.classList.remove('btn-primary');
            label.classList.add('btn-outline');
        });
        
        document.getElementById('addSceneModal').close();
    } catch (error) {
        console.error('Error adding scene:', error);
        alert('Failed to add scene');
    }
}

// =================================================================
// TIME OF DAY MANAGEMENT
// =================================================================

function getProjectTimes() {
    return currentProject.times || DEFAULT_TIMES;
}

function getEnabledTimes() {
    return getProjectTimes().filter(t => t.enabled);
}

function renderTimeSelector() {
    const container = document.getElementById('drawerTimeSelector');
    if (!container) return;
    
    container.innerHTML = '';
    const enabledTimes = getEnabledTimes();
    
    enabledTimes.forEach(time => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-sm gap-2 ${selectedTime === time.id ? 'btn-primary' : 'btn-outline'}`;
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${time.icon}
            </svg>
            ${time.label}
        `;
        btn.onclick = () => {
            selectedTime = time.id;
            renderTimeSelector();
        };
        container.appendChild(btn);
    });
    
    // Add clear button
    if (selectedTime) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-sm btn-ghost';
        clearBtn.innerHTML = '✕ Clear';
        clearBtn.onclick = () => {
            selectedTime = null;
            renderTimeSelector();
        };
        container.appendChild(clearBtn);
    }
}

// =================================================================
// SETTINGS SUBDOCK
// =================================================================

function toggleSettingsSubdock() {
    const subdock = document.getElementById('settingsSubdock');
    const isOpen = subdock.classList.contains('opacity-100');
    
    if (isOpen) {
        closeSettingsSubdock();
    } else {
        openSettingsSubdock();
    }
}

function openSettingsSubdock() {
    const subdock = document.getElementById('settingsSubdock');
    const backdrop = document.getElementById('settingsBackdrop');
    
    subdock.classList.remove('opacity-0', 'pointer-events-none');
    subdock.classList.add('opacity-100');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    
    // Start with scene headings tab
    switchSettingsTab('scene-headings');
}

function closeSettingsSubdock() {
    const subdock = document.getElementById('settingsSubdock');
    const backdrop = document.getElementById('settingsBackdrop');
    
    subdock.classList.add('opacity-0', 'pointer-events-none');
    subdock.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    backdrop.classList.remove('opacity-100');
}

function switchSettingsTab(tabName) {
    currentSettingsTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('[role="tab"]').forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('tab-active');
        } else {
            tab.classList.remove('tab-active');
        }
    });
    
    // Load tab content
    const contentContainer = document.getElementById('settingsTabContent');
    let template;
    
    switch (tabName) {
        case 'scene-headings':
            template = document.getElementById('sceneHeadingsTabTemplate');
            contentContainer.innerHTML = template.innerHTML;
            
            // Populate current settings
            const features = settingsService.getAllFeatures();
            document.getElementById('settingShowIntExt').checked = features.show_int_ext;
            document.getElementById('settingShowLocation').checked = features.show_location;
            document.getElementById('settingShowTime').checked = features.show_time;
            document.getElementById('settingShowConditions').checked = features.show_conditions;
            document.getElementById('settingShowContinuity').checked = features.show_continuity;
            
            updateSettingsPreview();
            
            // Auto-save on toggle change
            ['settingShowIntExt', 'settingShowLocation', 'settingShowTime', 'settingShowConditions', 'settingShowContinuity'].forEach(id => {
                document.getElementById(id).addEventListener('change', async () => {
                    updateSettingsPreview();
                    await saveSettings();
                });
            });
            
            // Attach close button listener
            document.getElementById('closeSubdockBtn').addEventListener('click', closeSettingsSubdock);
            break;
            
        case 'time-settings':
            template = document.getElementById('timeSettingsTabTemplate');
            contentContainer.innerHTML = template.innerHTML;
            
            // Render times and setup listeners
            renderTimesList();
            updateTimePreview();
            document.getElementById('addTimeForm').addEventListener('submit', handleAddTime);
            document.getElementById('chooseIconBtn').addEventListener('click', () => {
                const picker = new IconPicker((icon) => {
                    document.getElementById('selectedIconSvg').innerHTML = icon.path;
                    document.getElementById('newTimeIcon').value = icon.path;
                });
                picker.open();
            });
            // Attach close button listener
            document.getElementById('closeSubdockBtn').addEventListener('click', closeSettingsSubdock);
            break;
            
        case 'conditions-settings':
            template = document.getElementById('conditionsSettingsTabTemplate');
            contentContainer.innerHTML = template.innerHTML;
            
            // Render conditions and setup listeners
            renderConditionsList();
            updateConditionsPreview();
            document.getElementById('addConditionForm').addEventListener('submit', handleAddCondition);
            document.getElementById('chooseConditionIconBtn').addEventListener('click', () => {
                const picker = new IconPicker((icon) => {
                    document.getElementById('selectedConditionIconSvg').innerHTML = icon.path;
                    document.getElementById('newConditionIcon').value = icon.path;
                });
                picker.open();
            });
            // Attach close button listener
            document.getElementById('closeSubdockBtn').addEventListener('click', closeSettingsSubdock);
            break;
    }
}

function updateSettingsPreview() {
    const previewElement = document.getElementById('settingsPreview');
    if (!previewElement) return;
    
    const example = {
        int_ext: document.getElementById('settingShowIntExt').checked ? 'INT' : null,
        location_id: document.getElementById('settingShowLocation').checked ? 'COFFEE SHOP' : null,
        time: document.getElementById('settingShowTime').checked ? 'day' : null,
        continuity: document.getElementById('settingShowContinuity').checked ? 'continuous' : null
    };
    
    // Temporarily create a fake scene for preview
    const parts = [];
    if (example.int_ext) parts.push(example.int_ext + '.');
    if (example.location_id) parts.push(example.location_id);
    let heading = parts.join(' ');
    if (example.time) heading += (heading ? ' - ' : '') + 'DAY';
    if (example.continuity) heading += (heading ? ' - ' : '') + 'CONTINUOUS';
    
    previewElement.textContent = heading || '(no components enabled)';
}

async function saveSettings() {
    try {
        const settings = {
            show_int_ext: document.getElementById('settingShowIntExt').checked,
            show_location: document.getElementById('settingShowLocation').checked,
            show_time: document.getElementById('settingShowTime').checked,
            show_conditions: document.getElementById('settingShowConditions').checked,
            show_continuity: document.getElementById('settingShowContinuity').checked
        };
        
        await settingsService.updateSettings(currentProject.id, settings);
        
        // Refresh UI
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        alert('Failed to save settings');
    }
}

function updateTimePreview() {
    const previewContainer = document.getElementById('timePreview');
    if (!previewContainer) return;
    
    const times = getProjectTimes();
    const enabledTime = times.find(t => t.enabled);
    
    if (!enabledTime) {
        previewContainer.innerHTML = '<div class="text-center p-4 text-base-content/50 italic">No times enabled</div>';
        return;
    }
    
    // Get demo scene and location
    const demoScene = demoDataService.getMaximalDemoScene();
    const demoLocation = demoDataService.getDemoLocation();
    
    // Set the demo scene to use the enabled time
    demoScene.time = enabledTime.id;
    
    // Clear container
    previewContainer.innerHTML = '';
    
    // Render actual scene card
    const sceneCard = renderSceneCard(demoScene, {
        locations: [demoLocation],
        times: times,
        conditions: getProjectConditions(),
        settings: {
            show_int_ext: settingsService.isFeatureEnabled('show_int_ext'),
            show_location: settingsService.isFeatureEnabled('show_location'),
            show_time: settingsService.isFeatureEnabled('show_time'),
            show_continuity: settingsService.isFeatureEnabled('show_continuity')
        },
        continuityOptions: settingsService.getContinuityOptions(),
        highlightClasses: {
            timeIcon: 'highlight-time-icon',
            timeLabel: 'highlight-time'
        }
    });
    
    previewContainer.appendChild(sceneCard);
}

function updateConditionsPreview() {
    const previewContainer = document.getElementById('conditionsPreview');
    if (!previewContainer) return;
    
    const conditions = getProjectConditions();
    const enabledConditions = conditions.filter(c => c.enabled);
    
    if (enabledConditions.length === 0) {
        previewContainer.innerHTML = '<div class="text-center p-4 text-base-content/50 italic">No conditions enabled</div>';
        return;
    }
    
    // Get demo scene and location
    const demoScene = demoDataService.getMaximalDemoScene();
    const demoLocation = demoDataService.getDemoLocation();
    
    // Set the demo scene to use enabled conditions
    demoScene.conditions = enabledConditions.map(c => c.id);
    
    // Clear container
    previewContainer.innerHTML = '';
    
    // Render actual scene card
    const sceneCard = renderSceneCard(demoScene, {
        locations: [demoLocation],
        times: getProjectTimes(),
        conditions: conditions,
        settings: {
            show_int_ext: settingsService.isFeatureEnabled('show_int_ext'),
            show_location: settingsService.isFeatureEnabled('show_location'),
            show_time: settingsService.isFeatureEnabled('show_time'),
            show_continuity: settingsService.isFeatureEnabled('show_continuity')
        },
        continuityOptions: settingsService.getContinuityOptions(),
        highlightClasses: {
            conditionIcon: 'highlight-condition-icon'
        }
    });
    
    previewContainer.appendChild(sceneCard);
}

// =================================================================
// TIME CONFIGURATION
// =================================================================

function renderTimesList() {
    const container = document.getElementById('timesList');
    if (!container) return;
    
    container.innerHTML = '';
    const times = getProjectTimes();
    
    times.forEach((time, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-base-200 rounded-lg cursor-move';
        item.draggable = true;
        item.dataset.index = index;
        
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${time.icon}
                </svg>
                <span class="font-medium">${time.label}</span>
            </div>
            <div class="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    class="toggle toggle-primary" 
                    ${time.enabled ? 'checked' : ''}
                    onchange="toggleTime(${index})"
                />
                ${!isDefaultTime(time.id) ? `<button class="btn btn-ghost btn-xs btn-circle" onclick="deleteTime(${index})">✕</button>` : ''}
            </div>
        `;
        
        // Drag and drop event listeners
        item.addEventListener('dragstart', handleTimeDragStart);
        item.addEventListener('dragover', handleTimeDragOver);
        item.addEventListener('drop', handleTimeDrop);
        item.addEventListener('dragend', handleTimeDragEnd);
        
        container.appendChild(item);
    });
}

let draggedTimeIndex = null;

function handleTimeDragStart(e) {
    draggedTimeIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.style.opacity = '0.4';
}

function handleTimeDragOver(e) {
    e.preventDefault();
    return false;
}

function handleTimeDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const dropIndex = parseInt(e.currentTarget.dataset.index);
    
    if (draggedTimeIndex !== null && draggedTimeIndex !== dropIndex) {
        const times = [...getProjectTimes()];
        const draggedItem = times[draggedTimeIndex];
        
        // Remove from old position
        times.splice(draggedTimeIndex, 1);
        
        // Insert at new position
        times.splice(dropIndex, 0, draggedItem);
        
        // Update in database
        updateProjectTimes(times);
    }
    
    return false;
}

function handleTimeDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    draggedTimeIndex = null;
}

function isDefaultTime(id) {
    return ['morning', 'day', 'evening', 'night'].includes(id);
}

window.toggleTime = async function(index) {
    const times = [...getProjectTimes()];
    times[index].enabled = !times[index].enabled;
    await updateProjectTimes(times);
    updateTimePreview();
};

window.deleteTime = async function(index) {
    if (!confirm('Delete this time?')) return;
    const times = [...getProjectTimes()];
    times.splice(index, 1);
    await updateProjectTimes(times);
    updateTimePreview();
};

async function updateProjectTimes(times) {
    try {
        const { error } = await window.supabase
            .from('projects')
            .update({ times })
            .eq('id', currentProject.id);
        
        if (error) throw error;
        
        currentProject.times = times;
        renderTimesList();
        renderTimeSelector();
    } catch (error) {
        console.error('Error updating times:', error);
        alert('Failed to update times');
    }
}

async function handleAddTime(e) {
    e.preventDefault();
    
    const icon = document.getElementById('newTimeIcon').value.trim();
    const label = document.getElementById('newTimeLabel').value.trim();
    
    if (!icon || !label) return;
    
    const times = [...getProjectTimes()];
    const id = label.toLowerCase().replace(/\s+/g, '_');
    
    // Check if ID already exists
    if (times.some(t => t.id === id)) {
        alert('A time with this name already exists');
        return;
    }
    
    times.push({ id, label, icon, enabled: true });
    await updateProjectTimes(times);
    
    // Clear form
    document.getElementById('newTimeIcon').value = '';
    document.getElementById('newTimeLabel').value = '';
    
    // Reset icon button to default state
    const btn = document.getElementById('chooseIconBtn');
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
    const svgElement = document.getElementById('selectedIconSvg');
    svgElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />';
    
    // Update preview
    updateTimePreview();
}

// =================================================================
// CONDITIONS MANAGEMENT
// =================================================================

function getProjectConditions() {
    return currentProject.conditions || DEFAULT_CONDITIONS;
}

function getEnabledConditions() {
    return getProjectConditions().filter(c => c.enabled);
}

function renderConditionsSelector() {
    const container = document.getElementById('drawerConditionsSelector');
    if (!container) return;
    
    container.innerHTML = '';
    const enabledConditions = getEnabledConditions();
    
    enabledConditions.forEach(condition => {
        const isSelected = selectedConditions.includes(condition.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-sm gap-2 ${isSelected ? 'btn-primary' : 'btn-outline'}`;
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${condition.icon}
            </svg>
            ${condition.label}
        `;
        btn.onclick = () => {
            if (isSelected) {
                // Remove from selection
                selectedConditions = selectedConditions.filter(id => id !== condition.id);
            } else {
                // Add to selection
                selectedConditions.push(condition.id);
            }
            renderConditionsSelector();
        };
        container.appendChild(btn);
    });
    
    // Add clear button
    if (selectedConditions.length > 0) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-sm btn-ghost';
        clearBtn.innerHTML = '✕ Clear All';
        clearBtn.onclick = () => {
            selectedConditions = [];
            renderConditionsSelector();
        };
        container.appendChild(clearBtn);
    }
}

function renderConditionsList() {
    const container = document.getElementById('conditionsList');
    if (!container) return;
    
    container.innerHTML = '';
    const conditions = getProjectConditions();
    
    conditions.forEach((condition, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-base-200 rounded-lg cursor-move';
        item.draggable = true;
        item.dataset.index = index;
        
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${condition.icon}
                </svg>
                <span class="font-medium">${condition.label}</span>
            </div>
            <div class="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    class="toggle toggle-primary" 
                    ${condition.enabled ? 'checked' : ''}
                    onchange="toggleCondition(${index})"
                />
                ${!isDefaultCondition(condition.id) ? `<button class="btn btn-ghost btn-xs btn-circle" onclick="deleteCondition(${index})">✕</button>` : ''}
            </div>
        `;
        
        // Drag and drop event listeners
        item.addEventListener('dragstart', handleConditionDragStart);
        item.addEventListener('dragover', handleConditionDragOver);
        item.addEventListener('drop', handleConditionDrop);
        item.addEventListener('dragend', handleConditionDragEnd);
        
        container.appendChild(item);
    });
}

let draggedConditionIndex = null;

function handleConditionDragStart(e) {
    draggedConditionIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.style.opacity = '0.4';
}

function handleConditionDragOver(e) {
    e.preventDefault();
    return false;
}

function handleConditionDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const dropIndex = parseInt(e.currentTarget.dataset.index);
    
    if (draggedConditionIndex !== null && draggedConditionIndex !== dropIndex) {
        const conditions = [...getProjectConditions()];
        const draggedItem = conditions[draggedConditionIndex];
        
        // Remove from old position
        conditions.splice(draggedConditionIndex, 1);
        
        // Insert at new position
        conditions.splice(dropIndex, 0, draggedItem);
        
        // Update in database
        updateProjectConditions(conditions);
    }
    
    return false;
}

function handleConditionDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    draggedConditionIndex = null;
}

function isDefaultCondition(id) {
    return ['sunny', 'rainy', 'stormy', 'cold', 'hot', 'chilly'].includes(id);
}

window.toggleCondition = async function(index) {
    const conditions = [...getProjectConditions()];
    conditions[index].enabled = !conditions[index].enabled;
    await updateProjectConditions(conditions);
    updateConditionsPreview();
};

window.deleteCondition = async function(index) {
    if (!confirm('Delete this condition?')) return;
    const conditions = [...getProjectConditions()];
    conditions.splice(index, 1);
    await updateProjectConditions(conditions);
    updateConditionsPreview();
};

async function updateProjectConditions(conditions) {
    try {
        const { error } = await window.supabase
            .from('projects')
            .update({ conditions })
            .eq('id', currentProject.id);
        
        if (error) throw error;
        
        currentProject.conditions = conditions;
        renderConditionsList();
        renderConditionsSelector();
    } catch (error) {
        console.error('Error updating conditions:', error);
        alert('Failed to update conditions');
    }
}

async function handleAddCondition(e) {
    e.preventDefault();
    
    const icon = document.getElementById('newConditionIcon').value.trim();
    const label = document.getElementById('newConditionLabel').value.trim();
    
    if (!icon || !label) return;
    
    const conditions = [...getProjectConditions()];
    const id = label.toLowerCase().replace(/\s+/g, '_');
    
    // Check if ID already exists
    if (conditions.some(c => c.id === id)) {
        alert('A condition with this name already exists');
        return;
    }
    
    conditions.push({ id, label, icon, enabled: true });
    await updateProjectConditions(conditions);
    
    // Clear form
    document.getElementById('newConditionIcon').value = '';
    document.getElementById('newConditionLabel').value = '';
    
    // Reset icon button to default state
    const btn = document.getElementById('chooseConditionIconBtn');
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
    const svgElement = document.getElementById('selectedConditionIconSvg');
    svgElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />';
    
    // Update preview
    updateConditionsPreview();
}

// =================================================================
// LOCATIONS CONFIG
// =================================================================

async function openLocationsConfig() {
    console.log('🔍 openLocationsConfig called');
    await renderLocationsList();
    document.getElementById('locationsConfigModal').showModal();
}

async function renderLocationsList() {
    console.log('🔍 renderLocationsList called, locations:', locations);
    const container = document.getElementById('locationsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (locations.length === 0) {
        container.innerHTML = '<p class="text-sm text-base-content/50">No locations yet. Add one below.</p>';
        return;
    }
    
    locations.forEach((location, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-base-200 rounded-lg';
        
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="font-medium">${location.name}</span>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-xs btn-circle" onclick="deleteLocation('${location.id}')">✕</button>
            </div>
        `;
        
        container.appendChild(item);
    });
}

window.deleteLocation = async function(locationId) {
    if (!confirm('Delete this location? Scenes using it will have no location assigned.')) return;
    
    try {
        await LocationService.delete(locationId);
        locations = locations.filter(l => l.id !== locationId);
        await renderLocationsList();
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('Error deleting location:', error);
        alert('Failed to delete location');
    }
};

async function handleAddLocation(e) {
    console.log('🔍 handleAddLocation called');
    e.preventDefault();
    
    const name = document.getElementById('newLocationName').value.trim().toUpperCase();
    console.log('🔍 New location name:', name);
    
    if (!name) return;
    
    try {
        const newLocation = await LocationService.create(currentProject.id, { name });
        locations.push(newLocation);
        await renderLocationsList();
        
        // Clear form
        document.getElementById('newLocationName').value = '';
    } catch (error) {
        console.error('Error adding location:', error);
        alert('Failed to add location');
    }
}

// =================================================================
// NON-SHOOTING DAYS MANAGEMENT
// =================================================================

function getNonShootingDays() {
    const days = currentProject.non_shooting_days || [];
    console.log('📅 getNonShootingDays:', days);
    return days;
}

function isNonShootingDay(dateStr) {
    return getNonShootingDays().includes(dateStr);
}

async function toggleNonShootingDay(dateStr, isNonShooting) {
    console.log('🔄 toggleNonShootingDay:', { dateStr, isNonShooting });
    const nonShootingDays = [...getNonShootingDays()];
    console.log('  → Current non-shooting days:', nonShootingDays);
    
    if (isNonShooting && !nonShootingDays.includes(dateStr)) {
        nonShootingDays.push(dateStr);
        console.log('  → Added date to non-shooting days');
    } else if (!isNonShooting && nonShootingDays.includes(dateStr)) {
        const index = nonShootingDays.indexOf(dateStr);
        nonShootingDays.splice(index, 1);
        console.log('  → Removed date from non-shooting days');
    }
    
    console.log('  → New non-shooting days:', nonShootingDays);
    
    try {
        console.log('  → Updating database...');
        const { error } = await window.supabase
            .from('projects')
            .update({ non_shooting_days: nonShootingDays })
            .eq('id', currentProject.id);
        
        if (error) throw error;
        console.log('  → Database updated successfully');
        
        currentProject.non_shooting_days = nonShootingDays;
        console.log('  → Local project updated:', currentProject.non_shooting_days);
        
        // Split any multi-day events that cross this non-shooting day if needed
        if (isNonShooting) {
            await splitEventsOnNonShootingDay(dateStr);
        }
        
        // Re-render calendar to show updated styling
        console.log('  → Re-rendering calendar...');
        renderCalendarEvents();
        console.log('  → Applying non-shooting day styling...');
        // Use longer timeout to ensure DOM is fully rendered
        setTimeout(() => applyNonShootingDayStyling(), 200);
    } catch (error) {
        console.error('❌ Error updating non-shooting days:', error);
        alert('Failed to update non-shooting day');
    }
}

async function splitEventsOnNonShootingDay(nonShootingDate) {
    // Find all scenes that have this date in their shooting_dates
    const affectedScenes = scenes.filter(scene => 
        scene.shooting_dates && 
        scene.shooting_dates.length > 1 &&
        scene.shooting_dates.includes(nonShootingDate)
    );
    
    for (const scene of affectedScenes) {
        const dates = [...scene.shooting_dates].sort();
        const nonShootingIndex = dates.indexOf(nonShootingDate);
        
        // If non-shooting day is in the middle, we need to split
        if (nonShootingIndex > 0 && nonShootingIndex < dates.length - 1) {
            // Keep only dates before the non-shooting day
            const newDates = dates.slice(0, nonShootingIndex);
            await SceneService.setShootingDates(scene.id, newDates);
            scene.shooting_dates = newDates;
            console.log(`✂️ Split scene ${scene.scene_number}: removed dates after ${nonShootingDate}`);
        } else if (nonShootingIndex === 0 || nonShootingIndex === dates.length - 1) {
            // Non-shooting day is at the edge, just remove it
            const newDates = dates.filter(d => d !== nonShootingDate);
            await SceneService.setShootingDates(scene.id, newDates);
            scene.shooting_dates = newDates;
            console.log(`✂️ Removed ${nonShootingDate} from scene ${scene.scene_number}`);
        }
    }
}

let currentNonShootingDate = null;
let pendingSplitData = null;

async function showSplitSceneModal(scene, shootingDates, nonShootingDays, allDatesInSpan) {
    // shootingDates = only the actual shooting dates (non-shooting already filtered out)
    // allDatesInSpan = all dates from first to last (including non-shooting)
    // nonShootingDays = the non-shooting dates in between
    
    console.log('🔪 showSplitSceneModal called:', {
        sceneNumber: scene.scene_number,
        originalDates: scene.shooting_dates,
        shootingDates,
        nonShootingDays,
        allDatesInSpan
    });
    
    // Find where the split should happen (at first non-shooting day)
    const firstNonShootingDate = nonShootingDays[0];
    
    // Split the shooting dates based on the first non-shooting day
    const beforeDates = shootingDates.filter(d => d < firstNonShootingDate);
    const afterDates = shootingDates.filter(d => d > firstNonShootingDate);
    
    console.log('🔪 Split result:', {
        firstNonShootingDate,
        beforeDates,
        afterDates,
        totalBefore: beforeDates.length,
        totalAfter: afterDates.length
    });
    
    // Store data for later execution
    pendingSplitData = {
        scene,
        beforeDates,
        afterDates,
        nonShootingDays
    };
    
    // Update modal content
    const totalOriginal = scene.shooting_dates ? scene.shooting_dates.length : 0;
    const totalAfterSplit = beforeDates.length + afterDates.length;
    const message = `Scene "${scene.scene_number}: ${scene.description}" would span across ${nonShootingDays.length} non-shooting day(s). Original: ${totalOriginal} shooting days → Split: ${totalAfterSplit} shooting days total.`;
    document.getElementById('splitSceneMessage').textContent = message;
    
    // Show preview
    const preview = document.getElementById('splitScenePreview');
    preview.innerHTML = `
        <div>• Scene ${scene.scene_number}: ${formatDateRange(beforeDates)}</div>
        <div class="text-base-content/50">• Non-shooting: ${formatDateRange(nonShootingDays)}</div>
        <div>• Scene ${scene.scene_number}B: ${formatDateRange(afterDates)}</div>
    `;
    
    // Revert calendar to original state immediately
    renderCalendarEvents();
    
    // Show modal
    document.getElementById('splitSceneModal').showModal();
}

async function executeSplitScene(data) {
    const { scene, beforeDates, afterDates } = data;
    
    try {
        // Generate a split_group_id if scene doesn't have one yet
        const splitGroupId = scene.split_group_id || crypto.randomUUID();
        
        // Calculate total shooting_days_count
        // If scene already has a count (from previous split), use that
        // Otherwise, sum the current dates being split
        const totalShootingDaysCount = scene.shooting_days_count || (beforeDates.length + afterDates.length);
        
        console.log('✂️ Splitting scene with total shooting days:', totalShootingDaysCount, {
            beforeDates: beforeDates.length,
            afterDates: afterDates.length,
            existingCount: scene.shooting_days_count
        });
        
        // Update original scene with split_group_id and first part dates
        await SceneService.update(scene.id, {
            shooting_dates: beforeDates,
            split_group_id: splitGroupId,
            shooting_days_count: totalShootingDaysCount
        });
        scene.shooting_dates = beforeDates;
        scene.split_group_id = splitGroupId;
        scene.shooting_days_count = totalShootingDaysCount;
        
        // Create duplicate scene for second part with same split_group_id and count
        const newSceneData = {
            scene_number: scene.scene_number,
            description: scene.description,
            location: scene.location,
            int_ext: scene.int_ext,
            day_night: scene.day_night,
            script_day: scene.script_day,
            pages: scene.pages,
            shooting_dates: afterDates,
            split_group_id: splitGroupId,
            shooting_days_count: totalShootingDaysCount
        };
        
        // Copy time and conditions if they exist
        if (scene.time) newSceneData.time = scene.time;
        if (scene.conditions) newSceneData.conditions = scene.conditions;
        
        const createdScene = await SceneService.create(currentProject.id, newSceneData);
        scenes.push(createdScene);
        
        console.log('✂️ Scene split successfully:', {
            splitGroupId,
            original: `${scene.scene_number} (${beforeDates.length} days)`,
            new: `${newSceneData.scene_number} (${afterDates.length} days)`
        });
        
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('❌ Error splitting scene:', error);
        alert('Failed to split scene');
    }
}

async function executeMultiPartSplit(scene, parts, totalShootingDaysCount) {
    try {
        // Generate a split_group_id if scene doesn't have one yet
        const splitGroupId = scene.split_group_id || crypto.randomUUID();
        
        console.log(`✂️ Splitting scene into ${parts.length} parts with total shooting days:`, totalShootingDaysCount);
        
        // Update original scene with first part
        await SceneService.update(scene.id, {
            shooting_dates: parts[0],
            split_group_id: splitGroupId,
            shooting_days_count: totalShootingDaysCount
        });
        scene.shooting_dates = parts[0];
        scene.split_group_id = splitGroupId;
        scene.shooting_days_count = totalShootingDaysCount;
        
        // Create additional scenes for remaining parts
        for (let i = 1; i < parts.length; i++) {
            const newSceneData = {
                scene_number: scene.scene_number,
                description: scene.description,
                location: scene.location,
                int_ext: scene.int_ext,
                day_night: scene.day_night,
                script_day: scene.script_day,
                pages: scene.pages,
                shooting_dates: parts[i],
                split_group_id: splitGroupId,
                shooting_days_count: totalShootingDaysCount
            };
            
            // Copy time and conditions if they exist
            if (scene.time) newSceneData.time = scene.time;
            if (scene.conditions) newSceneData.conditions = scene.conditions;
            
            const createdScene = await SceneService.create(currentProject.id, newSceneData);
            scenes.push(createdScene);
            
            console.log(`✂️ Created part ${i + 1}/${parts.length}:`, `${newSceneData.scene_number} (${parts[i].length} days)`);
        }
        
        console.log('✂️ Multi-part split completed:', parts.length, 'parts');
        
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('❌ Error in multi-part split:', error);
        alert('Failed to split scene into multiple parts');
    }
}

function formatDateRange(dates) {
    if (!dates || dates.length === 0) return 'none';
    if (dates.length === 1) return formatDateReadable(dates[0]);
    return `${formatDateReadable(dates[0])} - ${formatDateReadable(dates[dates.length - 1])} (${dates.length} days)`;
}

function openNonShootingDayModal(dateStr) {
    currentNonShootingDate = dateStr;
    
    // Set modal content
    document.getElementById('nonShootingDayDate').textContent = formatDateReadable(dateStr);
    
    // Set toggle state
    const toggle = document.getElementById('nonShootingDayToggle');
    toggle.checked = isNonShootingDay(dateStr);
    
    // Show modal
    document.getElementById('nonShootingDayModal').showModal();
}

function formatDateFromCalendar(d) {
    let date;
    if (d.toDate && typeof d.toDate === 'function') {
        date = d.toDate();
    } else if (d instanceof Date) {
        date = d;
    } else {
        return d;
    }
    
    // Extract local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    
    console.log('📅 formatDateFromCalendar:', { 
        input: d, 
        date, 
        localDateStr,
        isoString: date.toISOString().split('T')[0]
    });
    
    return localDateStr;
}

function applyNonShootingDayStyling() {
    const nonShootingDays = getNonShootingDays();
    console.log('🎨 applyNonShootingDayStyling called - non-shooting days:', nonShootingDays);
    
    // Get all day cells in the month view
    const dayCells = document.querySelectorAll('.toastui-calendar-daygrid-cell');
    console.log('📦 Found calendar cells:', dayCells.length);
    
    if (dayCells.length === 0) {
        console.log('❌ No calendar cells found! Selector may be wrong.');
        return;
    }
    
    let styledCount = 0;
    let removedCount = 0;
    
    // Get the current calendar date context
    const currentDate = calendar.getDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed
    
    // Calculate the first day shown in the calendar grid (might be from previous month)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Toast UI uses Monday as first day (startDayOfWeek: 1), so adjust
    const daysFromPrevMonth = (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1);
    
    // Start date is first day shown in grid
    const gridStartDate = new Date(currentYear, currentMonth, 1 - daysFromPrevMonth);
    
    console.log('📆 Grid calculation:', {
        currentMonth: currentMonth + 1,
        firstDayOfMonth: firstDayOfMonth.toISOString().split('T')[0],
        startDayOfWeek,
        daysFromPrevMonth,
        gridStartDate: gridStartDate.toISOString().split('T')[0]
    });
    
    dayCells.forEach((cell, index) => {
        // Extract day number from the cell's date header
        const dateHeader = cell.querySelector('.toastui-calendar-template-monthGridHeader');
        if (!dateHeader) {
            console.log(`⚠️ Cell ${index}: No date header found`);
            return;
        }
        
        const dayNumber = parseInt(dateHeader.textContent.trim(), 10);
        if (isNaN(dayNumber)) {
            console.log(`⚠️ Cell ${index}: Invalid day number from '${dateHeader.textContent.trim()}'`);
            return;
        }
        
        // Calculate the actual date for this cell based on grid position
        const cellDate = new Date(gridStartDate);
        cellDate.setDate(gridStartDate.getDate() + index);
        
        const year = cellDate.getFullYear();
        const month = cellDate.getMonth() + 1; // Convert to 1-indexed
        const day = cellDate.getDate();
        
        // Construct the full date string
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (nonShootingDays.includes(dateStr)) {
            console.log(`✅ Cell ${index}: Styling non-shooting day:`, dateStr, `(grid day ${day})`);
            styledCount++;
            
            // Simply add the CSS class - all styling is handled by CSS
            cell.classList.add('non-shooting-day');
            
            console.log('  → Added class: non-shooting-day');
        } else {
            // Remove styling from cells that are NOT non-shooting days
            if (cell.classList.contains('non-shooting-day')) {
                console.log(`🧹 Cell ${index}: Removing styling from:`, dateStr);
                removedCount++;
                cell.classList.remove('non-shooting-day');
            }
        }
    });
    
    console.log(`🎨 Finished styling - applied to ${styledCount} cells, removed from ${removedCount} cells`);
}
