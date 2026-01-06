// =================================================================
// DRAG DROP REORDER - Drag & Drop for Timeline Reordering
// =================================================================
// Handles drag and drop reordering of scenes in story order

import { SceneService } from '../services/sceneService.js';

export class DragDropReorder {
    constructor(container, scenes, onReorder) {
        this.container = container;
        this.scenes = scenes;
        this.onReorder = onReorder; // Callback when reorder completes
        this.draggedElement = null;
        this.draggedScene = null;
    }

    attachListeners() {
        const sceneCards = this.container.querySelectorAll('.scene-card[draggable="true"]');
        sceneCards.forEach(card => {
            card.addEventListener('dragstart', (e) => this.handleDragStart(e));
            card.addEventListener('dragover', (e) => this.handleDragOver(e));
            card.addEventListener('drop', (e) => this.handleDrop(e));
            card.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });
    }

    handleDragStart(event) {
        this.draggedElement = event.currentTarget;
        const sceneId = this.draggedElement.getAttribute('data-scene-id');
        this.draggedScene = this.scenes.find(s => s.id === sceneId);
        
        event.currentTarget.style.opacity = '0.4';
        event.dataTransfer.effectAllowed = 'move';
    }

    handleDragOver(event) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        
        event.dataTransfer.dropEffect = 'move';
        
        const targetElement = event.currentTarget;
        if (targetElement !== this.draggedElement) {
            targetElement.style.borderLeft = '3px solid #ff6ec7';
        }
        
        return false;
    }

    async handleDrop(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        
        const targetElement = event.currentTarget;
        targetElement.style.borderLeft = 'none';
        
        if (this.draggedElement !== targetElement) {
            const targetSceneId = targetElement.getAttribute('data-scene-id');
            const targetScene = this.scenes.find(s => s.id === targetSceneId);
            
            if (this.draggedScene && targetScene) {
                const draggedOrder = this.draggedScene.story_order;
                const targetOrder = targetScene.story_order;
                
                // Update orders in local array
                if (draggedOrder < targetOrder) {
                    // Moving forward
                    this.scenes.forEach(scene => {
                        if (scene.story_order > draggedOrder && scene.story_order <= targetOrder) {
                            scene.story_order--;
                        }
                    });
                    this.draggedScene.story_order = targetOrder;
                } else {
                    // Moving backward
                    this.scenes.forEach(scene => {
                        if (scene.story_order >= targetOrder && scene.story_order < draggedOrder) {
                            scene.story_order++;
                        }
                    });
                    this.draggedScene.story_order = targetOrder;
                }
                
                // Save to database
                try {
                    await SceneService.reorder(this.scenes);
                    
                    // Call callback to re-render
                    if (this.onReorder) {
                        this.onReorder();
                    }
                } catch (error) {
                    console.error('Error updating scene order:', error);
                    alert('Failed to update scene order');
                }
            }
        }
        
        return false;
    }

    handleDragEnd(event) {
        event.currentTarget.style.opacity = '1';
        
        // Remove all border highlights
        this.container.querySelectorAll('.scene-card').forEach(card => {
            card.style.borderLeft = 'none';
        });
        
        this.draggedElement = null;
        this.draggedScene = null;
    }
}
