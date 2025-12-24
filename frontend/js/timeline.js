// =================================================================
// IMPORTS
// =================================================================

import Sortable from 'sortablejs';
import { AddSceneScreen } from './screens/addSceneScreen.js';
import { SceneEditScreen } from './screens/sceneEditScreen.js';
import settingsService from './services/settingsService.js';
import { loadOnboardingSteps } from './services/onboardingService.js';

// =================================================================
// DATA MODEL
// =================================================================

const CURRENT_PROJECT_KEY = 'continuityManager_currentProject';
let addSceneScreen = null;
let sceneEditScreen = null;
let sortableInstance = null;
let currentZoom = 1.0; // Zoom level: 0.5 (50%) to 2.0 (200%)

// Queue system for scene order updates
let updateQueue = [];
let isProcessingQueue = false;

/**
 * Get current project ID from localStorage
 */
function getCurrentProjectId() {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
}

/**
 * Get current project from Supabase
 */
async function getCurrentProject() {
    const projectId = getCurrentProjectId();
    if (!projectId) {
        // No project selected, redirect to projects page
        window.location.href = 'projects.html';
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) throw error;
        
        if (!data) {
            // Project not found, redirect to projects page
            window.location.href = 'projects.html';
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching project:', error);
        window.location.href = 'projects.html';
        return null;
    }
}

/**
 * Get all scenes for current project from Supabase
 */
async function getProjectScenes(projectId) {
    try {
        const { data, error } = await supabase
            .from('scenes')
            .select('*')
            .eq('project_id', projectId)
            .order('story_order');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching scenes:', error);
        return [];
    }
}

/**
 * Save/update scene in Supabase
 */
async function saveScene(scene) {
    try {
        const { data, error } = await supabase
            .from('scenes')
            .upsert(scene)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving scene:', error);
        throw error;
    }
}

/**
 * Create multiple demo scenes for a new project
 */
async function createDemoScenes(projectId) {
    const demoScenes = [
        {
            project_id: projectId,
            scene_number: "1",
            description: "EXT. CITY STREET - DAY",
            story_order: 1,
            shooting_days: [3, 7]
        },
        {
            project_id: projectId,
            scene_number: "2",
            description: "INT. COFFEE SHOP - DAY",
            story_order: 2,
            shooting_days: [1]
        },
        {
            project_id: projectId,
            scene_number: "3",
            description: "EXT. PARK - DAY",
            story_order: 3,
            shooting_days: [2]
        }
    ];
    
    try {
        const { data, error } = await supabase
            .from('scenes')
            .insert(demoScenes)
            .select();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating demo scenes:', error);
        return [];
    }
}

/**
 * Delete a scene from Supabase
 */
async function deleteScene(sceneId) {
    try {
        const { error } = await supabase
            .from('scenes')
            .delete()
            .eq('id', sceneId);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting scene:', error);
        throw error;
    }
}

/**
 * Update story order for multiple scenes (internal - called by queue processor)
 */
async function updateSceneOrders(sceneUpdates) {
    console.log('[UPDATE] Updating scene orders:', sceneUpdates.length, 'scenes');
    
    // Step 1: Set all story_order to negative values to avoid unique constraint conflicts
    // Use random large negative offset to avoid conflicts with previous failed updates
    const tempOffset = -100000 - Math.floor(Math.random() * 100000);
    console.log('[UPDATE] Using temp offset:', tempOffset);
    
    for (let i = 0; i < sceneUpdates.length; i++) {
        const scene = sceneUpdates[i];
        const { error } = await supabase
            .from('scenes')
            .update({ story_order: tempOffset - i })
            .eq('id', scene.id);
        
        if (error) {
            console.error('[UPDATE] Error setting temp order for scene:', scene.id, error);
            throw error;
        }
    }
    
    // Step 2: Now set the actual story_order values
    for (const scene of sceneUpdates) {
        const { error } = await supabase
            .from('scenes')
            .update({ story_order: scene.story_order })
            .eq('id', scene.id);
        
        if (error) {
            console.error('[UPDATE] Error updating scene:', scene.id, error);
            throw error;
        }
    }
    
    console.log('[UPDATE] Successfully updated', sceneUpdates.length, 'scenes');
}

