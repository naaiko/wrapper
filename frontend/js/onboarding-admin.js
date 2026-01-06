import { supabaseClient } from './api/supabaseClient.js';

let currentPage = 'timeline';
let steps = [];
let hasUnsavedChanges = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    setupPageTabs();
    setupAddStepButton();
    setupStepForm();
    setupSaveButton();
    await loadSteps();
    
    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

// =================================================================
// PAGE TABS
// =================================================================

function setupPageTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            if (hasUnsavedChanges) {
                if (!confirm('You have unsaved changes. Switch page anyway?')) {
                    return;
                }
            }
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            
            // Load steps for this page
            currentPage = tab.dataset.page;
            await loadSteps();
        });
    });
}

// =================================================================
// LOAD STEPS
// =================================================================

async function loadSteps() {
    try {
        const { data, error } = await supabaseClient.db
            .from('intro_steps')
            .select('*')
            .eq('page', currentPage)
            .order('step_order', { ascending: true });
        
        if (error) throw error;
        
        steps = data || [];
        renderSteps();
        hasUnsavedChanges = false;
        updateSaveButton();
    } catch (error) {
        console.error('Error loading steps:', error);
        alert('Failed to load steps: ' + error.message);
    }
}

// =================================================================
// RENDER STEPS
// =================================================================

function renderSteps() {
    const container = document.getElementById('stepsList');
    
    if (steps.length === 0) {
        container.innerHTML = `
            <div class="alert">
                <span>No steps configured for this page yet. Click "Add Step" to get started.</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = steps.map((step, index) => `
        <div class="card bg-base-100 shadow-md ${!step.is_visible ? 'opacity-50' : ''}" data-step-id="${step.id}">
            <div class="card-body">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="badge badge-primary">#${step.step_order}</span>
                            ${!step.is_visible ? '<span class="badge badge-ghost">Hidden</span>' : ''}
                            ${step.element ? `<span class="badge badge-outline">${step.element}</span>` : '<span class="badge badge-outline">Floating</span>'}
                            <span class="badge badge-outline">${step.position}</span>
                        </div>
                        <h3 class="card-title text-lg">${step.title}</h3>
                        <div class="text-sm mt-2 text-base-content/70">
                            ${step.intro.substring(0, 150)}${step.intro.length > 150 ? '...' : ''}
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button class="btn btn-sm btn-ghost" onclick="moveStepUp(${index})" ${index === 0 ? 'disabled' : ''}>
                            ⬆️
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="moveStepDown(${index})" ${index === steps.length - 1 ? 'disabled' : ''}>
                            ⬇️
                        </button>
                    </div>
                </div>
                <div class="card-actions justify-end mt-4">
                    <button class="btn btn-sm btn-ghost" onclick="toggleStepVisibility('${step.id}')">
                        ${step.is_visible ? '👁️ Hide' : '👁️‍🗨️ Show'}
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editStep('${step.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-error" onclick="deleteStep('${step.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// =================================================================
// ADD/EDIT STEP
// =================================================================

function setupAddStepButton() {
    document.getElementById('addStepBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Add Step';
        document.getElementById('stepForm').reset();
        document.getElementById('stepId').value = '';
        document.getElementById('stepOrder').value = steps.length + 1;
        document.getElementById('stepVisible').checked = true;
        stepModal.showModal();
    });
}

window.editStep = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Step';
    document.getElementById('stepId').value = step.id;
    document.getElementById('stepOrder').value = step.step_order;
    document.getElementById('stepTitle').value = step.title;
    document.getElementById('stepIntro').value = step.intro;
    document.getElementById('stepElement').value = step.element || '';
    document.getElementById('stepPosition').value = step.position;
    document.getElementById('stepVisible').checked = step.is_visible;
    
    stepModal.showModal();
};

function setupStepForm() {
    document.getElementById('stepForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const stepId = document.getElementById('stepId').value;
        const stepData = {
            page: currentPage,
            step_order: parseInt(document.getElementById('stepOrder').value),
            title: document.getElementById('stepTitle').value,
            intro: document.getElementById('stepIntro').value,
            element: document.getElementById('stepElement').value || null,
            position: document.getElementById('stepPosition').value,
            is_visible: document.getElementById('stepVisible').checked
        };
        
        try {
            if (stepId) {
                // Update existing step
                const index = steps.findIndex(s => s.id === stepId);
                if (index >= 0) {
                    steps[index] = { ...steps[index], ...stepData };
                }
            } else {
                // Add new step
                steps.push({ id: crypto.randomUUID(), ...stepData, created_at: new Date().toISOString() });
            }
            
            // Reorder steps
            steps.sort((a, b) => a.step_order - b.step_order);
            
            renderSteps();
            hasUnsavedChanges = true;
            updateSaveButton();
            stepModal.close();
        } catch (error) {
            console.error('Error saving step:', error);
            alert('Failed to save step: ' + error.message);
        }
    });
}

// =================================================================
// STEP ACTIONS
// =================================================================

window.toggleStepVisibility = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
        step.is_visible = !step.is_visible;
        renderSteps();
        hasUnsavedChanges = true;
        updateSaveButton();
    }
};

window.moveStepUp = (index) => {
    if (index === 0) return;
    
    [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
    steps[index].step_order = index + 1;
    steps[index - 1].step_order = index;
    
    renderSteps();
    hasUnsavedChanges = true;
    updateSaveButton();
};

window.moveStepDown = (index) => {
    if (index === steps.length - 1) return;
    
    [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
    steps[index].step_order = index + 1;
    steps[index + 1].step_order = index + 2;
    
    renderSteps();
    hasUnsavedChanges = true;
    updateSaveButton();
};

window.deleteStep = async (stepId) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    
    steps = steps.filter(s => s.id !== stepId);
    
    // Reorder remaining steps
    steps.forEach((step, index) => {
        step.step_order = index + 1;
    });
    
    renderSteps();
    hasUnsavedChanges = true;
    updateSaveButton();
};

// =================================================================
// SAVE ALL
// =================================================================

function setupSaveButton() {
    document.getElementById('saveAllBtn').addEventListener('click', saveAll);
}

function updateSaveButton() {
    const btn = document.getElementById('saveAllBtn');
    if (hasUnsavedChanges) {
        btn.classList.add('btn-success');
        btn.classList.remove('btn-disabled');
    } else {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-disabled');
    }
}

async function saveAll() {
    if (!hasUnsavedChanges) return;
    
    try {
        // Delete all existing steps for this page
        const { error: deleteError } = await supabaseClient.db
            .from('intro_steps')
            .delete()
            .eq('page', currentPage);
        
        if (deleteError) throw deleteError;
        
        // Insert all steps (create new UUIDs)
        const stepsToInsert = steps.map(({ id, created_at, updated_at, ...step }) => ({
            ...step,
            page: currentPage
        }));
        
        const { error: insertError } = await supabaseClient.db
            .from('intro_steps')
            .insert(stepsToInsert);
        
        if (insertError) throw insertError;
        
        // Reload to get fresh IDs
        await loadSteps();
        
        alert('✅ All changes saved successfully!');
    } catch (error) {
        console.error('Error saving steps:', error);
        alert('Failed to save: ' + error.message);
    }
}
