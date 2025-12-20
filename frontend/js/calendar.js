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
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-weekday-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Calendar days (6 weeks)
    const currentDay = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayElement = createDayElement(currentDay, month);
        grid.appendChild(dayElement);
        currentDay.setDate(currentDay.getDate() + 1);
    }
}

function createDayElement(date, currentMonth) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    
    const dateStr = date.toISOString().split('T')[0];
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
    
    // Scenes for this day
    const scenesContainer = document.createElement('div');
    scenesContainer.className = 'space-y-1';
    scenesForDay.forEach(scene => {
        const sceneCard = createCalendarSceneCard(scene);
        scenesContainer.appendChild(sceneCard);
    });
    div.appendChild(scenesContainer);
    
    // Drag and drop
    setupDayDropZone(div);
    
    return div;
}

function createCalendarSceneCard(scene) {
    const div = document.createElement('div');
    div.innerHTML = SceneRenderer.renderCalendarCard(scene);
    const card = div.firstElementChild;
    
    card.addEventListener('dragstart', (e) => {
        draggedScene = scene;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    card.addEventListener('dragend', (e) => {
        e.currentTarget.classList.remove('dragging');
        draggedScene = null;
    });
    
    return card;
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
        
        if (!draggedScene) return;
        
        const date = dayElement.dataset.date;
        
        // Add date to scene's shooting_dates
        try {
            await SceneService.addShootingDate(draggedScene.id, date);
            
            // Update local scenes array
            const scene = scenes.find(s => s.id === draggedScene.id);
            if (scene) {
                if (!scene.shooting_dates) scene.shooting_dates = [];
                if (!scene.shooting_dates.includes(date)) {
                    scene.shooting_dates.push(date);
                    scene.shooting_dates.sort();
                }
            }
            
            // Re-render
            renderCalendar();
            renderUnscheduledScenes();
        } catch (error) {
            console.error('Error adding shooting date:', error);
            alert('Failed to add shooting date');
        }
    });
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
        const card = createCalendarSceneCard(scene);
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