/**
 * Process the update queue one by one
 */
async function processUpdateQueue() {
    if (isProcessingQueue || updateQueue.length === 0) {
        return;
    }
    
    isProcessingQueue = true;
    
    while (updateQueue.length > 0) {
        // Take only the latest update (discard intermediate drags)
        const update = updateQueue[updateQueue.length - 1];
        updateQueue = []; // Clear queue - we're processing the latest state
        
        try {
            await updateSceneOrders(update.sceneUpdates);
        } catch (error) {
            console.error('[QUEUE] Failed to process update:', error);
            // Don't revert UI - user already moved on
        }
    }
    
    isProcessingQueue = false;
}

// Load scenes from current project
let currentProject = null;
let scenes = [];

// =================================================================
// SCENE CRUD OPERATIONS
// =================================================================

/**
 * Initialize AddSceneScreen component
 */
function initializeAddSceneScreen() {
    if (!currentProject || !currentProject.id) {
        console.error('Cannot initialize AddSceneScreen: currentProject not loaded');
        return;
    }
    
    addSceneScreen = new AddSceneScreen({
        projectId: currentProject.id,
        locations: [],
        times: currentProject.times || [],
        conditions: currentProject.conditions || [],
        continuityOptions: settingsService.getContinuityOptions(),
        
        onSceneAdded: async (newScene) => {
            // Add to local scenes array
            scenes.push(newScene);
            
            // Re-render timeline
            renderTimeline();
        }
    });
}

function initializeSceneEditScreen() {
    if (!currentProject || !currentProject.id) {
        console.error('Cannot initialize SceneEditScreen: currentProject not loaded');
        return;
    }
    
    sceneEditScreen = new SceneEditScreen({
        projectId: currentProject.id,
        locations: [],
        times: currentProject.times || [],
        conditions: currentProject.conditions || [],
        continuityOptions: settingsService.getContinuityOptions(),
        
        onSceneUpdated: async (sceneId) => {
            // Reload scenes from database to get latest changes
            scenes = await getProjectScenes(currentProject.id);
            
            // Re-render timeline
            renderTimeline();
        },
        
        onSceneDeleted: async (sceneId) => {
            // Remove from local array
            scenes = scenes.filter(s => s.id !== sceneId);
            
            // Re-render timeline
            renderTimeline();
        }
    });
}

/**
 * Delete a scene
 */
async function deleteSceneById(sceneId) {
    if (!confirm('Are you sure you want to delete this scene?')) {
        return;
    }
    
    try {
        await deleteScene(sceneId);
        
        // Remove from local array
        scenes = scenes.filter(s => s.id !== sceneId);
        
        // Re-render
        renderTimeline();
    } catch (error) {
        console.error('Error deleting scene:', error);
        alert('Failed to delete scene');
    }
}

// =================================================================
// STATE MANAGEMENT
// =================================================================

let currentMode = 'story'; // 'story' or 'shooting'
let draggedElement = null;
let draggedScene = null;

// =================================================================
// VIEW LOGIC
// =================================================================

/**
 * Switch between story order and shooting order modes.
 */
function switchMode(mode) {
    currentMode = mode;
    
    // Update button states
    const btnStory = document.getElementById('btnStoryOrder');
    const btnShooting = document.getElementById('btnShootingOrder');
    
    if (mode === 'story') {
        btnStory.classList.add('btn-active');
        btnShooting.classList.remove('btn-active');
        document.getElementById('timelineTitle').textContent = 'Story Timeline';
    } else {
        btnShooting.classList.add('btn-active');
        btnStory.classList.remove('btn-active');
        document.getElementById('timelineTitle').textContent = 'Shooting Schedule';
    }
    
    // Re-render timeline
    renderTimeline();
}

/**
 * Main render function - delegates to appropriate view renderer.
 */
function renderTimeline() {
    const container = document.getElementById('sceneContainer');
    
    if (currentMode === 'story') {
        renderStoryOrder(container);
    } else {
        renderShootingOrder(container);
    }
}

/**
 * Render scenes in story order (simple list, sorted by storyOrder).
 */
