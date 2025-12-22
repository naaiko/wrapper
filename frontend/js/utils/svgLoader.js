// =================================================================
// SVG SPRITE LOADER
// =================================================================
// Loads SVG sprites once on app initialization
// Sprites are injected into DOM so <use> references work

/**
 * Load and inject SVG sprites into the DOM
 * Call this once on app initialization
 */
export async function loadSVGSprites() {
    const sprites = ['icons', 'patterns'];
    
    for (const sprite of sprites) {
        try {
            const response = await fetch(`./images/sprites/${sprite}.svg`);
            if (!response.ok) {
                console.warn(`Failed to load sprite: ${sprite}.svg`);
                continue;
            }
            
            const svgText = await response.text();
            
            // Inject at the start of body
            document.body.insertAdjacentHTML('afterbegin', svgText);
            
        } catch (error) {
            console.error(`Error loading sprite ${sprite}:`, error);
        }
    }
}

/**
 * Check if sprites are loaded
 */
export function areSpritesLoaded() {
    const hasIcons = document.getElementById('silhouette') !== null;
    const hasPatterns = document.getElementById('hatched') !== null;
    return hasIcons && hasPatterns;
}
