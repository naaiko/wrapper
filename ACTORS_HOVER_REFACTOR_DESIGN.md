# Actors.js Hover Effects Refactor - Design Document

## Huidige Situatie

### Mouse-Only Hover Implementation
```javascript
// Bodyshots, accessories, en outfits gebruiken allen:
element.addEventListener('mouseenter', () => {
    layer.classList.add('has-hover');
    overlay.style.opacity = '1';
    plusSymbol.setAttribute('transform', `translate(${centerX}, ${centerY})`);
});

element.addEventListener('mouseleave', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
        if (!isAnyHovered) layer.classList.remove('has-hover');
    }, 10);
});
```

**Problemen:**
1. Geen touch support - tablets/mobiel kunnen niet interacteren
2. `mouseenter`/`mouseleave` worden niet getriggerd op touch devices
3. Hover-dependent dimming is niet toegankelijk op touch
4. Plus symbol positioning werkt niet met touch

## Nieuwe Architectuur: Click/Tap Toggle

### Design Principes

1. **Progressive Enhancement** - Desktop mouse hover blijft werken, touch krijgt tap-to-select
2. **Visual Consistency** - Zelfde dimming effect, maar via `.selected` class
3. **Clear Selection State** - Duidelijke visuele feedback wanneer zone geselecteerd is
4. **Auto-Deselect** - Klikken buiten een zone deselecteert automatisch
5. **Pointer Events** - Gebruik pointer events voor unified input handling

### Architectuur

#### State Management
```javascript
const actorZoneState = {
    selectedBodyshot: null,
    selectedAccessory: null,
    selectedOutfit: null,
    currentLayer: null
};
```

#### Unified Event Handling
```javascript
function setupZoneInteraction(element, overlay, layer, type, index) {
    // Pointer-based click/tap detection
    let pointerDown = null;
    
    element.addEventListener('pointerdown', (e) => {
        if (!e.isPrimary) return;
        pointerDown = { x: e.clientX, y: e.clientY, time: Date.now() };
    });
    
    element.addEventListener('pointerup', (e) => {
        if (!e.isPrimary || !pointerDown) return;
        
        // Check if it was a click/tap (not drag)
        const dx = Math.abs(e.clientX - pointerDown.x);
        const dy = Math.abs(e.clientY - pointerDown.y);
        const dt = Date.now() - pointerDown.time;
        
        if (dx < 10 && dy < 10 && dt < 500) {
            toggleZoneSelection(element, overlay, layer, type, index);
        }
        
        pointerDown = null;
    });
    
    // Desktop hover enhancement (optional, for better UX)
    if (window.matchMedia('(hover: hover)').matches) {
        element.addEventListener('mouseenter', () => {
            if (!actorZoneState[`selected${type}`]) {
                showOverlayPreview(overlay, layer);
            }
        });
        
        element.addEventListener('mouseleave', () => {
            if (!actorZoneState[`selected${type}`]) {
                hideOverlayPreview(overlay, layer);
            }
        });
    }
}
```

#### Toggle Selection
```javascript
function toggleZoneSelection(element, overlay, layer, type, index) {
    const stateKey = `selected${type}`;
    const isCurrentlySelected = actorZoneState[stateKey] === index;
    
    if (isCurrentlySelected) {
        // Deselect
        deselectZone(type);
    } else {
        // Deselect other zones of same type first
        deselectZone(type);
        
        // Select this zone
        selectZone(element, overlay, layer, type, index);
    }
}

function selectZone(element, overlay, layer, type, index) {
    console.log(`✅ Selecting ${type} zone ${index}`);
    
    const stateKey = `selected${type}`;
    actorZoneState[stateKey] = index;
    actorZoneState.currentLayer = layer;
    
    // Visual feedback
    layer.classList.add('has-selection');
    element.classList.add('zone-selected');
    overlay.style.opacity = '1';
    
    // Position plus symbol
    const centerX = overlay.getAttribute('data-center-x');
    const centerY = overlay.getAttribute('data-center-y');
    const plusSymbol = document.querySelector('#plus-symbol');
    if (plusSymbol && centerX && centerY) {
        plusSymbol.setAttribute('transform', `translate(${centerX}, ${centerY})`);
        plusSymbol.style.display = 'block';
    }
    
    // Touch ripple effect (optional visual enhancement)
    createTouchRipple(element);
}

function deselectZone(type) {
    const stateKey = `selected${type}`;
    const selectedIndex = actorZoneState[stateKey];
    
    if (selectedIndex === null) return;
    
    console.log(`❌ Deselecting ${type} zone ${selectedIndex}`);
    
    // Find layer and elements
    const layerMap = {
        'Bodyshot': '.layer-bodyshots',
        'Accessory': '.layer-accesories',
        'Outfit': '.layer-outfit'
    };
    
    const layer = document.querySelector(layerMap[type]);
    if (!layer) return;
    
    // Remove selection state
    layer.classList.remove('has-selection');
    
    const elements = layer.querySelectorAll(':not(.overlay)');
    const overlays = layer.querySelectorAll('.overlay');
    
    if (elements[selectedIndex]) {
        elements[selectedIndex].classList.remove('zone-selected');
    }
    
    if (overlays[selectedIndex]) {
        overlays[selectedIndex].style.opacity = '0';
    }
    
    // Hide plus symbol
    const plusSymbol = document.querySelector('#plus-symbol');
    if (plusSymbol) {
        plusSymbol.style.display = 'none';
    }
    
    // Clear state
    actorZoneState[stateKey] = null;
    if (actorZoneState.currentLayer === layer) {
        actorZoneState.currentLayer = null;
    }
}
```