function renderStoryOrder(container) {
    // Sort by story order
    const sortedScenes = [...scenes].sort((a, b) => a.story_order - b.story_order);
    
    if (sortedScenes.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center w-full h-full text-base-content/50">
                <div class="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    <p class="text-xl">No scenes yet</p>
                    <p class="text-sm mt-2">Click the + button to add your first scene</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Build HTML with horizontal cards
    const html = sortedScenes.map(scene => `
        <div 
            class="card bg-base-100 shadow-md flex-shrink-0 w-80 min-h-[200px] scene-card cursor-move" 
            draggable="true"
            data-scene-id="${scene.id}"
        >
            <div class="card-body p-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <h3 class="card-title text-lg">
                                Scene ${scene.scene_number}
                            </h3>
                        </div>
                        <p class="text-sm text-base-content/70">${scene.description}</p>
                    </div>
                    <div class="flex flex-col gap-2 items-end">
                        <div class="badge badge-outline">Story #${scene.story_order}</div>
                        <button class="btn btn-ghost btn-xs btn-square delete-scene-btn" data-scene-id="${scene.id}" title="Delete scene">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="text-xs text-base-content/60 mt-2">
                    Shooting: Day ${scene.shooting_days.join(', Day ')}
                </div>
            </div>
        </div>
    `).join('');
    
    // Add the "add scene" placeholder at the end
    const addPlaceholder = `
        <div class="add-scene-placeholder" id="addScenePlaceholder">
            <div class="add-scene-placeholder__fill"></div>
            <div class="add-scene-placeholder__icon">+</div>
        </div>
    `;
    
    container.innerHTML = html + addPlaceholder;
    
    // Add click listener for placeholder
    const placeholder = container.querySelector('#addScenePlaceholder');
    if (placeholder) {
        placeholder.addEventListener('click', () => {
            addSceneScreen.open();
        });
    }
    
    // Initialize SortableJS for smooth drag-and-drop reordering
    const sceneCards = container.querySelectorAll('.scene-card');
    
    // Destroy previous instance if exists
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    
    console.log('[SORTABLE] Creating Sortable instance on container:', container);
    console.log('[SORTABLE] Container classes:', container?.className);
    console.log('[SORTABLE] Container scroll properties - scrollWidth:', container?.scrollWidth, 'clientWidth:', container?.clientWidth);
    
    // Create new Sortable instance with optimized performance settings
    sortableInstance = Sortable.create(container, {
        // Performance-optimized animation settings
        animation: 120,                    // Fast but smooth (was 200ms)
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Ease-out-quint (snappier)
        
        // Visual feedback classes
        ghostClass: 'sortable-ghost',      // Placeholder on original spot
        chosenClass: 'sortable-chosen',    // Item when selected
        dragClass: 'sortable-drag',        // Item while dragging
        
        // Direction
        direction: 'horizontal',           // Horizontal timeline
        
        // Swap mode disabled - use standard insert/shift behavior for instant response
        swap: false,                       // Don't use swap mode
        swapThreshold: 0.65,              // Default value (not used when swap is false)
        
        // AutoScroll configuration - balanced responsiveness
        scroll: true,                      // Enable autoscroll plugin
        forceAutoScrollFallback: true,     // Always use SortableJS autoscroll (disable browser native)
        scrollSensitivity: 140,            // px - triggers when moderately close to edge
        scrollSpeed: 43,                   // px/frame - fast but controlled scrolling
        bubbleScroll: true,                // Apply to parent elements too
        
        // Responsiveness optimizations
        delay: 0,                          // No delay - instant response
        delayOnTouchOnly: false,           // No delay on any device
        touchStartThreshold: 3,            // Pixels to move before drag starts (lower = more sensitive)
        
        // Performance optimizations
        forceFallback: false,              // Use native HTML5 DnD (faster)
        fallbackTolerance: 0,              // Instant drag start (no mouse movement threshold)
        removeCloneOnHide: true,           // Remove clone when hidden (better performance)
        
        // Only allow dragging scene cards (not placeholder)
        draggable: '.scene-card',
        
        // Events
        onStart: (evt) => {
            console.log('[SORTABLE] Drag started');
            // Keep dragged item fully visible
        },
        
        onEnd: async (evt) => {
            console.log('[SORTABLE] Drag ended - oldIndex:', evt.oldIndex, 'newIndex:', evt.newIndex);
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            // If position actually changed, update optimistically
            if (oldIndex !== newIndex) {
                // Update the scenes array immediately (optimistic update)
                const movedScene = scenes[oldIndex];
                scenes.splice(oldIndex, 1);
                scenes.splice(newIndex, 0, movedScene);
                
                // Renumber story_order for all scenes
                scenes.forEach((scene, index) => {
                    scene.story_order = index + 1;
                });
                
                // Update minimap immediately for responsive feel
                updateMinimap();
                
                // Queue database update (non-blocking)
                const updates = scenes.map(s => ({
                    id: s.id,
                    project_id: s.project_id,
                    scene_number: s.scene_number,
                    description: s.description,
                    story_order: s.story_order,
                    shooting_order: s.shooting_order,
                    location: s.location,
                    int_ext: s.int_ext,
                    time: s.time,
                    setting: s.setting,
                    condition: s.condition
                }));
                
                updateQueue.push({ sceneUpdates: updates });
                processUpdateQueue(); // Start processing (non-blocking)
            }
        }
    });
    
    // Add event listeners for delete buttons
    const deleteButtons = container.querySelectorAll('.delete-scene-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sceneId = btn.getAttribute('data-scene-id');
            deleteSceneById(sceneId);
        });
    });
    
    // Add click listeners to scene cards to open edit screen
    sceneCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking delete button
            if (e.target.closest('.delete-scene-btn')) return;
            
            const sceneId = card.getAttribute('data-scene-id');
            const scene = scenes.find(s => s.id === sceneId);
            if (scene && sceneEditScreen) {
                sceneEditScreen.open(scene);
            }
        });
    });
}

