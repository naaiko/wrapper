// =================================================================
// CALENDAR VIEW - Toast UI Calendar Implementation
// =================================================================

import { SceneService } from './services/sceneService.js';
import { IconPicker } from './components/iconPicker.js';

const CURRENT_PROJECT_KEY = 'continuityManager_currentProject';

let currentProject = null;
let scenes = [];
let calendar = null;
let selectedTime = null; // Currently selected time in drawer
let selectedConditions = []; // Currently selected conditions in drawer (array)

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
// INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Load scenes
    scenes = await SceneService.getAll(currentProject.id);
    console.log('📋 Loaded scenes:', scenes.map(s => ({ id: s.id, number: s.scene_number, time: s.time, conditions: s.conditions })));
    
    // Update navbar
    document.querySelector('.navbar .btn-ghost.text-xl').textContent = currentProject.name;
    
    // Initialize Toast UI Calendar
    initializeCalendar();
    
    // Render calendar and unscheduled scenes
    renderCalendarEvents();
    renderUnscheduledScenes();
    
    // Setup event listeners
    setupEventListeners();
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
                
                // Get time icon if available
                let timeIconHtml = '';
                if (event.raw?.timeIcon) {
                    timeIconHtml = `
                        <div style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 25px; height: 25px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.85);">
                            <svg xmlns="http://www.w3.org/2000/svg" style="width: 15px; height: 15px; color: #ffffff; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    
    return {
        id: scene.id,
        calendarId: 'scenes',
        title: `${scene.scene_number}: ${scene.description}`,
        start,
        end,
        category: 'allday',
        isAllday: true,
        backgroundColor: 'hsl(var(--b1))',
        borderColor: 'hsl(var(--b3))',
        color: 'hsl(var(--bc))',
        raw: {
            sceneNumber: scene.scene_number,
            description: scene.description,
            shootingDates: scene.shooting_dates,
            timeIcon: timeIcon,
            conditionIcons: conditionIcons,
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
    
    console.log('📅 EVENT UPDATE:', {
        scene: event.title,
        originalStart: formatDate(event.start),
        originalEnd: formatDate(event.end),
        newStart: changes.start ? formatDate(changes.start) : 'unchanged',
        newEnd: changes.end ? formatDate(changes.end) : 'unchanged',
    });
    
    const scene = scenes.find(s => s.id === event.id);
    if (!scene) return;
    
    // Calculate new dates based on changes
    let newDates = [...scene.shooting_dates];
    
    if (changes.start || changes.end) {
        const startDate = changes.start?.toDate ? changes.start.toDate() : new Date(event.start);
        const endDate = changes.end?.toDate ? changes.end.toDate() : new Date(event.end);
        
        console.log('🕐 Date range:', {
            start: formatDate(startDate),
            end: formatDate(endDate),
        });
        
        // Generate date range using local dates (no timezone conversion)
        newDates = [];
        const currentYear = startDate.getFullYear();
        const currentMonth = startDate.getMonth();
        const currentDay = startDate.getDate();
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth();
        const endDay = endDate.getDate();
        
        let loopDate = new Date(currentYear, currentMonth, currentDay);
        const loopEndDate = new Date(endYear, endMonth, endDay);
        
        while (loopDate <= loopEndDate) {
            const dateStr = formatDate(loopDate);
            newDates.push(dateStr);
            loopDate.setDate(loopDate.getDate() + 1);
        }
        
        newDates.sort();
    }
    
    console.log('✅ New dates:', newDates);
    
    try {
        await SceneService.setShootingDates(event.id, newDates);
        scene.shooting_dates = newDates;
        renderCalendarEvents();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('❌ Error updating event:', error);
        alert('Failed to update scene dates');
        renderCalendarEvents(); // Revert
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
        await SceneService.setShootingDates(event.id, []);
        const scene = scenes.find(s => s.id === event.id);
        if (scene) {
            scene.shooting_dates = [];
        }
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

let currentDrawerEvent = null;

function openSceneDrawer(event) {
    const scene = scenes.find(s => s.id === event.id);
    if (!scene) return;
    
    currentDrawerEvent = event;
    
    // Set selected time
    selectedTime = scene.time || null;
    
    // Set selected conditions (copy array to avoid reference issues)
    selectedConditions = scene.conditions ? [...scene.conditions] : [];
    
    // Populate editable fields
    document.getElementById('drawerSceneNumberInput').value = scene.scene_number;
    document.getElementById('drawerSceneDescriptionInput').value = scene.description;
    
    // Render time selector
    renderTimeSelector();
    
    // Render conditions selector
    renderConditionsSelector();
    
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
        await SceneService.setShootingDates(sceneId, [dateStr]);
        scene.shooting_dates = [dateStr];
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
    const card = document.createElement('div');
    card.className = 'card bg-white border border-base-300 shadow-sm hover:shadow-md transition-shadow cursor-move';
    card.style.borderRadius = '6px';
    card.draggable = true;
    card.dataset.sceneId = scene.id;
    
    console.log('🎬 Creating card for scene:', scene.scene_number, 'time:', scene.time, 'conditions:', scene.conditions);
    
    // Get time icon if available
    let timeIconHtml = '';
    if (scene.time) {
        const times = getProjectTimes();
        const timeData = times.find(t => t.id === scene.time);
        console.log('⏰ Time data found:', timeData);
        if (timeData) {
            timeIconHtml = `
                <div class="flex-shrink-0 flex items-center justify-center" style="width: 24px; height: 24px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.85);">
                    <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0" style="width: 14px; height: 14px; color: #ffffff;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        ${timeData.icon}
                    </svg>
                </div>
            `;
        }
    }
    
    // Get condition icons if available
    let conditionIconsHtml = '';
    if (scene.conditions && scene.conditions.length > 0) {
        const conditions = getProjectConditions();
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
                ? 'width: 24px; height: 24px; border-radius: 50%;' 
                : 'padding: 3px 8px; border-radius: 12px;';
            conditionIconsHtml = `
                <div class="flex-shrink-0 flex items-center justify-center gap-1" style="${containerStyle} background-color: rgba(0, 0, 0, 0.05);">
                    ${iconSvgs}
                </div>
            `;
        }
    }
    
    card.innerHTML = `
        <div class="card-body p-1.5">
            <div class="flex items-center gap-2">
                <div class="badge badge-primary badge-xs flex-shrink-0" style="padding: 2px 6px; font-size: 10px;">${scene.scene_number}</div>
                <p class="text-xs flex-1 line-clamp-2 text-base-content/80">${scene.description}</p>
                ${timeIconHtml}
                ${conditionIconsHtml}
            </div>
        </div>
    `;
    
    // Drag start
    card.addEventListener('dragstart', (e) => {
        draggedSceneId = scene.id;
        e.dataTransfer.setData('sceneId', scene.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('opacity-50');
        console.log('🔵 DRAG START:', { scene: scene.scene_number });
    });
    
    card.addEventListener('dragend', () => {
        card.classList.remove('opacity-50');
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
        
        // Extract the day number from the cell
        const dateHeader = cell.querySelector('.toastui-calendar-template-monthGridHeader');
        if (!dateHeader) {
            console.log('⚠️ Could not find date header');
            draggedSceneId = null;
            return;
        }
        
        const dayNumber = parseInt(dateHeader.textContent.trim(), 10);
        
        // Get the current month/year from the calendar
        const currentDate = calendar.getDate();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Convert to 1-indexed
        
        // Construct date string directly to avoid timezone issues
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        
        console.log('📅 Drop date calculated:', {
            dayNumber,
            month,
            year,
            fullDate: dateStr,
        });
        
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
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        calendar.next();
        updateCalendarTitle();
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        calendar.today();
        updateCalendarTitle();
    });
    
    // Add scene modal
    document.getElementById('addSceneBtn').addEventListener('click', () => {
        document.getElementById('addSceneModal').showModal();
    });
    
    document.getElementById('addSceneFromCalendar').addEventListener('click', () => {
        document.getElementById('addSceneModal').showModal();
    });
    
    document.getElementById('cancelSceneBtn').addEventListener('click', () => {
        document.getElementById('addSceneModal').close();
    });
    
    document.getElementById('addSceneForm').addEventListener('submit', handleAddScene);
    
    // Config button
    document.getElementById('configBtn').addEventListener('click', openTimeConfig);
    document.getElementById('closeTimeConfigBtn').addEventListener('click', () => {
        document.getElementById('timeConfigModal').close();
    });
    document.getElementById('addTimeForm').addEventListener('submit', handleAddTime);
    
    // Conditions config button
    document.getElementById('conditionsConfigBtn').addEventListener('click', openConditionsConfig);
    document.getElementById('closeConditionsConfigBtn').addEventListener('click', () => {
        document.getElementById('conditionsConfigModal').close();
    });
    document.getElementById('addConditionForm').addEventListener('submit', handleAddCondition);
    
    // Icon picker button (time)
    document.getElementById('chooseIconBtn').addEventListener('click', () => {
        const picker = new IconPicker((selectedIcon) => {
            // Set the hidden input value
            document.getElementById('newTimeIcon').value = selectedIcon.path;
            
            // Update the icon in the round button
            const svgElement = document.getElementById('selectedIconSvg');
            svgElement.innerHTML = selectedIcon.path;
            
            // Change button style to show it's selected
            const btn = document.getElementById('chooseIconBtn');
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');
        });
        picker.open();
    });
    
    // Icon picker button (conditions)
    document.getElementById('chooseConditionIconBtn').addEventListener('click', () => {
        const picker = new IconPicker((selectedIcon) => {
            // Set the hidden input value
            document.getElementById('newConditionIcon').value = selectedIcon.path;
            
            // Update the icon in the round button
            const svgElement = document.getElementById('selectedConditionIconSvg');
            svgElement.innerHTML = selectedIcon.path;
            
            // Change button style to show it's selected
            const btn = document.getElementById('chooseConditionIconBtn');
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');
        });
        picker.open();
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
        const description = document.getElementById('drawerSceneDescriptionInput').value.trim();
        
        if (!sceneNumber || !description) return;
        
        try {
            console.log('💾 Saving scene with time:', selectedTime, 'and conditions:', selectedConditions);
            await SceneService.update(sceneId, {
                scene_number: sceneNumber,
                description: description,
                time: selectedTime,
                conditions: selectedConditions,
            });
            
            // Update local data
            const scene = scenes.find(s => s.id === sceneId);
            if (scene) {
                scene.scene_number = sceneNumber;
                scene.description = description;
                scene.time = selectedTime;
                scene.conditions = [...selectedConditions];
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
    
    const sceneNumber = document.getElementById('sceneNumber').value.trim();
    const description = document.getElementById('sceneDescription').value.trim();
    
    if (!sceneNumber || !description) return;
    
    try {
        const newScene = await SceneService.create(currentProject.id, {
            scene_number: sceneNumber,
            description: description,
            shooting_dates: [],
        });
        
        scenes.push(newScene);
        renderUnscheduledScenes();
        
        // Clear form and close modal
        document.getElementById('sceneNumber').value = '';
        document.getElementById('sceneDescription').value = '';
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

async function openTimeConfig() {
    renderTimesList();
    document.getElementById('timeConfigModal').showModal();
}

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
};

window.deleteTime = async function(index) {
    if (!confirm('Delete this time?')) return;
    const times = [...getProjectTimes()];
    times.splice(index, 1);
    await updateProjectTimes(times);
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

async function openConditionsConfig() {
    renderConditionsList();
    document.getElementById('conditionsConfigModal').showModal();
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
};

window.deleteCondition = async function(index) {
    if (!confirm('Delete this condition?')) return;
    const conditions = [...getProjectConditions()];
    conditions.splice(index, 1);
    await updateProjectConditions(conditions);
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
}
