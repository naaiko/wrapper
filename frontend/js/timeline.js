// =================================================================
// IMPORTS
// =================================================================

import { AddSceneScreen } from './screens/addSceneScreen.js';
import { SceneEditScreen } from './screens/sceneEditScreen.js';
import settingsService from './services/settingsService.js';

// =================================================================
// DATA MODEL
// =================================================================

const CURRENT_PROJECT_KEY = 'continuityManager_currentProject';
let addSceneScreen = null;
let sceneEditScreen = null;

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
 * Update story order for multiple scenes
 */
async function updateSceneOrders(sceneUpdates) {
    try {
        const promises = sceneUpdates.map(update => 
            supabase
                .from('scenes')
                .update({ story_order: update.story_order })
                .eq('id', update.id)
        );
        
        await Promise.all(promises);
    } catch (error) {
        console.error('Error updating scene orders:', error);
        throw error;
    }
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
    
    // Add event listeners for drag and drop
    const sceneCards = container.querySelectorAll('.scene-card');
    sceneCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);
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
// DRAG-TO-SCROLL FUNCTIONALITY (iPad-like smooth scrolling)
// =================================================================

/**
 * Enable ultra-smooth drag-to-scroll with momentum, like iOS Safari.
 */
function enableDragScroll() {
    const container = document.getElementById('sceneContainer');
    let isDown = false;
    let startX;
    let scrollLeft;
    let velocity = 0;
    let lastX = 0;
    let lastTime = Date.now();
    let animationId = null;
    
    // Momentum scrolling after release (iOS-like physics)
    function applyMomentum() {
        if (Math.abs(velocity) > 0.1) {
            container.scrollLeft -= velocity;
            velocity *= 0.92; // Smoother friction (iOS uses ~0.92)
            animationId = requestAnimationFrame(applyMomentum);
        } else {
            velocity = 0;
        }
    }
    
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.style.cursor = 'grabbing';
        container.style.userSelect = 'none';
        startX = e.pageX;
        scrollLeft = container.scrollLeft;
        lastX = e.pageX;
        lastTime = Date.now();
        velocity = 0;
        
        // Cancel any ongoing momentum
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    });
    
    container.addEventListener('mouseleave', () => {
        if (isDown) {
            isDown = false;
            container.style.cursor = 'grab';
            applyMomentum();
        }
    });
    
    container.addEventListener('mouseup', () => {
        if (isDown) {
            isDown = false;
            container.style.cursor = 'grab';
            applyMomentum();
        }
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        // Direct 1:1 pixel-perfect scrolling
        const x = e.pageX;
        const deltaX = x - lastX;
        container.scrollLeft -= deltaX;
        
        // Calculate velocity for momentum (with time-based smoothing)
        const now = Date.now();
        const dt = Math.max(now - lastTime, 1);
        velocity = deltaX / dt * 16; // Normalize to 60fps
        
        lastX = x;
        lastTime = now;
    });
    
    // Set initial cursor
    container.style.cursor = 'grab';
}

// =================================================================
// DRAG AND DROP FOR REORDERING
// =================================================================

/**
 * Handle drag start
 */
function handleDragStart(event) {
    if (currentMode !== 'story') {
        event.preventDefault();
        return;
    }
    
    draggedElement = event.currentTarget;
    const sceneId = draggedElement.getAttribute('data-scene-id');
    draggedScene = scenes.find(s => s.id === sceneId);
    
    event.currentTarget.style.opacity = '0.4';
    event.dataTransfer.effectAllowed = 'move';
}

/**
 * Handle drag over
 */
function handleDragOver(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    
    event.dataTransfer.dropEffect = 'move';
    
    const targetElement = event.currentTarget;
    if (targetElement !== draggedElement) {
        targetElement.style.borderLeft = '3px solid #ff6ec7';
    }
    
    return false;
}

/**
 * Handle drop
 */
async function handleDrop(event) {
    if (event.stopPropagation) {
        event.stopPropagation();
    }
    
    const targetElement = event.currentTarget;
    targetElement.style.borderLeft = 'none';
    
    if (draggedElement !== targetElement) {
        const targetSceneId = targetElement.getAttribute('data-scene-id');
        const targetScene = scenes.find(s => s.id === targetSceneId);
        
        if (draggedScene && targetScene) {
            // Reorder the scenes array
            const draggedOrder = draggedScene.story_order;
            const targetOrder = targetScene.story_order;
            
            // Update orders in local array
            if (draggedOrder < targetOrder) {
                // Moving forward
                scenes.forEach(scene => {
                    if (scene.story_order > draggedOrder && scene.story_order <= targetOrder) {
                        scene.story_order--;
                    }
                });
                draggedScene.story_order = targetOrder;
            } else {
                // Moving backward
                scenes.forEach(scene => {
                    if (scene.story_order >= targetOrder && scene.story_order < draggedOrder) {
                        scene.story_order++;
                    }
                });
                draggedScene.story_order = targetOrder;
            }
            
            // Save to database
            try {
                const updates = scenes.map(s => ({ id: s.id, story_order: s.story_order }));
                await updateSceneOrders(updates);
                
                // Re-render
                renderTimeline();
            } catch (error) {
                console.error('Error updating scene order:', error);
                alert('Failed to update scene order');
            }
        }
    }
    
    return false;
}

/**
 * Handle drag end
 */
function handleDragEnd(event) {
    event.currentTarget.style.opacity = '1';
    
    // Remove all border highlights
    document.querySelectorAll('.scene-card').forEach(card => {
        card.style.borderLeft = 'none';
    });
    
    draggedElement = null;
    draggedScene = null;
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
    enableDragScroll();
    
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