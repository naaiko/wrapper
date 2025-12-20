// =================================================================
// CALENDAR VIEW - Main Calendar Controller
// =================================================================

import { SceneService } from './services/sceneService.js';
import { SceneRenderer } from './ui/sceneRenderer.js';

const CURRENT_PROJECT_KEY = 'continuityManager_currentProject';

let currentProject = null;
let scenes = [];
let currentDate = new Date();
let draggedScene = null;
let dragSourceDate = null; // Track where the scene came from
let expandedDays = new Set(); // Track which days are expanded (for days with many scenes)

// =================================================================
// INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const projectId = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!projectId) {
        window.location.href = 'projects.html';
        return;
    }

    // Load project (using supabaseClient directly for now)
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
    
    // Update navbar
    document.querySelector('.navbar .btn-ghost.text-xl').textContent = currentProject.name;
    
    // Render calendar
    renderCalendar();
    renderUnscheduledScenes();
    
    // Setup event listeners
    setupEventListeners();
});

// =================================================================
// CALENDAR RENDERING
// =================================================================

// =================================================================
// RENDER CALENDAR
// =================================================================

function createDayElement(date, currentMonth, dayIndex) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    
    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    div.dataset.date = dateStr;
    
    // Add classes
    if (date.getMonth() !== currentMonth) {
        div.classList.add('other-month');
    }
    
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        div.classList.add('today');
    }
    
    // Header with date
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = date.getDate();
    header.appendChild(dayNumber);
    
    // Scene count badge
    const scenesForDay = scenes.filter(s => 
        s.shooting_dates && s.shooting_dates.includes(dateStr)
    );
    
    if (scenesForDay.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'scene-count-badge';
        badge.textContent = scenesForDay.length;
        header.appendChild(badge);
    }
    
    div.appendChild(header);
    
    // Render single-day scenes in this cell
    const scenesContainer = document.createElement('div');
    scenesContainer.className = 'scenes-container';
    
    // Check if day should be collapsed (more than 2 scenes and not expanded)
    const isExpanded = expandedDays.has(dateStr);
    const shouldCollapse = scenesForDay.length > 2 && !isExpanded;
    
    if (shouldCollapse) {
        div.classList.add('collapsed');
    }
    
    scenesForDay.forEach((scene, index) => {
        // Only render if it's a single-day scene
        if (!scene.shooting_dates || scene.shooting_dates.length === 1) {
            if (shouldCollapse) {
                // Show thin bar instead of full card
                const bar = createCollapsedSceneBar(scene, dateStr);
                scenesContainer.appendChild(bar);
            } else {
                const sceneCard = createUniformSceneCard(scene, dateStr, false);
                scenesContainer.appendChild(sceneCard);
            }
        }
    });
    
    div.appendChild(scenesContainer);
    
    // Drag and drop
    setupDayDropZone(div);
    
    return div;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarTitle').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    // Start from Monday (0=Sunday needs -6, 1=Monday needs 0, 2=Tuesday needs -1, etc.)
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Calculate how many weeks we need (minimum to show all days of the month)
    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    endDate.setDate(endDate.getDate() + (lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek)); // End on Sunday
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const weeksNeeded = Math.ceil(totalDays / 7);
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Set grid to have exactly the number of rows we need
    grid.style.gridTemplateRows = `auto repeat(${weeksNeeded}, 1fr)`;
    
    // Weekday headers
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-weekday-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Calendar days (only weeks needed) - explicitly position each day
    const currentDay = new Date(startDate);
    for (let i = 0; i < weeksNeeded * 7; i++) {
        const dayElement = createDayElement(currentDay, month, i);
        const row = Math.floor(i / 7) + 2; // +2 for header row
        const col = (i % 7) + 1; // +1 because grid is 1-indexed
        dayElement.style.gridRow = row;
        dayElement.style.gridColumn = col;
        dayElement.dataset.dayIndex = i; // Store index for position calculation
        grid.appendChild(dayElement);
        currentDay.setDate(currentDay.getDate() + 1);
    }
    
    // Create separate overlay container for multi-day scenes
    const overlay = document.createElement('div');
    overlay.className = 'multi-day-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1;
    `;
    grid.appendChild(overlay);
    
    // Now render all multi-day scenes in the overlay
    renderMultiDayScenes(overlay, grid, startDate, weeksNeeded);
}

function renderMultiDayScenes(overlay, grid, calendarStartDate, weeksNeeded) {
    // Track which scenes we've already rendered and which rows are occupied
    const renderedScenes = new Set();
    const occupiedRows = {}; // dateStr -> [occupied row indices]
    
    // Get all multi-day scenes and sort by start date
    const multiDayScenes = scenes
        .filter(s => s.shooting_dates && s.shooting_dates.length > 1)
        .map(s => ({ scene: s, startDate: [...s.shooting_dates].sort()[0] }))
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
    
    multiDayScenes.forEach(({ scene }) => {
        if (renderedScenes.has(scene.id)) return;
        
        const sortedDates = [...scene.shooting_dates].sort();
        const sceneStart = new Date(sortedDates[0]);
        const sceneEnd = new Date(sortedDates[sortedDates.length - 1]);
        
        // Normalize to midnight
        const gridStart = new Date(calendarStartDate);
        gridStart.setHours(0, 0, 0, 0);
        sceneStart.setHours(0, 0, 0, 0);
        sceneEnd.setHours(0, 0, 0, 0);
        
        // Calculate position in grid
        const daysSinceGridStart = Math.round((sceneStart - gridStart) / (1000 * 60 * 60 * 24));
        
        // Skip if scene starts before visible calendar
        if (daysSinceGridStart < 0) return;
        
        const startRow = Math.floor(daysSinceGridStart / 7);
        const startCol = daysSinceGridStart % 7;
        
        // Find available row within the day (for stacking multiple multi-day scenes)
        const dateStr = sortedDates[0];
        if (!occupiedRows[dateStr]) occupiedRows[dateStr] = [];
        
        let sceneRow = 0;
        while (occupiedRows[dateStr].includes(sceneRow)) {
            sceneRow++;
        }
        occupiedRows[dateStr].push(sceneRow);
        
        // Get the actual grid cell element to calculate position
        const firstDayCell = grid.querySelector(`[data-day-index=\"${daysSinceGridStart}\"]`);
        if (!firstDayCell) return;
        
        const cellRect = firstDayCell.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        
        // Calculate how many days fit in this week
        const daysInFirstWeek = Math.min(scene.shooting_dates.length, 7 - startCol);
        
        // Create the scene card
        const card = createUniformSceneCard(scene, sortedDates[0], true);
        card.style.position = 'absolute';
        card.style.left = `${cellRect.left - gridRect.left}px`;
        card.style.top = `${cellRect.top - gridRect.top + 35 + (sceneRow * 60)}px`; // 35px for header, 60px per row
        card.style.width = `calc(${daysInFirstWeek * cellRect.width}px + ${(daysInFirstWeek - 1) * 8}px)`; // Include gaps
        card.style.pointerEvents = 'auto';
        card.style.zIndex = 5;
        
        overlay.appendChild(card);
        renderedScenes.add(scene.id);
        
        // TODO: Handle multi-week spanning (for now only first week)
    });
}

