/**
 * Unified Pointer Input Handler
 * Provides a consistent API for mouse, touch, and pen input
 * 
 * Usage:
 * const pointer = new PointerInput(element, {
 *     onStart: (data) => console.log('Started', data),
 *     onMove: (data) => console.log('Moving', data),
 *     onEnd: (data) => console.log('Ended', data)
 * });
 * pointer.enable();
 */

export class PointerInput {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            capture: false,          // Use pointer capture for reliable tracking?
            preventDefaultMove: true, // Prevent default on move (e.g., scroll)?
            preventDefaultStart: false, // Prevent default on start?
            threshold: 3,            // Pixels before drag starts (touch tolerance)
            // Callbacks
            onStart: null,           // (data) => {} - Called on pointerdown
            onDragStart: null,       // (data) => {} - Called when threshold exceeded
            onMove: null,            // (data) => {} - Called on pointermove (after drag started)
            onEnd: null,             // (data) => {} - Called on pointerup
            onCancel: null,          // (data) => {} - Called on pointercancel
            ...options
        };
        
        this.isActive = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.pointerId = null;
        this.hasMoved = false;
        this.startTime = 0;
        
        // Bind methods to preserve context
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);
    }
    
    /**
     * Enable pointer input handling
     */
    enable() {
        this.element.addEventListener('pointerdown', this._onPointerDown);
        
        // Ensure touch-action is set for proper behavior
        if (!this.element.style.touchAction) {
            this.element.style.touchAction = 'none';
        }
    }
    
    /**
     * Disable pointer input handling and cleanup
     */
    disable() {
        this.element.removeEventListener('pointerdown', this._onPointerDown);
        this._removeListeners();
    }
    
    /**
     * Handle pointer down - start of interaction
     * @private
     */
    _onPointerDown(e) {
        // Only handle primary pointer (left mouse button, first touch point)
        if (!e.isPrimary) return;
        
        // Prevent default if requested
        if (this.options.preventDefaultStart) {
            e.preventDefault();
        }
        
        this.isActive = true;
        this.pointerId = e.pointerId;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        this.hasMoved = false;
        this.startTime = Date.now();
        
        // Capture pointer for reliable tracking even outside element
        if (this.options.capture) {
            try {
                this.element.setPointerCapture(e.pointerId);
            } catch (err) {
                console.warn('Pointer capture failed:', err);
            }
        }
        
        // Add move/up/cancel listeners
        this.element.addEventListener('pointermove', this._onPointerMove);
        this.element.addEventListener('pointerup', this._onPointerUp);
        this.element.addEventListener('pointercancel', this._onPointerCancel);
        
        // Fire start callback
        if (this.options.onStart) {
            this.options.onStart({
                x: e.clientX,
                y: e.clientY,
                pageX: e.pageX,
                pageY: e.pageY,
                target: e.target,
                event: e
            });
        }
    }
    
    /**
     * Handle pointer move - track movement and detect drag start
     * @private
     */
    _onPointerMove(e) {
        if (!this.isActive || e.pointerId !== this.pointerId) return;
        
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Check if we've exceeded the movement threshold
        if (!this.hasMoved && distance > this.options.threshold) {
            this.hasMoved = true;
            
            // Fire drag start callback
            if (this.options.onDragStart) {
                this.options.onDragStart({
                    x: this.currentX,
                    y: this.currentY,
                    pageX: e.pageX,
                    pageY: e.pageY,
                    deltaX,
                    deltaY,
                    target: e.target,
                    event: e
                });
            }
        }
        
        // Only fire move events after drag has started
        if (this.hasMoved) {
            // Prevent default behavior (like scrolling) during drag
            if (this.options.preventDefaultMove) {
                e.preventDefault();
            }
            
            if (this.options.onMove) {
                this.options.onMove({
                    x: this.currentX,
                    y: this.currentY,
                    pageX: e.pageX,
                    pageY: e.pageY,
                    deltaX,
                    deltaY,
                    startX: this.startX,
                    startY: this.startY,
                    target: e.target,
                    event: e
                });
            }
        }
    }
    
    /**
     * Handle pointer up - end of interaction
     * @private
     */
    _onPointerUp(e) {
        if (!this.isActive || e.pointerId !== this.pointerId) return;
        
        const wasMoving = this.hasMoved;
        const duration = Date.now() - this.startTime;
        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;
        
        this._removeListeners();
        
        if (this.options.onEnd) {
            this.options.onEnd({
                x: e.clientX,
                y: e.clientY,
                pageX: e.pageX,
                pageY: e.pageY,
                deltaX,
                deltaY,
                startX: this.startX,
                startY: this.startY,
                wasDrag: wasMoving,
                duration,
                target: e.target,
                event: e
            });
        }
    }
    
    /**
     * Handle pointer cancel - interaction was interrupted
     * @private
     */
    _onPointerCancel(e) {
        if (!this.isActive || e.pointerId !== this.pointerId) return;
        
        this._removeListeners();
        
        if (this.options.onCancel) {
            this.options.onCancel({
                event: e
            });
        }
    }
    
    /**
     * Cleanup listeners and reset state
     * @private
     */
    _removeListeners() {
        this.isActive = false;
        this.hasMoved = false;
        
        // Release pointer capture
        if (this.pointerId !== null && this.options.capture) {
            try {
                this.element.releasePointerCapture(this.pointerId);
            } catch (err) {
                // Pointer may have already been released
            }
        }
        
        this.pointerId = null;
        
        // Remove event listeners
        this.element.removeEventListener('pointermove', this._onPointerMove);
        this.element.removeEventListener('pointerup', this._onPointerUp);
        this.element.removeEventListener('pointercancel', this._onPointerCancel);
    }
    
    /**
     * Get current pointer state
     */
    getState() {
        return {
            isActive: this.isActive,
            hasMoved: this.hasMoved,
            startX: this.startX,
            startY: this.startY,
            currentX: this.currentX,
            currentY: this.currentY,
            deltaX: this.currentX - this.startX,
            deltaY: this.currentY - this.startY
        };
    }
}
