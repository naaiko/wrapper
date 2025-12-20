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

// Default times if project doesn't have times configured
const DEFAULT_TIMES = [
    { id: 'morning', label: 'Morning', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />', enabled: true },
    { id: 'day', label: 'Day', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />', enabled: true },
    { id: 'evening', label: 'Evening', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />', enabled: true },
    { id: 'night', label: 'Night', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />', enabled: true },
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
    console.log('📋 Loaded scenes:', scenes.map(s => ({ id: s.id, number: s.scene_number, time: s.time })));
    
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
        },
        template: {
            monthGridHeaderExceed(hiddenEvents) {
                return `<span class="text-xs text-base-content/50">+${hiddenEvents} more</span>`;
            },
            monthDayName(model) {
                return `<span class="text-xs font-semibold text-base-content/60">${model.label}</span>`;
            },
            time(event) {
                // Custom rendering for events to show badge + description
                const sceneNumber = event.raw?.sceneNumber || event.title.split(':')[0];
                const description = event.raw?.description || event.title.split(':').slice(1).join(':').trim();
                
                return `<div class="flex items-start gap-1.5 w-full">
                    <span class="badge badge-primary badge-xs flex-shrink-0" style="font-size: 9px; padding: 2px 4px;">${sceneNumber}</span>
                    <span class="text-xs line-clamp-2 flex-1" style="font-size: 11px; line-height: 1.3;">${description}</span>
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0" style="width: 14px; height: 14px; opacity: 0.6;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            ${event.raw.timeIcon}
                        </svg>
                    `;
                }
                
                return `<div class="flex items-start gap-1.5 w-full px-1">
                    <span class="badge badge-primary badge-xs flex-shrink-0" style="font-size: 9px; padding: 2px 4px;">${sceneNumber}</span>
                    <span class="text-xs line-clamp-1 flex-1" style="font-size: 11px; line-height: 1.3;">${description}</span>
                    ${timeIconHtml}
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
    
    // Populate editable fields
    document.getElementById('drawerSceneNumberInput').value = scene.scene_number;
    document.getElementById('drawerSceneDescriptionInput').value = scene.description;
    
    // Render time selector
    renderTimeSelector();
    
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
    
    console.log('🎬 Creating card for scene:', scene.scene_number, 'time:', scene.time);
    
    // Get time icon if available
    let timeIconHtml = '';
    if (scene.time) {
        const times = getProjectTimes();
        const timeData = times.find(t => t.id === scene.time);
        console.log('⏰ Time data found:', timeData);
        if (timeData) {
            timeIconHtml = `
                <div class="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        ${timeData.icon}
                    </svg>
                </div>
            `;
        }
    }
    
    card.innerHTML = `
        <div class="card-body p-1.5">
            <div class="flex items-start gap-2">
                <div class="badge badge-primary badge-xs flex-shrink-0" style="padding: 2px 6px; font-size: 10px;">${scene.scene_number}</div>
                <p class="text-xs flex-1 line-clamp-2 text-base-content/80">${scene.description}</p>
                ${timeIconHtml}
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
    
    // Icon picker button
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
            console.log('💾 Saving scene with time:', selectedTime);
            await SceneService.update(sceneId, {
                scene_number: sceneNumber,
                description: description,
                time: selectedTime,
            });
            
            // Update local data
            const scene = scenes.find(s => s.id === sceneId);
            if (scene) {
                scene.scene_number = sceneNumber;
                scene.description = description;
                scene.time = selectedTime;
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