function createCollapsedSceneBar(scene, dateStr) {
    const bar = document.createElement('div');
    bar.className = 'collapsed-scene-bar';
    bar.dataset.sceneId = scene.id;
    bar.dataset.date = dateStr;
    bar.style.cssText = `
        height: 4px;
        background: hsl(var(--p));
        border-radius: 2px;
        margin: 2px 0;
        cursor: pointer;
        transition: all 0.2s;
    `;
    
    bar.addEventListener('mouseenter', (e) => {
        e.target.style.height = '6px';
        e.target.style.background = 'hsl(var(--p) / 0.8)';
    });
    
    bar.addEventListener('mouseleave', (e) => {
        e.target.style.height = '4px';
        e.target.style.background = 'hsl(var(--p))';
    });
    
    bar.addEventListener('click', () => {
        // Expand this day
        expandedDays.add(dateStr);
        renderCalendar();
        renderUnscheduledScenes();
    });
    
    return bar;
}

function createUniformSceneCard(scene, dateStr, isMultiDay = false) {
    const totalDays = scene.shooting_dates ? scene.shooting_dates.length : 1;
    const showRemoveButton = dateStr !== null; // Only show on scheduled scenes
    
    const card = document.createElement('div');
    card.className = 'scene-card-container';
    card.dataset.sceneId = scene.id;
    
    const removeButtonHTML = showRemoveButton ? `
        <button class="btn btn-ghost btn-circle btn-xs remove-from-date-btn" 
                data-scene-id="${scene.id}" 
                data-date="${dateStr}"
                data-is-multiday="${isMultiDay}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    ` : '';
    
    card.innerHTML = `
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow compact-card">
            <div class="card-body" style="padding: 0.5rem !important;">
                <div class="flex items-start justify-between gap-1.5">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1 flex-wrap">
                            <span class="badge badge-primary badge-sm" style="padding: 0.25rem 0.5rem;">${scene.scene_number}</span>
                            ${totalDays > 1 ? `<span class="badge badge-outline badge-xs">${totalDays}d</span>` : ''}
                        </div>
                        <p class="text-xs mt-1 line-clamp-2 text-base-content/80" style="margin-bottom: 0;">${scene.description}</p>
                    </div>
                    ${removeButtonHTML}
                </div>
            </div>
            ${showRemoveButton ? `
                <div class="resize-handle resize-handle-left" data-direction="left"></div>
                <div class="resize-handle resize-handle-right" data-direction="right"></div>
            ` : ''}
        </div>
    `;
    
    // Only setup resize for scheduled scenes
    if (showRemoveButton) {
        setupResizeHandles(card, scene);
    }
    
    // Remove button
    const removeBtn = card.querySelector('.remove-from-date-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isMultiDay = removeBtn.dataset.isMultiday === 'true';
            console.log('🗑️ REMOVE CLICKED:', {
                sceneId: removeBtn.dataset.sceneId,
                isMultiDay,
                dataset: removeBtn.dataset
            });
            if (isMultiDay) {
                // For multi-day scenes, remove ALL dates (unschedule completely)
                await removeEntireScene(removeBtn.dataset.sceneId);
            } else {
                // For single-day scenes, remove just this date
                await removeSceneFromDate(removeBtn.dataset.sceneId, removeBtn.dataset.date);
            }
        });
    }
    
    // Make card draggable
    const cardEl = card.querySelector('.card');
    cardEl.draggable = true;
    
    cardEl.addEventListener('dragstart', (e) => {
        draggedScene = scene;
        dragSourceDate = dateStr;
        e.currentTarget.classList.add('opacity-50');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', scene.id);
        
        console.log('🔵 DRAG GESTART:', {
            scene: scene.scene_number,
            van_dag: dateStr || 'unscheduled'
        });
    });
    
    cardEl.addEventListener('dragend', (e) => {
        e.currentTarget.classList.remove('opacity-50');
    });
    
    return card;
}

