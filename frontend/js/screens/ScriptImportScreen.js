// =================================================================
// SCRIPT IMPORT SCREEN - Script Upload & Preview UI
// =================================================================
// Handles file upload, parsing, preview grid, and scene editing
// Uses EditScreen pattern and DaisyUI components

import { EditScreen } from '../components/editScreen.js';
import { ScriptImportService } from '../services/scriptImportService.js';

export class ScriptImportScreen {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.onComplete = options.onComplete || null;
        
        // State
        this.importResult = null;
        this.selectedSceneIds = new Set();
        this.editingSceneIndex = null;
        
        // Create edit screen
        this.editScreen = new EditScreen({
            id: 'scriptImportScreen',
            title: 'Import Script',
            mode: 'modal',
            renderFormContent: () => this.renderUploadForm(),
            renderContextContent: () => '',
            onAfterRender: () => this.initializeUpload()
        }).init();
        
        // Add primary action (initially disabled)
        this.addPrimaryAction();
    }
    
    addPrimaryAction() {
        this.editScreen.addPrimaryAction(
            'Parse Script',
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>`,
            'primary',
            () => this.handleParse(),
            'btnParseScript'
        );
        
        // Disable until file is loaded
        const btn = document.getElementById('btnParseScript');
        if (btn) {
            btn.disabled = true;
        }
    }
    
    /**
     * Render upload form (step 1)
     */
    renderUploadForm() {
        return `
            <div class="px-8 py-6 space-y-6">
                <!-- Demo Scripts Section -->
                <div class="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <h3 class="font-bold">Try a demo script</h3>
                        <div class="text-xs">Load a sample script to test the import feature</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <button type="button" class="btn btn-outline btn-sm" data-demo="brick-and-steel.fountain">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Brick & Steel
                        <div class="badge badge-primary badge-xs">Fountain</div>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-demo="big-fish.fountain">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Big Fish
                        <div class="badge badge-accent badge-xs">Industry Size</div>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-demo="the-short-film.fountain">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        The Short Film
                        <div class="badge badge-primary badge-xs">Fountain</div>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-demo="the-meeting.txt">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        The Meeting
                        <div class="badge badge-secondary badge-xs">Plain Text</div>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-demo="messy-script.txt">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Messy Script
                        <div class="badge badge-warning badge-xs">Edge Case</div>
                    </button>
                </div>
                
                <div class="divider">OR</div>
                
                <!-- File Drop Zone -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Upload Your Script</span>
                    </label>
                    
                    <div id="dropZone" class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-base-200/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p class="text-sm font-medium mb-2">Drop .fountain or .txt file here</p>
                        <p class="text-xs text-base-content/60">or click to browse</p>
                        <input type="file" id="fileInput" accept=".fountain,.txt,.text" class="hidden" />
                    </div>
                    
                    <!-- File Info -->
                    <div id="fileInfo" class="mt-2 text-sm text-base-content/60 hidden">
                        <span id="fileName"></span> (<span id="fileSize"></span>)
                    </div>
                </div>
                
                <!-- Format Selection -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Format</span>
                    </label>
                    <div class="flex gap-4">
                        <label class="label cursor-pointer gap-2">
                            <input type="radio" name="format" value="auto" class="radio radio-sm radio-primary" checked />
                            <span class="label-text">Auto-detect</span>
                        </label>
                        <label class="label cursor-pointer gap-2">
                            <input type="radio" name="format" value="fountain" class="radio radio-sm radio-primary" />
                            <span class="label-text">Fountain</span>
                        </label>
                        <label class="label cursor-pointer gap-2">
                            <input type="radio" name="format" value="plaintext" class="radio radio-sm radio-primary" />
                            <span class="label-text">Plain Text</span>
                        </label>
                    </div>
                </div>
                
                <!-- Preview Area (hidden until parsed) -->
                <div id="previewArea" class="hidden">
                    <!-- Will be filled with preview content -->
                </div>
            </div>
        `;
    }
    
    /**
     * Initialize upload handlers
     */
    initializeUpload() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        if (!dropZone || !fileInput) return;
        
        // Click to browse
        dropZone.addEventListener('click', () => fileInput.click());
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelected(file);
            }
        });
        
        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-primary', 'bg-base-200/50');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-primary', 'bg-base-200/50');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-primary', 'bg-base-200/50');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileSelected(file);
            }
        });
        
        // Demo script buttons
        const demoButtons = document.querySelectorAll('[data-demo]');
        demoButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const scriptName = btn.getAttribute('data-demo');
                await this.loadDemoScript(scriptName);
            });
        });
    }
    
    /**
     * Load demo script from docs/resources/scripts/
     */
    async loadDemoScript(scriptName) {
        try {
            // Determine folder based on extension
            const folder = scriptName.endsWith('.fountain') ? 'fountain' : 'plain-text';
            // Resolve asset base (allows override when hosted under subpaths or CDN)
            const assetBase = window.__ASSET_BASE_URL
                || document.querySelector('meta[name="assets-base-url"]')?.getAttribute('content')
                || (() => {
                    const { origin, pathname } = window.location;
                    const parts = pathname.split('/').filter(Boolean);
                    const frontendIdx = parts.indexOf('frontend');
                    if (frontendIdx !== -1) {
                        const baseParts = parts.slice(0, frontendIdx);
                        const basePath = '/' + (baseParts.length ? baseParts.join('/') + '/' : '');
                        return origin + basePath;
                    }
                    return origin + '/';
                })();

            const baseWithSlash = assetBase.endsWith('/') ? assetBase : `${assetBase}/`;
            const scriptPath = `${baseWithSlash}docs/resources/scripts/${folder}/${scriptName}`;

            console.log('[SCRIPT IMPORT] Loading demo script', { scriptName, scriptPath });
            
            const response = await fetch(scriptPath, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Failed to load demo script: ${response.statusText}`);
            }
            
            const content = await response.text();

            // Guard: if we fetched an HTML page, the base/path is wrong.
            const trimmed = content.trim();
            if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
                throw new Error('Got HTML instead of a script file (check assets base URL)');
            }
            
            // Create File object from content with correct size
            const blob = new Blob([content], { type: 'text/plain' });
            const file = new File([blob], scriptName, { 
                type: 'text/plain',
                lastModified: Date.now()
            });
            
            // Use existing file handling
            this.handleFileSelected(file);
            
        } catch (error) {
            console.error('Error loading demo script:', error);
            this.showError(`Demo script kon niet geladen worden: ${scriptName}`);
        }
    }
    
    /**
     * Handle file selection
     */
    async handleFileSelected(file) {
        // Update UI
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            fileInfo.classList.remove('hidden');
        }
        
        // Read file
        try {
            const text = await this.readFile(file);
            this.scriptText = text;
            
            // Enable parse button
            const btn = document.getElementById('btnParseScript');
            if (btn) {
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }
    
    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    /**
     * Handle parse button click
     */
    async handleParse() {
        if (!this.scriptText) {
            console.warn('[SCRIPT IMPORT] No script text available');
            return;
        }
        
        console.log('[SCRIPT IMPORT] Starting parse with text length:', this.scriptText.length);
        
        // Get selected format
        const formatInput = document.querySelector('input[name="format"]:checked');
        const format = formatInput ? formatInput.value : 'auto';
        console.log('[SCRIPT IMPORT] Selected format:', format);
        
        // Show loading overlay
        this.showLoadingOverlay('Parsing script...');
        
        // Disable button
        const btn = document.getElementById('btnParseScript');
        if (btn) {
            btn.disabled = true;
        }
        
        try {
            // Parse script
            this.importResult = await ScriptImportService.parseScript(this.scriptText, format);
            console.log('[SCRIPT IMPORT] Parse successful:', this.importResult);
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            // Switch to preview mode
            this.showPreview();
            
        } catch (error) {
            console.error('[SCRIPT IMPORT] Parse error:', error);
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            // Show error message
            this.showError(`Failed to parse script: ${error.message}`);
            
            // Re-enable button
            if (btn) {
                btn.disabled = false;
            }
        }
    }
    
    /**
     * Show preview grid (step 2)
     */
    showPreview() {
        // Change to fullscreen mode
        this.editScreen.mode = 'fullscreen';
        
        // Update title
        this.editScreen.setTitle('Import Preview');
        
        // Update content manually
        if (this.editScreen.formZone) {
            this.editScreen.formZone.innerHTML = this.renderPreviewGrid();
        }
        if (this.editScreen.contextZone) {
            this.editScreen.contextZone.innerHTML = this.renderPreviewContext();
        }
        
        // Clear existing actions
        const primaryZone = this.editScreen.container.querySelector('.edit-screen__actions-primary');
        const secondaryZone = this.editScreen.container.querySelector('.edit-screen__actions-secondary');
        if (primaryZone) primaryZone.innerHTML = '';
        if (secondaryZone) secondaryZone.innerHTML = '';
        
        // Add new actions
        this.editScreen.addSecondaryAction(
            'Cancel',
            '',
            () => this.close()
        );
        
        const count = this.getEnabledCount();
        this.editScreen.addPrimaryAction(
            `Import ${count} Scenes`,
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>`,
            'primary',
            () => this.handleImport(),
            'btnImportScenes'
        );
        
        // Initialize all scenes as selected
        this.selectedSceneIds = new Set(this.importResult.scenes.map((_, i) => i));
        
        // Initialize event handlers
        setTimeout(() => this.initializePreviewHandlers(), 100);
    }
    
    /**
     * Render preview grid
     */
    renderPreviewGrid() {
        const summary = ScriptImportService.getImportSummary(this.importResult);
        
        return `
            <div class="px-8 py-6 space-y-6">
                <!-- Summary Stats -->
                <div class="stats stats-horizontal shadow w-full">
                    <div class="stat">
                        <div class="stat-title">Total Scenes</div>
                        <div class="stat-value text-2xl">${summary.totalScenes}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Characters</div>
                        <div class="stat-value text-2xl">${summary.totalCharacters}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Warnings</div>
                        <div class="stat-value text-2xl ${summary.scenesWithWarnings > 0 ? 'text-warning' : 'text-success'}">
                            ${summary.scenesWithWarnings}
                        </div>
                    </div>
                </div>
                
                <!-- Actions Bar -->
                <div class="flex items-center gap-2">
                    <button id="btnSelectAll" class="btn btn-sm btn-ghost">
                        Select All
                    </button>
                    <button id="btnDeselectAll" class="btn btn-sm btn-ghost">
                        Deselect All
                    </button>
                    <div class="divider divider-horizontal mx-2"></div>
                    <span class="text-sm text-base-content/60">
                        <span id="selectedCount">${summary.totalScenes}</span> selected
                    </span>
                </div>
                
                <!-- Scene Grid -->
                <div id="sceneGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    ${this.importResult.scenes.map((scene, index) => this.renderSceneCard(scene, index)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render single scene card
     */
    renderSceneCard(scene, index) {
        const isSelected = this.selectedSceneIds.has(index);
        const hasWarnings = scene.sourceMeta.warnings.length > 0;
        const lowConfidence = scene.sourceMeta.confidence < 0.7;
        
        return `
            <div class="card bg-base-100 shadow-md compact relative hover:shadow-lg transition-shadow ${!scene.isEnabled ? 'opacity-50' : ''}" data-scene-index="${index}">
                <!-- Checkbox -->
                <label class="absolute top-2 right-2 z-10">
                    <input type="checkbox" class="checkbox checkbox-sm checkbox-primary scene-checkbox" 
                           data-index="${index}" ${scene.isEnabled ? 'checked' : ''} />
                </label>
                
                <!-- Card Body -->
                <div class="card-body cursor-pointer scene-card-body">
                    <!-- Scene Number Badge -->
                    <div class="flex items-start gap-2 mb-2">
                        <div class="badge badge-sm ${lowConfidence ? 'badge-warning' : 'badge-primary'}">
                            Scene ${scene.scene_number}
                        </div>
                        ${hasWarnings ? '<div class="badge badge-sm badge-warning">⚠</div>' : ''}
                    </div>
                    
                    <!-- Scene Heading -->
                    <h3 class="card-title text-sm line-clamp-2">
                        ${scene.getDisplayTitle()}
                    </h3>
                    
                    <!-- Meta Info -->
                    <div class="text-xs opacity-60 space-y-1">
                        ${scene.characters.length > 0 ? `<div>Characters: ${scene.characters.slice(0, 3).join(', ')}${scene.characters.length > 3 ? '...' : ''}</div>` : ''}
                        ${lowConfidence ? `<div class="text-warning">Confidence: ${Math.round(scene.sourceMeta.confidence * 100)}%</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render preview context panel
     */
    renderPreviewContext() {
        const summary = ScriptImportService.getImportSummary(this.importResult);
        
        return `
            <div class="edit-screen__context-preview">
                <div class="text-sm font-semibold mb-3">Import Summary</div>
                
                ${summary.title ? `<div class="mb-4">
                    <div class="text-xs opacity-60">Title</div>
                    <div class="font-medium">${summary.title}</div>
                </div>` : ''}
                
                ${summary.author ? `<div class="mb-4">
                    <div class="text-xs opacity-60">Author</div>
                    <div>${summary.author}</div>
                </div>` : ''}
                
                ${summary.warnings.length > 0 ? `<div class="alert alert-warning alert-sm mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div class="text-xs">
                        ${summary.warnings.map(w => `<div>${w}</div>`).join('')}
                    </div>
                </div>` : ''}
                
                ${summary.characters.length > 0 ? `<div class="mb-4">
                    <div class="text-xs opacity-60 mb-2">Detected Characters (${summary.characters.length})</div>
                    <div class="flex flex-wrap gap-1">
                        ${summary.characters.slice(0, 10).map(char => `
                            <div class="badge badge-sm">${char}</div>
                        `).join('')}
                        ${summary.characters.length > 10 ? `<div class="badge badge-sm badge-ghost">+${summary.characters.length - 10} more</div>` : ''}
                    </div>
                </div>` : ''}
            </div>
        `;
    }
    
    /**
     * Initialize preview event handlers
     */
    initializePreviewHandlers() {
        // Checkboxes
        document.querySelectorAll('.scene-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.handleSceneToggle(index, e.target.checked);
            });
        });
        
        // Scene cards (click to edit)
        document.querySelectorAll('.scene-card-body').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking checkbox
                if (e.target.classList.contains('checkbox')) return;
                
                const index = parseInt(card.closest('[data-scene-index]').dataset.sceneIndex);
                this.handleSceneEdit(index);
            });
        });
        
        // Select/Deselect all
        document.getElementById('btnSelectAll')?.addEventListener('click', () => {
            this.selectAll(true);
        });
        
        document.getElementById('btnDeselectAll')?.addEventListener('click', () => {
            this.selectAll(false);
        });
    }
    
    /**
     * Handle scene checkbox toggle
     */
    handleSceneToggle(index, enabled) {
        this.importResult.scenes[index].isEnabled = enabled;
        
        if (enabled) {
            this.selectedSceneIds.add(index);
        } else {
            this.selectedSceneIds.delete(index);
        }
        
        this.updateSelectedCount();
        this.updateImportButton();
    }
    
    /**
     * Select/deselect all scenes
     */
    selectAll(selected) {
        this.importResult.scenes.forEach((scene, index) => {
            scene.isEnabled = selected;
            if (selected) {
                this.selectedSceneIds.add(index);
            } else {
                this.selectedSceneIds.delete(index);
            }
        });
        
        // Update checkboxes
        document.querySelectorAll('.scene-checkbox').forEach(checkbox => {
            checkbox.checked = selected;
        });
        
        this.updateSelectedCount();
        this.updateImportButton();
    }
    
    /**
     * Update selected count display
     */
    updateSelectedCount() {
        const countEl = document.getElementById('selectedCount');
        if (countEl) {
            countEl.textContent = this.selectedSceneIds.size;
        }
    }
    
    /**
     * Update import button text
     */
    updateImportButton() {
        // Re-create the button with updated count
        this.editScreen.clearActions();
        this.editScreen.addSecondaryAction(
            'Cancel',
            '',
            () => this.close()
        );
        
        const count = this.getEnabledCount();
        this.editScreen.addPrimaryAction(
            `Import ${count} Scene${count !== 1 ? 's' : ''}`,
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>`,
            'primary',
            () => this.handleImport(),
            'btnImportScenes'
        );
    }
    
    /**
     * Get count of enabled scenes
     */
    getEnabledCount() {
        return this.importResult.scenes.filter(s => s.isEnabled).length;
    }
    
    /**
     * Handle scene edit (future: open edit modal)
     */
    handleSceneEdit(index) {
        // TODO: Open edit modal for individual scene
        console.log('Edit scene', index);
    }
    
    /**
     * Handle final import
     */
    async handleImport() {
        const enabledScenes = this.importResult.scenes.filter(s => s.isEnabled);
        
        if (enabledScenes.length === 0) {
            return;
        }
        
        // Check for existing scenes
        const { SceneService } = await import('../services/sceneService.js');
        const existingScenes = await SceneService.getAll(this.projectId);
        
        let shouldReplace = false;
        
        if (existingScenes.length > 0) {
            // Check if they are demo scenes
            const areDemoScenes = SceneService.areDemoScenes(existingScenes);
            
            if (areDemoScenes) {
                // Auto-replace demo scenes without asking
                shouldReplace = true;
                console.log('Auto-replacing demo scenes');
            } else {
                // Ask user what to do
                const choice = await this.showImportOptionsDialog(existingScenes.length, enabledScenes.length);
                
                if (choice === 'cancel') {
                    return;
                }
                
                shouldReplace = (choice === 'replace');
            }
        }
        
        // Show loading overlay
        this.showLoadingOverlay('Importing scenes...');
        
        // Disable button
        const btn = document.getElementById('btnImportScenes');
        if (btn) {
            btn.disabled = true;
        }
        
        try {
            // Delete existing scenes if replacing
            if (shouldReplace) {
                await SceneService.deleteAll(this.projectId);
            }
            
            // Create scenes in database
            const createdScenes = await ScriptImportService.createScenesFromImport(
                this.projectId,
                this.importResult.scenes
            );
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            // Close and callback
            this.close();
            
            if (this.onComplete) {
                this.onComplete(createdScenes);
            }
            
        } catch (error) {
            console.error('Import error:', error);
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            // Re-enable button
            if (btn) {
                btn.disabled = false;
            }
        }
    }
    
    /**
     * Show dialog to choose import behavior when scenes exist
     * @returns {Promise<string>} 'replace', 'append', or 'cancel'
     */
    showImportOptionsDialog(existingCount, newCount) {
        return new Promise((resolve) => {
            const dialog = document.createElement('dialog');
            dialog.className = 'modal';
            dialog.innerHTML = `
                <div class="modal-box">
                    <h3 class="font-bold text-lg">Existing Scenes Found</h3>
                    <p class="py-4">Your timeline already contains <strong>${existingCount} scene(s)</strong>.</p>
                    <p class="pb-4">How would you like to import the <strong>${newCount} new scene(s)</strong>?</p>
                    
                    <div class="flex flex-col gap-3">
                        <button class="btn btn-warning" data-choice="replace">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Replace All (Delete ${existingCount} existing, import ${newCount} new)
                        </button>
                        
                        <button class="btn btn-primary" data-choice="append">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add to Existing (Keep ${existingCount}, add ${newCount} new)
                        </button>
                        
                        <button class="btn btn-ghost" data-choice="cancel">
                            Cancel
                        </button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button data-choice="cancel">close</button>
                </form>
            `;
            
            // Handle button clicks
            const buttons = dialog.querySelectorAll('[data-choice]');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const choice = btn.getAttribute('data-choice');
                    dialog.close();
                    document.body.removeChild(dialog);
                    resolve(choice);
                });
            });
            
            document.body.appendChild(dialog);
            dialog.showModal();
        });
    }
    
    /**
     * Open the screen
     */
    open() {
        // Reset state when opening
        this.resetState();
        this.editScreen.open();
    }
    
    /**
     * Close the screen
     */
    close() {
        this.editScreen.close();
        // Reset state when closing (after a short delay to allow animation)
        setTimeout(() => this.resetState(), 300);
    }
    
    /**
     * Reset state to initial upload form
     */
    resetState() {
        // Clear state
        this.importResult = null;
        this.selectedSceneIds = new Set();
        this.editingSceneIndex = null;
        
        // Reset form content to upload form by updating formZone directly
        const formZone = this.editScreen.formZone;
        if (formZone) {
            formZone.innerHTML = this.renderUploadForm();
            this.initializeUpload();
        }
        
        // Reset primary action button to "Parse Script"
        const btn = document.getElementById('btnParseScript');
        if (btn) {
            btn.textContent = '';
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Parse Script
            `;
            btn.disabled = true;
            btn.onclick = () => this.handleParse();
        }
    }
    
    /**
     * Show loading overlay
     */
    showLoadingOverlay(message = 'Loading...') {
        // Remove existing overlay if any
        this.hideLoadingOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'scriptImportLoadingOverlay';
        overlay.className = 'fixed inset-0 bg-base-300/80 backdrop-blur-sm z-[100] flex items-center justify-center';
        overlay.innerHTML = `
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body items-center text-center gap-4 py-8 px-12">
                    <span class="loading loading-spinner loading-lg text-primary"></span>
                    <div class="text-lg font-semibold">${message}</div>
                    <div class="text-sm text-base-content/60">This may take a moment for larger scripts</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('scriptImportLoadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Show a transient error toast
     */
    showError(message) {
        // Remove any existing toast
        const existing = document.getElementById('scriptImportErrorToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'scriptImportErrorToast';
        toast.className = 'toast toast-end z-[200]';
        toast.innerHTML = `
            <div class="alert alert-error shadow-lg">
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-dismiss after 4s
        setTimeout(() => toast.remove(), 4000);
    }
}
