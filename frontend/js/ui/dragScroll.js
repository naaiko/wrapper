// =================================================================
// DRAG SCROLL - Smooth iPad-like Scrolling
// =================================================================
// Enables smooth drag-to-scroll with momentum

export class DragScroll {
    constructor(container) {
        this.container = container;
        this.isDown = false;
        this.startX = 0;
        this.scrollLeft = 0;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = Date.now();
        this.animationId = null;

        this.init();
    }

    init() {
        this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.container.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.container.addEventListener('mouseup', () => this.handleMouseUp());
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        this.container.style.cursor = 'grab';
    }

    handleMouseDown(e) {
        this.isDown = true;
        this.container.style.cursor = 'grabbing';
        this.container.style.userSelect = 'none';
        this.startX = e.pageX;
        this.scrollLeft = this.container.scrollLeft;
        this.lastX = e.pageX;
        this.lastTime = Date.now();
        this.velocity = 0;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    handleMouseLeave() {
        if (this.isDown) {
            this.isDown = false;
            this.container.style.cursor = 'grab';
            this.applyMomentum();
        }
    }

    handleMouseUp() {
        if (this.isDown) {
            this.isDown = false;
            this.container.style.cursor = 'grab';
            this.applyMomentum();
        }
    }

    handleMouseMove(e) {
        if (!this.isDown) return;
        e.preventDefault();
        
        const x = e.pageX;
        const deltaX = x - this.lastX;
        this.container.scrollLeft -= deltaX;
        
        const now = Date.now();
        const dt = Math.max(now - this.lastTime, 1);
        this.velocity = deltaX / dt * 16;
        
        this.lastX = x;
        this.lastTime = now;
    }

    applyMomentum() {
        if (Math.abs(this.velocity) > 0.1) {
            this.container.scrollLeft -= this.velocity;
            this.velocity *= 0.92;
            this.animationId = requestAnimationFrame(() => this.applyMomentum());
        } else {
            this.velocity = 0;
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}