function createCalendarSceneCard(scene, sourceDate = null) {
    return createUniformSceneCard(scene, sourceDate, false);
}

function setupDayDropZone(dayElement) {
    dayElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dayElement.classList.add('drag-over');
    });
    
    dayElement.addEventListener('dragleave', (e) => {
        if (e.target === dayElement) {
            dayElement.classList.remove('drag-over');
        }
    });
    
    dayElement.addEventListener('drop', async (e) => {
        e.preventDefault();
        dayElement.classList.remove('drag-over');
        
        if (!draggedScene) {
            console.warn('Drop event fired but no draggedScene found');
            return;
        }
        
        const targetDate = dayElement.dataset.date;
        const sceneId = draggedScene.id;
        
        // Don't do anything if dropping on the same date
        if (dragSourceDate === targetDate) {
            draggedScene = null;
            dragSourceDate = null;
            return;
        }
        
        try {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene) return;
            
            const currentDates = scene.shooting_dates || [];
            let newDates = [...currentDates];
            
            // If coming from another date, remove the old date
            if (dragSourceDate && newDates.includes(dragSourceDate)) {
                newDates = newDates.filter(d => d !== dragSourceDate);
            }
            
            // Add new date if not already there
            if (!newDates.includes(targetDate)) {
                newDates.push(targetDate);
                newDates.sort();
            }
            
            // Update in database
            await SceneService.setShootingDates(sceneId, newDates);
            
            // Update local array
            scene.shooting_dates = newDates;
            
            console.log('🟢 SCENE GEDROPT:', {
                scene: scene.scene_number,
                van_dag: dragSourceDate || 'unscheduled',
                naar_dag: targetDate,
                alle_dates: newDates
            });
            
            // Clear drag state
            draggedScene = null;
            dragSourceDate = null;
            
            // Re-render
            renderCalendar();
            renderUnscheduledScenes();
        } catch (error) {
            console.error('Error moving scene:', error);
            alert('Failed to move scene');
            draggedScene = null;
            dragSourceDate = null;
        }
    });
}

