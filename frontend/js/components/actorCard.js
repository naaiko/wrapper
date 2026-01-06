/**
 * ACTOR CARD COMPONENT
 * 
 * Polaroid-style card for displaying actors in grid view.
 * DaisyUI card with photo, name, role badge, and scene count.
 */

export class ActorCard {
    /**
     * Render a single actor card
     * @param {Object} actor - Actor object from database
     * @param {Function} onClick - Click handler function
     * @returns {HTMLElement} Card element
     */
    static render(actor, onClick) {
        const card = document.createElement('div');
        card.className = 'actor-card card card-compact bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 cursor-pointer';
        card.dataset.actorId = actor.id;
        
        // Photo figure (1:1 aspect ratio - square cards for better density)
        const figure = document.createElement('figure');
        figure.className = 'aspect-square bg-base-300 overflow-hidden';
        
        if (actor.photo_url) {
            const img = document.createElement('img');
            img.src = actor.photo_url;
            img.alt = actor.name;
            img.className = 'w-full h-full object-cover';
            img.loading = 'lazy';
            figure.appendChild(img);
        } else {
            // Placeholder if no photo
            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-full flex items-center justify-center text-base-content/30';
            placeholder.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            `;
            figure.appendChild(placeholder);
        }
        
        // Card body
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        // Name
        const title = document.createElement('h3');
        title.className = 'card-title text-sm truncate';
        title.textContent = actor.name;
        
        // Badges container
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'flex gap-1 flex-wrap';
        
        // Role badge
        if (actor.role) {
            const roleBadge = document.createElement('span');
            roleBadge.className = this.getRoleBadgeClass(actor.role);
            roleBadge.textContent = this.getRoleLabel(actor.role);
            badgesContainer.appendChild(roleBadge);
        }
        
        // Scene count badge (if available)
        if (actor.scene_count !== undefined) {
            const scenesBadge = document.createElement('span');
            scenesBadge.className = 'badge badge-ghost badge-sm';
            scenesBadge.textContent = `${actor.scene_count} scene${actor.scene_count !== 1 ? 's' : ''}`;
            badgesContainer.appendChild(scenesBadge);
        }
        
        // Assemble card
        cardBody.appendChild(title);
        cardBody.appendChild(badgesContainer);
        card.appendChild(figure);
        card.appendChild(cardBody);
        
        // Click handler
        if (onClick) {
            card.addEventListener('click', () => onClick(actor));
        }
        
        return card;
    }
    
    /**
     * Get badge class based on role
     */
    static getRoleBadgeClass(role) {
        const roleMap = {
            'hoofdrol': 'badge badge-primary badge-sm',
            'bijrol': 'badge badge-secondary badge-sm',
            'figurant': 'badge badge-accent badge-sm',
            'extra': 'badge badge-neutral badge-sm'
        };
        return roleMap[role?.toLowerCase()] || 'badge badge-ghost badge-sm';
    }
    
    /**
     * Get display label for role
     */
    static getRoleLabel(role) {
        if (!role) return '';
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    /**
     * Render skeleton loading state
     */
    static renderSkeleton() {
        const card = document.createElement('div');
        card.className = 'card card-compact bg-base-100 shadow-xl';
        card.innerHTML = `
            <figure class="aspect-square bg-base-300">
                <div class="skeleton w-full h-full"></div>
            </figure>
            <div class="card-body gap-2">
                <div class="skeleton h-4 w-3/4"></div>
                <div class="flex gap-1">
                    <div class="skeleton h-5 w-16"></div>
                    <div class="skeleton h-5 w-20"></div>
                </div>
            </div>
        `;
        return card;
    }
    
    /**
     * Render multiple skeleton cards for loading state
     */
    static renderSkeletons(count = 8) {
        return Array.from({ length: count }, () => this.renderSkeleton());
    }
}
