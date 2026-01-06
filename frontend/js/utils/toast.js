// =================================================================
// TOAST NOTIFICATION UTILITY
// =================================================================

class Toast {
    static container = null;
    
    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }
    
    static show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        toast.innerHTML = `
            <div class="toast-message">${message}</div>
        `;
        
        // Manual close on click
        toast.addEventListener('click', () => this.remove(toast));
        
        this.container.appendChild(toast);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }
        
        return toast;
    }
    
    static remove(toast) {
        toast.classList.add('toast-removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    static getIcon(type) {
        // Icons disabled - return empty string
        return '';
    }
    
    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }
    
    static error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }
    
    static warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }
    
    static info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Named export for convenience
export function showToast(message, type = 'info', duration = 3000) {
    return Toast.show(message, type, duration);
}

export default Toast;