// =================================================================
// RESIZE MULTI-DAY SCENES
// =================================================================

function setupResizeHandles(card, scene) {
    const handles = card.querySelectorAll('.resize-handle');
    
    handles.forEach(handle => {
        let isResizing = false;
        let startX = 0;
        let startDates = [];
        let direction = handle.dataset.direction;
        let lastDaysDelta = 0;
        
        const onMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX || e.touches[0].clientX;
            startDates = [...scene.shooting_dates].sort();
            lastDaysDelta = 0;
            handle.classList.add('resizing');
            card.style.opacity = '0.8';
            
            console.log('🔵 STRETCH GESTART:', {
                scene: scene.scene_number,
                richting: direction,
                originele_dates: startDates
            });
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchmove', onMouseMove);
            document.addEventListener('touchend', onMouseUp);
        };
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            e.preventDefault();
            
            const currentX = e.clientX || e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // Calculate how many days to add/remove based on pixel movement
            const grid = document.getElementById('calendarGrid');
            const gridWidth = grid.offsetWidth;
            const dayWidth = (gridWidth - (6 * 8)) / 7; // 7 columns, 6 gaps
            const daysDelta = Math.round(deltaX / dayWidth);
            
            // Only update if changed
            if (daysDelta !== lastDaysDelta) {
                lastDaysDelta = daysDelta;
                updateSceneDates(scene, direction, daysDelta, startDates);
                
                // Update day count display
                const totalDays = scene.shooting_dates.length;
                const dayCountEl = card.querySelector('.text-xs.opacity-70');
                if (dayCountEl) {
                    dayCountEl.textContent = `${totalDays} days`;
                } else {
                    // Add days indicator if it doesn't exist yet
                    const cardBody = card.querySelector('.card-body');
                    if (cardBody && totalDays > 1) {
                        const daysText = document.createElement('p');
                        daysText.className = 'text-xs opacity-70 mt-1';
                        daysText.textContent = `${totalDays} days`;
                        cardBody.querySelector('div').appendChild(daysText);
                    }
                }
            }
        };
        
        const onMouseUp = async (e) => {
            if (!isResizing) return;
            isResizing = false;
            handle.classList.remove('resizing');
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
            
            console.log('🟢 STRETCH GESTOPT:', {
                scene: scene.scene_number,
                van: startDates,
                naar: scene.shooting_dates,
                verschil_dagen: scene.shooting_dates.length - startDates.length
            });
            
            // Save to database and fully re-render
            try {
                await SceneService.setShootingDates(scene.id, scene.shooting_dates);
                renderCalendar();
                renderUnscheduledScenes();
            } catch (error) {
                console.error('Error updating scene dates:', error);
                alert('Failed to update scene dates');
                // Revert
                scene.shooting_dates = startDates;
                renderCalendar();
            }
        };
        
        handle.addEventListener('mousedown', onMouseDown);
        handle.addEventListener('touchstart', onMouseDown);
    });
}

