// =================================================================
// DRAG SCROLL - Smooth iPad-like Scrolling
// =================================================================
// Enables smooth drag-to-scroll with momentum
// Now supports mouse, touch, and pen via Pointer Events

import { PointerInput } from '../utils/pointerInput.js';

export class DragScroll {
    constructor(container) {
        this.container = container;
        this.scrollLeft = 0;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = Date.now();
        this.animationId = null;
        
        // Create pointer input handler
        this.pointer = new PointerInput(container, {
            capture: true,              // Capture pointer for reliable tracking
            preventDefaultMove: true,   // Prevent default scroll during drag
            threshold: 3,               // Small threshold for immediate feedback
            onStart: (data) => this.handleStart(data),
            onMove: (data) => this.handleMove(data),
            onEnd: (data) => this.handleEnd(data)
        });

        this.init();
    }

    init() {
        this.container.style.cursor = 'grab';
        this.container.style.touchAction = 'none'; // Prevent browser touch gestures
        this.pointer.enable();
    }

    handleStart(data) {
        this.container.style.cursor = 'grabbing';
        this.container.style.userSelect = 'none';
        this.scrollLeft = this.container.scrollLeft;
        this.lastX = data.pageX;
        this.lastTime = Date.now();
        this.velocity = 0;
        
        // Cancel any ongoing momentum animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    handleMove(data) {
        const deltaX = data.pageX - this.lastX;
        this.container.scrollLeft -= deltaX;
        
        // Calculate velocity for momentum
        const now = Date.now();
        const dt = Math.max(now - this.lastTime, 1);
        this.velocity = deltaX / dt * 16; // Normalize to 60fps
        
        this.lastX = data.pageX;
        this.lastTime = now;
    }

    handleEnd(data) {
        this.container.style.cursor = 'grab';
        
        // Apply momentum if there was movement
        if (data.wasDrag) {
            this.applyMomentum();
        }
    }

    applyMomentum() {
        if (Math.abs(this.velocity) > 0.1) {
            this.container.scrollLeft -= this.velocity;
            this.velocity *= 0.92; // Friction factor
            this.animationId = requestAnimationFrame(() => this.applyMomentum());
        } else {
            this.velocity = 0;
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.pointer.disable();
    }
}