/**
 * Render scenes in shooting order.
 * 
 * Key logic: "explode" scenes by shooting days, then group by day.
 * A scene shot on days [3, 7] appears twice in the output.
 */
function renderShootingOrder(container) {
    // Step 1: Create (scene, day) pairs
    const sceneDayPairs = [];
    scenes.forEach(scene => {
        scene.shooting_days.forEach(day => {
            sceneDayPairs.push({ scene, day });
        });
    });
    
    // Step 2: Group by shooting day
    const groupedByDay = {};
    sceneDayPairs.forEach(pair => {
        if (!groupedByDay[pair.day]) {
            groupedByDay[pair.day] = [];
        }
        groupedByDay[pair.day].push(pair.scene);
    });
    
    // Step 3: Sort days numerically
    const sortedDays = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b);
    
    // Step 4: Build HTML with day sections in horizontal layout
    const html = sortedDays.map(day => {
        const scenesForDay = groupedByDay[day];
        
        // Sort scenes within each day by story order for consistency
        scenesForDay.sort((a, b) => a.story_order - b.story_order);
        
        const sceneCards = scenesForDay.map(scene => {
            // Visual indicator if scene spans multiple days
            const isMultiDay = scene.shooting_days.length > 1;
            const multiDayBadge = isMultiDay 
                ? `<span class="badge badge-warning badge-sm">Multi-day shoot</span>`
                : '';
            
            return `
                <div class="card bg-base-100 shadow-md flex-shrink-0 w-80 min-h-[200px]">
                    <div class="card-body p-4">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h3 class="card-title text-lg">
                                    Scene ${scene.scene_number}
                                </h3>
                                <p class="text-sm text-base-content/70">${scene.description}</p>
                            </div>
                            <div class="flex flex-col gap-1 items-end">
                                <div class="badge badge-outline">Story #${scene.story_order}</div>
                                ${multiDayBadge}
                            </div>
                        </div>
                        ${isMultiDay ? `
                            <div class="text-xs text-base-content/60 mt-2">
                                Full schedule: Day ${scene.shooting_days.join(', Day ')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Each day is a section with badge and horizontal cards
        return `
            <div class="flex-shrink-0">
                <div class="badge badge-lg badge-primary mb-3">Shooting Day ${day}</div>
                <div class="flex gap-3">
                    ${sceneCards}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// =================================================================
// MANUAL SCROLLING - Drag empty space to scroll
// =================================================================
// Note: SortableJS handles dragging scene cards
// This function handles dragging on EMPTY SPACE to scroll the timeline

function enableManualScroll() {
    const container = document.getElementById('sceneContainer');
    const viewport = document.querySelector('.flex-1.px-4.pt-20'); // Main viewport
    
    console.log('[MANUAL SCROLL] Initializing manual scroll');
    console.log('[MANUAL SCROLL] Container:', container);
    console.log('[MANUAL SCROLL] Container scrollWidth:', container?.scrollWidth, 'clientWidth:', container?.clientWidth);
    
    let isScrolling = false;
    let startX;
    let scrollLeft;
    
    // Handle mousedown on entire document to catch all empty space
    document.addEventListener('mousedown', (e) => {
        console.log('[MANUAL SCROLL] Mousedown event', e.target);
        
        // Check if clicking on excluded elements
        const excludedSelectors = [
            '.scene-card',
            '.add-scene-placeholder',
            '#timelineMinimap',
            '#minimapViewport',
            '#minimapScenes',
            '.btn',
            'button',
            '#topNavigation',
            'a',
            'input',
            'textarea',
            'select'
        ];
        
        const isExcluded = excludedSelectors.some(selector => e.target.closest(selector));
        
        if (isExcluded) {
            console.log('[MANUAL SCROLL] Clicked on excluded element - ignoring');
            return;
        }
        
        console.log('[MANUAL SCROLL] Starting manual scroll on empty space');
        isScrolling = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        document.body.style.cursor = 'grabbing';
        e.preventDefault(); // Prevent text selection
    });
    
    document.addEventListener('mouseleave', () => {
        if (isScrolling) {
            console.log('[MANUAL SCROLL] Mouse left document');
            isScrolling = false;
            document.body.style.cursor = 'default';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isScrolling) {
            console.log('[MANUAL SCROLL] Mouse up');
            isScrolling = false;
            document.body.style.cursor = 'default';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        container.scrollLeft = scrollLeft - walk;
        console.log('[MANUAL SCROLL] Scrolling - scrollLeft:', container.scrollLeft);
    });
    
    // Test regular scroll
    container.addEventListener('scroll', () => {
        console.log('[SCROLL EVENT] Container scrolled - scrollLeft:', container.scrollLeft);
    });
}

// =================================================================
// DRAG AND DROP - Now handled by SortableJS
// =================================================================
// SortableJS provides:
// - Smooth animations with intelligent swap zones
// - "Between items" dragging effect (invertSwap)
// - Touch device support
// - Auto-scroll during drag
// - Built-in visual feedback

// =================================================================
// TIMELINE MINIMAP (Overview)
// =================================================================

function updateMinimap() {
    const container = document.getElementById('sceneContainer');
    const minimapScenes = document.getElementById('minimapScenes');
    const minimapViewport = document.getElementById('minimapViewport');
    
    if (!container || !minimapScenes || !minimapViewport) return;
    
    // Render minimap as continuous bar (no individual scenes)
    minimapScenes.innerHTML = '<div class="minimap-continuous-bar"></div>';
    
    // Update viewport indicator
    const updateViewport = () => {
        // Skip update if user is currently resizing the viewport
        if (window.isResizingViewport) return;
        
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        // Calculate viewport position and size as percentage
        const viewportLeft = (scrollLeft / scrollWidth) * 100;
        const viewportWidth = (clientWidth / scrollWidth) * 100;
        
        minimapViewport.style.left = `${viewportLeft}%`;
        minimapViewport.style.width = `${viewportWidth}%`;
    };
    
    // Initial update - use setTimeout to ensure DOM is fully rendered
    setTimeout(updateViewport, 0);
    
    // Update on scroll
    container.addEventListener('scroll', updateViewport);
    
    // Also update when container size changes (but not during viewport resize)
    const resizeObserver = new ResizeObserver(() => {
        if (!window.isResizingViewport) {
            updateViewport();
        }
    });
    resizeObserver.observe(container);
    
    // Click minimap to jump to position
    const minimap = document.getElementById('timelineMinimap');
    minimap.addEventListener('click', (e) => {
        const rect = minimap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const targetScroll = percentage * container.scrollWidth - (container.clientWidth / 2);
        
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    });
    
    // Drag viewport indicator - optimized for smooth dragging
    let isDraggingViewport = false;
    let minimapRect = null;
    
    minimapViewport.addEventListener('mousedown', (e) => {
        isDraggingViewport = true;
        minimapRect = minimap.getBoundingClientRect(); // Cache rect
        e.stopPropagation();
        e.preventDefault();
        minimapViewport.style.cursor = 'grabbing';
        minimapViewport.style.transition = 'none'; // Disable transition during drag
        document.body.style.userSelect = 'none'; // Prevent text selection
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDraggingViewport || !minimapRect) return;
        
        e.preventDefault(); // Prevent any default behavior
        
        // Calculate position directly from mouse X position
        const relativeX = e.clientX - minimapRect.left;
        const percentage = Math.max(0, Math.min(1, relativeX / minimapRect.width));
        
        // Calculate target scroll position
        const maxScroll = container.scrollWidth - container.clientWidth;
        const targetScroll = percentage * maxScroll;
        
        // Direct scroll (no smooth behavior for instant response)
        container.scrollLeft = targetScroll;
    }, { passive: false });
    
    document.addEventListener('mouseup', () => {
        if (isDraggingViewport) {
            isDraggingViewport = false;
            minimapRect = null;
            minimapViewport.style.cursor = 'pointer';
            minimapViewport.style.transition = ''; // Re-enable transition
            document.body.style.userSelect = ''; // Re-enable text selection
        }
    });
}

// =================================================================
// INITIALIZATION
// =================================================================

// Render initial view on page load
document.addEventListener('DOMContentLoaded', async () => {
    currentProject = await getCurrentProject();
    
    if (!currentProject) {
        return; // Redirected to projects page
    }
    
    // Load scenes from database
    scenes = await getProjectScenes(currentProject.id);
    
    // If no scenes exist, create demo data
    if (scenes.length === 0) {
        scenes = await createDemoScenes(currentProject.id);
    }
    
    // Update tab navigation with project ID
    const navActors = document.getElementById('navActors');
    const navTimeline = document.getElementById('navTimeline');
    const navCalendar = document.getElementById('navCalendar');
    if (navActors) navActors.href = `actors.html?project=${currentProject.id}`;
    if (navTimeline) navTimeline.href = `timeline.html?project=${currentProject.id}`;
    if (navCalendar) navCalendar.href = `calendar.html?project=${currentProject.id}`;
    
    renderTimeline();
    enableManualScroll(); // Enable drag-to-scroll on empty space
    updateMinimap(); // Initialize minimap
    initZoomControls(); // Initialize zoom functionality
    
    // Initialize screen components
    initializeAddSceneScreen();
    initializeSceneEditScreen();
    
    // Setup event listeners
    document.getElementById('addSceneBtn').addEventListener('click', () => {
        addSceneScreen.open();
    });

    // Check if this is a new project (trigger onboarding after a short delay to ensure intro.js is loaded)
    setTimeout(() => {
        checkAndStartOnboarding();
    }, 500);
});

// =================================================================
// ZOOM CONTROLS
// =================================================================

function initZoomControls() {
    const zoomResetBtn = document.getElementById('zoomReset');
    const zoomLevelDisplay = document.getElementById('zoomLevel');
    const minimapViewport = document.getElementById('minimapViewport');
    const minimap = document.getElementById('timelineMinimap');
    const container = document.getElementById('sceneContainer');
    
    if (!zoomResetBtn || !zoomLevelDisplay || !minimapViewport || !minimap) return;
    
    let isResizing = false;
    let resizeSide = null;
    let startX = 0;
    let startZoom = 1.0;
    
    // Make isResizing accessible globally so updateMinimap can check it
    window.isResizingViewport = false;
    
    function updateZoom(newZoom, skipMinimapUpdate = false) {
        // Clamp zoom between 50% and 200%
        currentZoom = Math.max(0.5, Math.min(2.0, newZoom));
        
        // Update display
        zoomLevelDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
        
        // Scale gap between cards (base gap is 16px = 1rem)
        const baseGap = 16; // pixels
        const scaledGap = baseGap * currentZoom;
        container.style.gap = `${scaledGap}px`;
        
        // Scale card width (base width is 320px = w-80)
        const baseWidth = 320; // pixels
        const scaledWidth = baseWidth * currentZoom;
        
        // Apply actual width changes to cards (not transform scale)
        const sceneCards = document.querySelectorAll('.scene-card, .add-scene-placeholder');
        sceneCards.forEach(card => {
            card.style.width = `${scaledWidth}px`;
            card.style.minWidth = `${scaledWidth}px`;
            card.style.fontSize = `${currentZoom}rem`; // Scale font too
        });
        
        // Update minimap viewport ONLY if not currently resizing
        if (!skipMinimapUpdate) {
            setTimeout(() => updateMinimap(), 50);
        }
    }
    
    // Resize handles on viewport edges for zoom control
    let startViewportLeft = 0;
    let startViewportWidth = 0;
    let cachedMinimapRect = null;
    
    minimapViewport.addEventListener('mousedown', (e) => {
        const resizeHandle = e.target.closest('[data-resize]');
        if (resizeHandle) {
            // Set flag FIRST to prevent any viewport updates
            window.isResizingViewport = true;
            isResizing = true;
            resizeSide = resizeHandle.dataset.resize;
            startX = e.clientX;
            
            // Cache the minimap rect for consistent calculations
            cachedMinimapRect = minimap.getBoundingClientRect();
            
            // Store initial viewport position and width in pixels
            const viewportRect = minimapViewport.getBoundingClientRect();
            
            startViewportLeft = viewportRect.left - cachedMinimapRect.left; // pixels from minimap left
            startViewportWidth = viewportRect.width; // pixels
            
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing || !cachedMinimapRect) return;
        
        const deltaX = e.clientX - startX; // How far the cursor moved
        
        let newLeft, newWidth;
        
        if (resizeSide === 'left') {
            // Dragging LEFT edge: left edge follows cursor EXACTLY, right edge stays fixed
            newLeft = startViewportLeft + deltaX;
            newWidth = startViewportWidth - deltaX; // Width shrinks when moving right
            
            // Don't let left edge go past right edge or beyond minimap
            const minLeft = 0;
            const maxLeft = startViewportLeft + startViewportWidth - 20; // Keep min 20px width
            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newWidth = startViewportLeft + startViewportWidth - newLeft;
            
        } else if (resizeSide === 'right') {
            // Dragging RIGHT edge: right edge follows cursor EXACTLY, left edge stays fixed
            newLeft = startViewportLeft; // Left stays fixed
            newWidth = startViewportWidth + deltaX; // Width grows when moving right
            
            // Don't let right edge go beyond minimap or shrink too small
            const minWidth = 20;
            const maxWidth = cachedMinimapRect.width - newLeft;
            newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        }
        
        // Convert to percentages for CSS (use cached rect for consistency)
        const leftPercent = (newLeft / cachedMinimapRect.width) * 100;
        const widthPercent = (newWidth / cachedMinimapRect.width) * 100;
        
        // Update viewport position IMMEDIATELY (no transition)
        minimapViewport.style.left = `${leftPercent}%`;
        minimapViewport.style.width = `${widthPercent}%`;
        
        // Calculate and apply zoom
        const newZoom = 50 / widthPercent; // Inverse relationship
        updateZoom(newZoom, true); // Skip minimap update during resizing
        
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            // Clear cached rect
            cachedMinimapRect = null;
            // Clear flag after a short delay to prevent immediate viewport snap
            setTimeout(() => {
                window.isResizingViewport = false;
            }, 100);
        }
        isResizing = false;
        resizeSide = null;
    });
    
    zoomResetBtn.addEventListener('click', () => {
        updateZoom(1.0);
    });
    
    // Initial update
    updateZoom(currentZoom);
}

// =================================================================
// ONBOARDING
// =================================================================

/**
 * Check if onboarding should start and launch it
 */
function checkAndStartOnboarding() {
    console.log('Checking onboarding...', {
        introJsDefined: typeof introJs !== 'undefined',
        hasSeenOnboarding: localStorage.getItem('continuity_onboarding_completed'),
        forceOnboarding: localStorage.getItem('continuity_force_onboarding')
    });
    
    // Check if introJs is available
    if (typeof introJs === 'undefined') {
        console.warn('intro.js not loaded yet, skipping onboarding');
        return;
    }
    
    // Check if we should force onboarding (user checked the box)
    const forceOnboarding = localStorage.getItem('continuity_force_onboarding');
    if (forceOnboarding === 'true') {
        localStorage.removeItem('continuity_force_onboarding');
        console.log('Force starting onboarding (user requested)...');
        startOnboarding();
        return;
    }
    
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('continuity_onboarding_completed');
    
    // Only show for new users
    if (!hasSeenOnboarding) {
        console.log('Starting onboarding...');
        startOnboarding();
    } else {
        console.log('Onboarding already completed:', hasSeenOnboarding);
    }
}

/**
 * Start the onboarding wizard
 */
function startOnboarding() {
    const intro = introJs();
    
    intro.setOptions({
        steps: [
            {
                title: '👋 Welcome to Your Timeline',
                intro: `
                    <div class="text-left">
                        <p class="mb-3">This is where your story comes to life. Let me show you around real quick.</p>
                        <p class="text-sm opacity-70">Don't worry, this'll take less than a minute.</p>
                    </div>
                `,
                position: 'floating'
            },
            {
                element: '#timelineTitle',
                title: '📖 Story vs Shooting Order',
                intro: `
                    <div class="text-left">
                        <p class="mb-2">You can view your scenes in two ways:</p>
                        <ul class="list-disc ml-4 mb-2">
                            <li><strong>Story Order</strong> - How the story unfolds</li>
                            <li><strong>Shooting Order</strong> - How you'll actually film</li>
                        </ul>
                        <p class="text-sm opacity-70">Switch between them with the buttons above.</p>
                    </div>
                `,
                position: 'bottom'
            },
            {
                element: '#sceneContainer',
                title: '🎬 Your Scenes',
                intro: `
                    <div class="text-left">
                        <p class="mb-2">Each scene is a card you can click to edit. You'll track:</p>
                        <ul class="list-disc ml-4 mb-2">
                            <li>Scene number & description</li>
                            <li>Location (INT/EXT)</li>
                            <li>Time of day</li>
                            <li>Which actors appear</li>
                        </ul>
                        <p class="text-sm opacity-70">Drag scenes to reorder them. Easy.</p>
                    </div>
                `,
                position: 'top'
            },
            {
                element: '#addSceneBtn',
                title: '➕ Add Scenes',
                intro: `
                    <div class="text-left">
                        <p class="mb-2">Click here to add a new scene. That's pretty much it.</p>
                        <p class="text-sm opacity-70">See? Told you I was lazy. You got this.</p>
                    </div>
                `,
                position: 'top'
            },
            {
                element: '#topNavigation',
                title: '🧭 Navigation',
                intro: `
                    <div class="text-left">
                        <p class="mb-2">Switch between:</p>
                        <ul class="list-disc ml-4 mb-3">
                            <li><strong>Actors</strong> - Manage your cast & continuity</li>
                            <li><strong>Timeline</strong> - Where you are now</li>
                            <li><strong>Calendar</strong> - Plan your shooting schedule</li>
                        </ul>
                        <p class="text-sm opacity-70">The home button takes you back to projects.</p>
                    </div>
                `,
                position: 'left'
            },
            {
                title: '🎉 You\'re All Set!',
                intro: `
                    <div class="text-left">
                        <p class="mb-3">That's the grand tour. Now go make something cool.</p>
                        <p class="mb-3">Remember: this is your creative playground. Try stuff. Break stuff. It's just software.</p>
                        <p class="text-sm opacity-70 mb-3">Need help? Most things are pretty self-explanatory. Click around.</p>
                        <p class="text-right italic">— Your Lazy Wizard ✨</p>
                    </div>
                `,
                position: 'floating'
            }
        ],
        showProgress: true,
        showBullets: true,
        exitOnOverlayClick: false,
        disableInteraction: false,
        doneLabel: 'Let\'s go! 🚀',
        nextLabel: 'Next →',
        prevLabel: '← Back',
    });

    intro.oncomplete(() => {
        // Mark onboarding as complete
        localStorage.setItem('continuity_onboarding_completed', 'true');
        localStorage.setItem('continuity_onboarding_finished_at', Date.now().toString());
    });

    intro.onexit(() => {
        // User skipped - mark as seen so we don't annoy them
        localStorage.setItem('continuity_onboarding_completed', 'skipped');
    });

    intro.start();}