function updateSceneDates(scene, direction, daysDelta, originalDates) {
    const sortedDates = [...originalDates].sort();
    
    // Parse date string to avoid timezone issues (YYYY-MM-DD)
    const parseLocalDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    };
    
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const startDate = parseLocalDate(sortedDates[0]);
    const endDate = parseLocalDate(sortedDates[sortedDates.length - 1]);
    
    if (direction === 'left') {
        // Adjust start date
        startDate.setDate(startDate.getDate() + daysDelta);
        // Don't allow start to go past end
        if (startDate > endDate) {
            startDate.setTime(endDate.getTime());
        }
    } else {
        // Adjust end date
        endDate.setDate(endDate.getDate() + daysDelta);
        // Don't allow end to go before start
        if (endDate < startDate) {
            endDate.setTime(startDate.getTime());
        }
    }
    
    // Generate all dates in the range
    const newDates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
        newDates.push(formatLocalDate(current));
        current.setDate(current.getDate() + 1);
    }
    
    scene.shooting_dates = newDates;
}

// =================================================================
// REMOVE SCENE FROM DATE
// =================================================================

async function removeEntireScene(sceneId) {
    try {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) {
            console.error('Scene not found:', sceneId);
            return;
        }
        
        // Clear all shooting dates
        await SceneService.setShootingDates(sceneId, []);
        
        // Update local state
        scene.shooting_dates = [];
        
        // Re-render
        renderCalendar();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('Error removing entire scene:', error);
        alert('Failed to remove scene from calendar');
    }
}

async function removeSceneFromDate(sceneId, dateToRemove) {
    try {
        // Find the scene
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) {
            console.error('Scene not found:', sceneId);
            return;
        }
        
        // Remove the date from shooting_dates
        const newDates = (scene.shooting_dates || []).filter(d => d !== dateToRemove);
        
        // Update database
        await SceneService.setShootingDates(sceneId, newDates);
        
        // Update local state
        scene.shooting_dates = newDates;
        
        // Re-render
        renderCalendar();
        renderUnscheduledScenes();
    } catch (error) {
        console.error('Error removing scene from date:', error);
        alert('Failed to remove scene from date');
    }
}

// =================================================================
// UNSCHEDULED SCENES
// =================================================================

function renderUnscheduledScenes() {
    const container = document.getElementById('unscheduledScenes');
    const unscheduled = scenes.filter(s => !s.shooting_dates || s.shooting_dates.length === 0);
    
    if (unscheduled.length === 0) {
        container.innerHTML = '<div class="text-sm text-base-content/50 text-center py-4">All scenes scheduled!</div>';
        return;
    }
    
    container.innerHTML = '';
    unscheduled.forEach(scene => {
        const card = createUniformSceneCard(scene, null, false); // null = unscheduled
        container.appendChild(card);
    });
}

// =================================================================
// EVENT LISTENERS
// =================================================================

function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    document.getElementById('addSceneBtn').addEventListener('click', showAddSceneModal);
    document.getElementById('addSceneFromCalendar').addEventListener('click', showAddSceneModal);
    document.getElementById('addSceneForm').addEventListener('submit', addScene);
    document.getElementById('cancelSceneBtn').addEventListener('click', () => {
        document.getElementById('addSceneModal').close();
    });
}

// =================================================================
// SCENE CRUD
// =================================================================

function showAddSceneModal() {
    document.getElementById('sceneNumber').value = '';
    document.getElementById('sceneDescription').value = '';
    document.getElementById('addSceneModal').showModal();
}

async function addScene(event) {
    event.preventDefault();
    
    const sceneNumber = document.getElementById('sceneNumber').value.trim();
    const description = document.getElementById('sceneDescription').value.trim();
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading loading-spinner"></span> Adding...';
        
        const newScene = await SceneService.create(currentProject.id, {
            scene_number: sceneNumber,
            description: description,
            shooting_dates: []
        });
        
        scenes.push(newScene);
        
        renderCalendar();
        renderUnscheduledScenes();
        
        document.getElementById('addSceneModal').close();
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Scene';
    } catch (error) {
        console.error('Error adding scene:', error);
        alert('Failed to add scene: ' + error.message);
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Scene';
    }
}
