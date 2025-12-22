// =================================================================
// ACTOR CARD RENDERER - Reusable component for rendering actor cards
// =================================================================

/**
 * Renders a compact actor card
 * Used for: actor lists, modals, previews
 * 
 * @param {Object} actor - Actor object with all properties
 * @param {Object} options - Rendering options
 * @param {boolean} options.showCharacter - Show character name (default: true)
 * @param {boolean} options.showContact - Show contact info (default: false)
 * @param {Array} options.sceneActors - Optional: scene_actors for this actor (for scene count)
 * @param {boolean} options.selectable - Add checkbox for selection (default: false)
 * @param {boolean} options.selected - Initial selected state (default: false)
 * @param {Function} options.onClick - Optional click handler
 * @returns {HTMLElement} The rendered actor card element
 */
export function renderActorCard(actor, options = {}) {
    const {
        showCharacter = true,
        showContact = false,
        sceneActors = [],
        selectable = false,
        selected = false,
        onClick = null
    } = options;

    const card = document.createElement('div');
    card.className = `card bg-white border border-base-300 shadow-sm hover:shadow-md transition-shadow ${selectable ? 'cursor-pointer' : ''}`;
    card.style.borderRadius = '6px';
    card.dataset.actorId = actor.id;
    
    const sceneCount = sceneActors.length;
    
    // Avatar or first letter
    const avatarContent = actor.profile_image_url 
        ? `<img src="${actor.profile_image_url}" alt="${actor.actor_name}" class="rounded-full" />`
        : `<div class="bg-base-300 flex items-center justify-center text-xs font-bold rounded-full w-full h-full">${actor.actor_name[0].toUpperCase()}</div>`;
    
    card.innerHTML = `
        <div class="card-body p-2">
            <div class="flex items-center gap-2">
                ${selectable ? `
                    <input 
                        type="checkbox" 
                        class="checkbox checkbox-sm checkbox-primary" 
                        ${selected ? 'checked' : ''}
                        data-actor-checkbox
                    />
                ` : ''}
                
                <!-- Avatar -->
                <div class="avatar flex-shrink-0">
                    <div class="w-10 h-10 rounded-full">
                        ${avatarContent}
                    </div>
                </div>
                
                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm truncate">${actor.actor_name}</div>
                    ${showCharacter ? `
                        <div class="text-xs text-base-content/60 truncate">as ${actor.character_name}</div>
                    ` : ''}
                    ${showContact && actor.email ? `
                        <div class="text-xs text-base-content/40 truncate">${actor.email}</div>
                    ` : ''}
                </div>
                
                <!-- Scene count badge -->
                ${sceneCount > 0 ? `
                    <div class="badge badge-ghost badge-xs flex-shrink-0">${sceneCount} scene${sceneCount !== 1 ? 's' : ''}</div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add click handler if provided
    if (onClick) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking checkbox
            if (e.target.type === 'checkbox') return;
            onClick(actor, e);
        });
    }
    
    // Handle checkbox clicks for selectable cards
    if (selectable) {
        const checkbox = card.querySelector('[data-actor-checkbox]');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                card.classList.toggle('ring-2', checkbox.checked);
                card.classList.toggle('ring-primary', checkbox.checked);
            });
            
            // Initial ring state
            if (selected) {
                card.classList.add('ring-2', 'ring-primary');
            }
        }
    }
    
    return card;
}

/**
 * Render a minimal actor badge (for inline use)
 * 
 * @param {Object} actor - Actor object
 * @returns {HTMLElement} Badge element
 */
export function renderActorBadge(actor) {
    const badge = document.createElement('div');
    badge.className = 'badge badge-outline gap-1';
    badge.dataset.actorId = actor.id;
    
    const avatarContent = actor.profile_image_url 
        ? `<img src="${actor.profile_image_url}" alt="${actor.actor_name}" class="w-4 h-4 rounded-full" />`
        : `<div class="w-4 h-4 bg-base-300 rounded-full flex items-center justify-center text-xs font-bold">${actor.actor_name[0].toUpperCase()}</div>`;
    
    badge.innerHTML = `
        ${avatarContent}
        <span class="text-xs">${actor.actor_name}</span>
    `;
    
    return badge;
}

/**
 * Build actor display name
 * @param {Object} actor - Actor object
 * @param {boolean} includeCharacter - Include character name in parentheses
 * @returns {string} Formatted name
 */
export function buildActorDisplayName(actor, includeCharacter = false) {
    if (!actor) return '';
    
    if (includeCharacter && actor.character_name) {
        return `${actor.actor_name} (${actor.character_name})`;
    }
    
    return actor.actor_name;
}