#### Global Deselect on Outside Click
```javascript
document.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary) return;
    
    // Check if click is outside all actor zones
    const isInsideActorZone = e.target.closest('.layer-bodyshots, .layer-accesories, .layer-outfit');
    
    if (!isInsideActorZone) {
        // Deselect all zones
        deselectZone('Bodyshot');
        deselectZone('Accessory');
        deselectZone('Outfit');
    }
});
```

## CSS Changes

```css
/* Replace hover-based dimming with selection-based */

/* OLD - Remove */
.layer-bodyshots.has-hover rect:not(:hover) {
    opacity: 0.3;
}

/* NEW - Add */
.layer-bodyshots.has-selection rect:not(.zone-selected) {
    opacity: 0.3;
    transition: opacity 0.2s ease;
}

.layer-bodyshots rect.zone-selected {
    opacity: 1;
    filter: drop-shadow(0 0 8px oklch(var(--p) / 0.5));
}

/* Same pattern for accessories and outfits */
.layer-accesories.has-selection circle:not(.zone-selected) {
    opacity: 0.3;
    transition: opacity 0.2s ease;
}

.layer-accesories circle.zone-selected {
    opacity: 1;
    filter: drop-shadow(0 0 8px oklch(var(--p) / 0.5));
}

.layer-outfit.has-selection path:not(.zone-selected) {
    opacity: 0.3;
    transition: opacity 0.2s ease;
}

.layer-outfit path.zone-selected {
    opacity: 1;
    filter: drop-shadow(0 0 8px oklch(var(--p) / 0.5));
}

/* Touch ripple effect (optional) */
@keyframes touch-ripple {
    from {
        transform: scale(0);
        opacity: 0.5;
    }
    to {
        transform: scale(2);
        opacity: 0;
    }
}

.touch-ripple {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: oklch(var(--p) / 0.3);
    pointer-events: none;
    animation: touch-ripple 0.6s ease-out;
}
```

## Implementatie Stappen

### Stap 1: Update actors.css
- Replace `:hover` pseudo-classes met `.zone-selected` classes
- Add `.has-selection` class rules (replace `.has-hover`)
- Add touch ripple animation

### Stap 2: Refactor setupBodyshotHoverEffects()
- Remove `mouseenter`/`mouseleave` listeners
- Add `pointerdown`/`pointerup` listeners
- Implement toggle selection logic
- Preserve plus symbol positioning

### Stap 3: Refactor setupAccessoryHoverEffects()
- Same pattern as bodyshots
- Unified click/tap toggle

### Stap 4: Refactor setupOutfitHoverEffects()
- Same pattern as bodyshots and accessories
- Unified click/tap toggle

### Stap 5: Add Global Deselect
- Document-level `pointerdown` listener
- Outside click detection
- Deselect all zones

### Stap 6: Optional Desktop Hover Enhancement
- Media query `(hover: hover)` detection
- Temporary overlay preview on hover (if not selected)
- Does not interfere with touch behavior

## Backwards Compatibility

- Desktop users can still click zones (same as touch tap)
- Optional: Desktop hover preview shows overlay without selection
- Keyboard navigation can be added later (tab + enter)
- Screen reader support via `aria-selected` attribute

## Testing Checklist

- [ ] Desktop mouse click selects zone
- [ ] Desktop mouse click again deselects zone
- [ ] Click outside deselects all zones
- [ ] iPad tap selects zone
- [ ] iPad tap again deselects zone
- [ ] iPhone tap works correctly
- [ ] Plus symbol positions correctly on all zones
- [ ] Dimming effect works (other zones become semi-transparent)
- [ ] No console errors
- [ ] Visual feedback is clear and immediate
- [ ] Optional: Desktop hover preview works (if implemented)

## Geschatte Implementatie Tijd

- CSS updates: 30 minuten
- Bodyshot refactor: 30 minuten
- Accessory refactor: 20 minuten
- Outfit refactor: 20 minuten
- Global deselect: 15 minuten
- Testing & debugging: 30 minuten
- **Totaal: ~2.5 uur** (doordacht en getest)

---

**Belangrijke noot:** Dit design behoudt alle bestaande functionaliteit (overlay dimming, plus symbol positioning) maar maakt het toegankelijk voor touch devices door click/tap toggle behavior toe te voegen in plaats van hover-only behavior.
