/**
 * SilhouetteController - Manages the actor silhouette display and interactions
 */
export class SilhouetteController {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Silhouette container with id '${containerId}' not found`);
        }
        
        this.svg = null;
        this.currentActor = null;
        this.initialize();
    }

    async initialize() {
        await this.createSilhouette();
    }

    async createSilhouette() {
        // Clear container
        this.container.innerHTML = '';

        try {
            // Fetch SVG file
            const response = await fetch('./images/silhouette.svg');
            const svgText = await response.text();
            
            // Create temporary container to parse SVG
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svgText;
            const svgElement = tempDiv.querySelector('svg');
            
            if (svgElement) {
                // Apply styling to SVG element
                svgElement.setAttribute('class', 'w-auto text-base-100');
                svgElement.setAttribute('fill', 'currentColor');
                svgElement.style.height = 'calc(100vh - 8rem)';
                svgElement.style.filter = 'drop-shadow(0 25px 12.5px rgba(0, 0, 0, 0.12))';
                svgElement.setAttribute('role', 'img');
                svgElement.setAttribute('aria-label', 'Actor silhouette');
                
                this.svg = svgElement;
                this.container.appendChild(this.svg);
            }
        } catch (error) {
            console.error('Error loading silhouette:', error);
        }
    }

    /**
     * Legacy createSilhouette with hardcoded path - kept for reference
     */
    createSilhouetteHardcoded() {
        // Clear container
        this.container.innerHTML = '';

        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', '70 -5 66 216');
        this.svg.setAttribute('fill', 'currentColor');
        this.svg.setAttribute('class', 'h-full w-auto text-base-100');
        this.svg.setAttribute('role', 'img');
        this.svg.setAttribute('aria-label', 'Actor silhouette');
        this.svg.style.filter = 'drop-shadow(0 25px 12.5px rgba(0, 0, 0, 0.25))';

        // Hardcoded path removed - now using external SVG file
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M104.265,117.959...');

        this.svg.appendChild(path);
        this.container.appendChild(this.svg);
    }

    /**
     * Update silhouette for a specific actor
     */
    updateActor(actor) {
        this.currentActor = actor;
        
        if (actor?.profile_image_url) {
            // Replace with actual photo
            this.showPhoto(actor.profile_image_url, actor.actor_name);
        } else {
            // Show default silhouette
            this.showDefaultSilhouette();
        }

        // Update aria-label
        const label = actor?.actor_name 
            ? `Silhouette of ${actor.actor_name}` 
            : 'Actor silhouette';
        this.svg.setAttribute('aria-label', label);
    }

    showPhoto(imageUrl, altText) {
        // Replace SVG with image element
        this.container.innerHTML = '';
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = altText;
        img.className = 'h-full w-auto object-contain';
        img.style.filter = 'drop-shadow(0 25px 12.5px rgba(0, 0, 0, 0.25))';
        this.container.appendChild(img);
    }

    showDefaultSilhouette() {
        // Recreate SVG if it was replaced
        if (!this.svg || !this.container.contains(this.svg)) {
            this.createSilhouette();
        }
    }

    /**
     * Get current actor
     */
    getActor() {
        return this.currentActor;
    }

    /**
     * Add interaction point (for future pinning functionality)
     */
    addPin(x, y, data) {
        // Placeholder for future functionality
        console.log('Pin added at', x, y, data);
    }
}
