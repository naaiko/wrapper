# Touch-First Refactor - Analyse & Implementatieplan

## Datum: 5 januari 2026
## Project: Continuity Manager Webapp
## Branch: mobile-rework (checkpoint commit: "Safe checkpoint before touch-first refactor")

---

## 📋 Executive Summary

Deze webapp is gebouwd met een **desktop-first, mouse-only** aanpak. Touch-ondersteuning is incidenteel en niet gestructureerd. Voor optimale iPad/mobiele ervaring is een fundamentele refactor nodig naar een **unified pointer-based input model**.

---

## 🔍 1. ANALYSE VAN HUIDIGE PROBLEMEN

### 1.1 Mouse-Only Event Listeners (KRITIEK)

**Probleembestanden:**

#### `dragScroll.js` (100% mouse-only)
```javascript
// HUIDIG - Alleen mousedown/mousemove/mouseup
this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
this.container.addEventListener('mouseleave', () => this.handleMouseLeave());
this.container.addEventListener('mouseup', () => this.handleMouseUp());
this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
```
**Impact:** Drag-to-scroll werkt NIET op touch devices.

#### `timeline.js` (Manual scroll implementatie)
```javascript
// Lijnen 662-712: Document-level mousedown/mousemove/mouseup
document.addEventListener('mousedown', (e) => { ... });
document.addEventListener('mouseleave', () => { ... });
document.addEventListener('mouseup', () => { ... });
document.addEventListener('mousemove', (e) => { ... });

// Lijnen 800-827: Minimap viewport dragging
minimapViewport.addEventListener('mousedown', (e) => { ... });
document.addEventListener('mousemove', (e) => { ... });
document.addEventListener('mouseup', () => { ... });
```
**Impact:** Timeline scrollen en minimap manipulatie werkt NIET op touch.

#### `actors.js` (Hover-dependent interacties)
```javascript
// Lijnen 432-456: Bodyshot zones
rect.addEventListener('mouseenter', () => { ... });
rect.addEventListener('mouseleave', () => { ... });
const isAnyRectHovered = Array.from(rects).some(r => r.matches(':hover'));

// Lijnen 490-512: Accessory zones
circle.addEventListener('mouseenter', () => { ... });
circle.addEventListener('mouseleave', () => { ... });
```
**Impact:** Hover effects zijn ONBRUIKBAAR op touch devices. Geen alternatieve interactie.

#### `navigation.js`
```javascript
// Lijn 113: Dropdown trigger
dropdownBtn.addEventListener('mousedown', (e) => { ... });
```
**Impact:** Kan issues geven op touch (zou click moeten zijn of pointer-based).

#### `calendarAnimations.js`
```javascript
// Lijn 30: Drag preview volgt cursor
document.addEventListener('mousemove', (e) => {
    if (this.dragPreview) {
        this.updateDragPreviewPosition(e.clientX, e.clientY);
    }
});
```
**Impact:** Drag preview werkt niet op touch.

### 1.2 HTML5 Drag-and-Drop API (KRITIEK)

**Probleembestand:** `calendar-toastui.js`

```javascript
// Lijnen 1030-1055: HTML5 Drag API
card.draggable = true;
card.addEventListener('dragstart', (e) => { ... });
card.addEventListener('dragend', () => { ... });
```

**Impact:** HTML5 Drag API heeft **notoir slechte touch support**:
- Geen native touch events in Safari iOS
- Inconsistent gedrag op Android
- Polyfills zijn hacky en onbetrouwbaar

**Oplossing:** Vervang door pointer-based manual drag implementatie.

### 1.3 SortableJS (POSITIEF maar needs config)

**Bestand:** `timeline.js` (lijn 454)

```javascript
sortableInstance = Sortable.create(container, {
    animation: 200,
    // ... config
});
```

**Status:** ✅ SortableJS heeft **goede touch support out-of-the-box**.

**Aandachtspunten:**
- Verificatie: `touch-action` CSS is correct gezet
- Test op iOS Safari voor edge cases
- Swap zones kunnen anders aanvoelen op touch (grotere targets nodig)

### 1.4 Hover-Dependent UI (KRITIEK)

**Problemen:**
- **100+ CSS hover states** (`hover:bg-base-200`, `hover:shadow-md`, etc.)
- Essentiële interacties vereisen hover (bijv. actor zones)
- Geen touch-equivalent voor "preview" states

**Impact:**
- Gebruiker kan niet zien wat "actief" is op touch
- Hover states blijven "plakken" op touch (iOS quirk)
- Geen visual feedback voor touch targets

### 1.5 Target Sizes (KRITIEK)

**Kleinste buttons gevonden:**
```html
<!-- formFieldTemplates.js: Clear buttons -->
class="btn btn-ghost btn-xs ..."  <!-- Zeer klein -->

<!-- customDropdown.js: Delete buttons -->
class="btn btn-ghost btn-xs btn-square ..."  <!-- ~24x24px schatting -->
```

**WCAG 2.1 Level AAA:** Minimum 44x44px voor touch targets.
**Realiteit:** Veel buttons zijn waarschijnlijk <44px.

### 1.6 CSS touch-action (GOED maar incompleet)

**Huidig gebruik:**
```javascript
// Enkele pointer-events en touch-action referenties
// Maar GEEN systematische toepassing
```

**Nodig:**
- `touch-action: none` voor drag zones
- `touch-action: pan-x` / `pan-y` voor scroll containers
- `touch-action: manipulation` voor buttons (voorkomt 300ms delay)

---

## 🎯 2. VOORSTEL: UNIFIED POINTER-BASED INPUT MODEL

### 2.1 Pointer Events API (W3C Standard)

**Waarom Pointer Events?**
- ✅ Unifies mouse, touch, en pen input
- ✅ Breed ondersteund (97.9% browsers)
- ✅ Geen polyfills nodig
- ✅ Betere event precision dan touch events
- ✅ Pointer capture API voor robust dragging

**Event mapping:**
```
mousedown  → pointerdown
mousemove  → pointermove
mouseup    → pointerup
mouseenter → pointerenter
mouseleave → pointerleave
```

### 2.2 Pointer Capture voor Dragging

**Voordeel:**
```javascript
// Captures pointer events EVERYWHERE, zelfs buiten element
element.setPointerCapture(e.pointerId);

// Events blijven komen, zelfs als pointer buiten element gaat
element.addEventListener('pointermove', handleMove);
```

**Use cases:**
- Drag-to-scroll (dragScroll.js)
- Timeline manual scroll
- Minimap viewport dragging
- Calendar scene dragging

### 2.3 Touch-First Architecture Principles

1. **Pointer Events als primair**
   - Fallback alleen voor legacy browser support
   - Geen separate touch/mouse code paths

2. **Explicit touch-action declarations**
   - Prevent default browser behaviors waar nodig
   - Enable native scrolling waar gewenst

3. **Passive listeners waar mogelijk**
   - `{ passive: true }` voor scroll listeners
   - `{ passive: false }` voor drag waar preventDefault nodig is

4. **Visual feedback zonder hover**
   - Active states via class toggles
   - Touch ripple effects
   - Explicit "selected" states

5. **Tolerant interaction zones**
   - Grotere hit areas voor touch
   - Pointer niet pixel-perfect op touch

---

## 🛠️ 3. IMPLEMENTATIEPLAN (STAPSGEWIJS)

### FASE 1: Foundation (Critical Path)

#### 1.1 Utility: PointerInput Helper
**Nieuw bestand:** `frontend/js/utils/pointerInput.js`

```javascript
/**
 * Unified Pointer Input Handler
 * Abstracts mouse/touch/pen into single API
 */
export class PointerInput {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            capture: false,          // Use pointer capture?
            preventDefaultMove: true, // Prevent scroll during drag?
            threshold: 3,            // Pixels before drag starts (touch tolerance)
            ...options
        };
        
        this.isActive = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.pointerId = null;
        this.hasMoved = false;
        
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);
    }
    
    enable() {
        this.element.addEventListener('pointerdown', this._onPointerDown);
        // CSS: moet touch-action hebben
        if (!this.element.style.touchAction) {
            this.element.style.touchAction = 'none';
        }
    }
    
    disable() {
        this.element.removeEventListener('pointerdown', this._onPointerDown);
        this._removeListeners();
    }
    
    _onPointerDown(e) {
        // Only handle primary pointer (left mouse, first touch)
        if (!e.isPrimary) return;
        
        this.isActive = true;
        this.pointerId = e.pointerId;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        this.hasMoved = false;
        
        // Capture pointer for reliable tracking
        if (this.options.capture) {
            this.element.setPointerCapture(e.pointerId);
        }
        
        // Add document-level listeners
        this.element.addEventListener('pointermove', this._onPointerMove);
        this.element.addEventListener('pointerup', this._onPointerUp);
        this.element.addEventListener('pointercancel', this._onPointerCancel);
        
        // Fire start callback
        if (this.options.onStart) {
            this.options.onStart({
                x: e.clientX,
                y: e.clientY,
                event: e
            });
        }
    }
    
    _onPointerMove(e) {
        if (!this.isActive || e.pointerId !== this.pointerId) return;
        
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Check threshold for drag start
        if (!this.hasMoved && distance > this.options.threshold) {
            this.hasMoved = true;
            if (this.options.onDragStart) {
                this.options.onDragStart({ x: this.currentX, y: this.currentY, event: e });
            }
        }
        
        if (this.hasMoved) {
            if (this.options.preventDefaultMove) {
                e.preventDefault();
            }
            
            if (this.options.onMove) {
                this.options.onMove({
                    x: this.currentX,
                    y: this.currentY,
                    deltaX,
                    deltaY,
                    event: e
                });
            }
        }
    }
    
    _onPointerUp(e) {
        if (!this.isActive || e.pointerId !== this.pointerId) return;
        
        const wasMoving = this.hasMoved;
        this._removeListeners();
        
        if (this.options.onEnd) {
            this.options.onEnd({
                x: e.clientX,
                y: e.clientY,
                wasDrag: wasMoving,
                event: e
            });
        }
    }
    
    _onPointerCancel(e) {
        if (!this.isActive || e.pointerId !== this.pointerId) return;
        
        this._removeListeners();
        
        if (this.options.onCancel) {
            this.options.onCancel({ event: e });
        }
    }
    
    _removeListeners() {
        this.isActive = false;
        this.hasMoved = false;
        
        if (this.pointerId !== null && this.options.capture) {
            try {
                this.element.releasePointerCapture(this.pointerId);
            } catch (e) {
                // Pointer may have already been released
            }
        }
        
        this.pointerId = null;
        this.element.removeEventListener('pointermove', this._onPointerMove);
        this.element.removeEventListener('pointerup', this._onPointerUp);
        this.element.removeEventListener('pointercancel', this._onPointerCancel);
    }
}
```

#### 1.2 Refactor: dragScroll.js
**Voor:**
```javascript
// Mouse-only implementatie
this.container.addEventListener('mousedown', ...);
```

**Na:**
```javascript
import { PointerInput } from '../utils/pointerInput.js';

export class DragScroll {
    constructor(container) {
        this.container = container;
        this.scrollLeft = 0;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = Date.now();
        this.animationId = null;
        
        this.pointer = new PointerInput(container, {
            capture: true,
            preventDefaultMove: true,
            onStart: (data) => this.handleStart(data),
            onMove: (data) => this.handleMove(data),
            onEnd: (data) => this.handleEnd(data)
        });
        
        this.init();
    }
    
    init() {
        this.container.style.cursor = 'grab';
        this.container.style.touchAction = 'none';
        this.pointer.enable();
    }
    
    handleStart(data) {
        this.container.style.cursor = 'grabbing';
        this.container.style.userSelect = 'none';
        this.scrollLeft = this.container.scrollLeft;
        this.lastX = data.x;
        this.lastTime = Date.now();
        this.velocity = 0;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    handleMove(data) {
        const deltaX = data.x - this.lastX;
        this.container.scrollLeft -= deltaX;
        
        const now = Date.now();
        const dt = Math.max(now - this.lastTime, 1);
        this.velocity = deltaX / dt * 16;
        
        this.lastX = data.x;
        this.lastTime = now;
    }
    
    handleEnd(data) {
        this.container.style.cursor = 'grab';
        if (data.wasDrag) {
            this.applyMomentum();
        }
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
        this.pointer.disable();
    }
}
```

#### 1.3 Refactor: timeline.js Manual Scroll
**Sectie:** Lijnen 662-728

**Strategie:**
1. Vervang document-level mouse listeners door PointerInput
2. Gebruik pointer capture voor betrouwbaar tracking
3. Test threshold adjustment voor touch (3-5px)

#### 1.4 Refactor: calendar-toastui.js Drag-and-Drop
**KRITIEK:** Dit is de grootste wijziging

**Huidige flow:**
1. `card.draggable = true` (HTML5 API)
2. `dragstart` event → set `draggedSceneId`
3. `dragend` event → clear `draggedSceneId`
4. Toast UI Calendar `beforeCreateEvent` → plaatst scene

**Nieuwe flow:**
1. PointerInput op unscheduled scene cards
2. `onDragStart` → create ghost element, set `draggedSceneId`
3. `onMove` → update ghost position
4. `onEnd` → hit-test calendar cell, trigger `beforeCreateEvent`
5. Cleanup ghost element

**Code outline:**
```javascript
// Per unscheduled card:
const pointerInput = new PointerInput(card, {
    capture: false, // We willen calendar events kunnen detecteren
    threshold: 5,   // Touch-friendly
    onDragStart: (data) => {
        draggedSceneId = scene.id;
        createDragGhost(card, data);
    },
    onMove: (data) => {
        updateDragGhost(data.x, data.y);
        highlightDropTarget(data.x, data.y);
    },
    onEnd: (data) => {
        const target = findCalendarCellAt(data.x, data.y);
        if (target) {
            const date = getDateFromCell(target);
            // Trigger Toast UI's add flow
            scheduleScene(draggedSceneId, date);
        }
        removeDragGhost();
        draggedSceneId = null;
    }
});
```

### FASE 2: Touch-Optimized UI

#### 2.1 Target Size Audit
**Tool:** Browser DevTools + custom overlay

```javascript
// Debug helper
function highlightSmallTargets() {
    const allButtons = document.querySelectorAll('button, a, [role="button"]');
    allButtons.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
            el.style.outline = '2px solid red';
            console.warn('Small target:', el, `${rect.width}x${rect.height}px`);
        }
    });
}
```

**Acties:**
- Alle `btn-xs` vervangen door `btn-sm` (minimum)
- Padding toevoegen waar nodig
- Invisible hit-area extensions (::before pseudo-elements)

#### 2.2 Hover Replacement Strategy

**Voor actor zones (bodyshots/accessories/outfit):**

**Huidig:**
- Hover → dim andere zones
- Click → selecteer

**Touch-friendly:**
- Touch → toggle select (met ripple feedback)
- Selected state → highlight met CSS
- Deselect → touch opnieuw OF "clear" button

**Implementatie:**
```javascript
// Vervang mouseenter/mouseleave door pointerdown
rect.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // Prevent scroll
    
    // Toggle selection
    const wasSelected = rect.classList.contains('selected');
    
    // Clear other selections in same layer (if single-select)
    if (!wasSelected) {
        rects.forEach(r => r.classList.remove('selected'));
    }
    
    rect.classList.toggle('selected', !wasSelected);
    
    // Visual ripple effect
    createRipple(rect, e.clientX, e.clientY);
    
    // Fire selection callback
    if (this.options.onZoneSelected) {
        this.options.onZoneSelected(rect.id, !wasSelected);
    }
});
```

**CSS:**
```css
/* Verwijder :hover dependency */
.layer-bodyshots rect:hover { /* DELETE */ }

/* Vervang door explicit selected state */
.layer-bodyshots rect.selected {
    fill: oklch(var(--p) / 0.6);
    stroke: oklch(var(--p));
    stroke-width: 3;
}

/* Touch ripple effect */
@keyframes ripple {
    0% { 
        transform: scale(0);
        opacity: 1;
    }
    100% { 
        transform: scale(4);
        opacity: 0;
    }
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background: oklch(var(--p) / 0.3);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
}
```

#### 2.3 CSS touch-action Systematic Application

**Bestand:** `global.css` (of dedicated `touch.css`)

```css
/* =================================================================
   TOUCH ACTION DECLARATIONS
   ================================================================= */

/* Prevent double-tap zoom on all buttons */
button,
[role="button"],
.btn {
    touch-action: manipulation;
}

/* Drag zones - prevent all default touch behaviors */
.scene-card[draggable],
.unscheduled-scene-card,
.timeline-scene-card {
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
}

/* Scroll containers - allow only vertical scroll */
.unscheduled-scenes-list,
.calendar-scroll-container {
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch; /* iOS momentum */
}

/* Horizontal scroll containers */
.timeline-container,
.minimap-container {
    touch-action: pan-x;
    -webkit-overflow-scrolling: touch;
}

/* Actor silhouette - prevent zoom/pan (we handle touch) */
.actor-silhouette {
    touch-action: none;
}

/* Dropdown menus - allow scroll inside, prevent outside */
.dropdown-content,
.scene-selector-dropdown {
    touch-action: pan-y;
}
```

### FASE 3: Responsive & Device-Aware

#### 3.1 iPad-Specific Optimizations

**Detectie:**
```javascript
// utils/deviceDetection.js
export const isIPad = () => {
    return (
        navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 ||
        /iPad/.test(navigator.userAgent)
    );
};

export const isMobile = () => {
    return /iPhone|Android/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const supportsTouch = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
```

**Adaptieve UI:**
```javascript
// Grotere targets op touch devices
if (supportsTouch()) {
    document.body.classList.add('touch-device');
}
```

```css
/* Touch-specific overrides */
.touch-device .btn-sm {
    min-height: 3rem; /* 48px minimum */
    min-width: 3rem;
}

.touch-device .scene-card {
    padding: 1rem; /* Grotere touch area */
}
```

#### 3.2 Virtual Keyboard Handling

**Probleem:** Keyboard pushes UI up, breaks fixed positioning

**Oplossing:**
```javascript
// Detect keyboard open/close
window.visualViewport?.addEventListener('resize', () => {
    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    
    if (keyboardHeight > 100) {
        // Keyboard is open
        document.body.classList.add('keyboard-visible');
        document.body.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
        // Keyboard is closed
        document.body.classList.remove('keyboard-visible');
    }
});
```

```css
/* Adjust bottom-fixed elements */
.keyboard-visible .bottom-nav {
    bottom: var(--keyboard-height, 0);
    transition: bottom 0.3s ease;
}
```

#### 3.3 Orientation Change Handling

```javascript
window.addEventListener('orientationchange', () => {
    // Re-render calendar, recalculate layouts
    setTimeout(() => {
        if (typeof calendar !== 'undefined' && calendar?.render) {
            calendar.render();
        }
        
        // Recalculate timeline widths
        if (typeof renderTimeline === 'function') {
            renderTimeline();
        }
    }, 200); // Small delay for browser to update dimensions
});
```

### FASE 4: Validation & Testing

#### 4.1 Touch Interaction Checklist

**Drag-and-Drop:**
- [ ] Timeline scene reordering (SortableJS)
- [ ] Calendar unscheduled → calendar (pointer-based)
- [ ] Timeline manual scroll (pointer-based)
- [ ] Minimap viewport drag (pointer-based)
- [ ] Drag-to-scroll horizontale containers (DragScroll)

**Touch Targets:**
- [ ] Alle buttons ≥ 44x44px
- [ ] Actor zones ≥ 44x44px
- [ ] Dropdown triggers ≥ 44x44px
- [ ] Icon pickers ≥ 44x44px

**Visual Feedback:**
- [ ] Touch ripple op actor zones
- [ ] Active states zonder hover
- [ ] Drag ghost/preview werkt op touch
- [ ] Selected states duidelijk zichtbaar

**Scroll & Pan:**
- [ ] Vertic

ale scroll werkt (niet geblokkeerd door drag)
- [ ] Horizontale scroll werkt (timeline)
- [ ] Pinch-to-zoom disabled waar niet gewenst
- [ ] Momentum scrolling werkt (iOS)

**Device-Specific:**
- [ ] iPad Safari: alle features werken
- [ ] iPhone Safari: responsive layout correct
- [ ] Android Chrome: geen quirks
- [ ] Virtual keyboard: UI blijft bruikbaar
- [ ] Orientation change: geen layout breaks

#### 4.2 Test Devices & Browsers

**Minimum:**
- iPad Pro 12.9" (Safari, latest iPadOS)
- iPad Air (Safari)
- iPhone 14 Pro (Safari)
- Samsung Galaxy Tab (Chrome)
- Google Pixel 7 (Chrome)

**Desktop (regression):**
- Chrome (Windows/Mac)
- Firefox (Windows/Mac)
- Safari (Mac)

#### 4.3 Performance Metrics

**Target:**
- Pointer events → visual feedback: <16ms (60fps)
- Drag start → ghost appear: <50ms
- Scroll momentum: smooth 60fps
- Orientation change → re-render: <300ms

---

## 📦 4. DELIVERABLES PER FASE

### Fase 1 (Critical Path)
1. ✅ `utils/pointerInput.js` (nieuwe utility)
2. ✅ `ui/dragScroll.js` (refactored)
3. ✅ `timeline.js` manual scroll section (refactored)
4. ✅ `calendar-toastui.js` drag-drop (refactored)
5. ✅ `calendarAnimations.js` pointer support (refactored)

### Fase 2 (Touch-Optimized UI)
1. ✅ CSS `touch.css` (nieuwe file)
2. ✅ `actors.js` hover replacement (refactored)
3. ✅ Target size audit + fixes (all buttons/links)
4. ✅ Ripple effect component

### Fase 3 (Device-Aware)
1. ✅ `utils/deviceDetection.js` (nieuwe utility)
2. ✅ Virtual keyboard handling
3. ✅ Orientation change handlers
4. ✅ iPad-specific CSS overrides

### Fase 4 (Validation)
1. ✅ Touch interaction checklist (completed)
2. ✅ Cross-device test report
3. ✅ Performance metrics log

---

## ⚠️ 5. RISKS & MITIGATIONS

### Risk 1: SortableJS touch compatibility
**Mitigation:** SortableJS heeft goede touch support. Verify in early test.

### Risk 2: Toast UI Calendar custom drag breaks calendar interaction
**Mitigation:** Use pointer capture carefully, release on drag end. Hit-test moet rekening houden met calendar's eigen elements.

### Risk 3: iOS Safari viewport quirks
**Mitigation:** Test vroeg en vaak op echte device. Use `visualViewport` API.

### Risk 4: Performance op oudere tablets
**Mitigation:** Use `will-change` CSS hint, minimize DOM manipulation tijdens drag.

### Risk 5: Regression op desktop
**Mitigation:** Pointer events zijn backwards compatible. Uitgebreide regression tests.

---

## 🎯 6. SUCCESS CRITERIA

**Functioneel:**
- ✅ Alle drag-drop features werken identiek op touch en mouse
- ✅ Geen hover-dependent critical interactions
- ✅ Scroll en drag conflicteren niet
- ✅ Virtual keyboard blokkeert geen UI

**Performance:**
- ✅ 60fps during drag operations
- ✅ <50ms response to touch input
- ✅ Geen jank tijdens orientation change

**UX:**
- ✅ Touch targets voldoen aan WCAG 2.1 AAA (44x44px)
- ✅ Visual feedback is immediate en duidelijk
- ✅ Interactions voelen "native" aan op tablet
- ✅ Desktop experience blijft onveranderd (geen degradation)

---

## 📚 7. REFERENCES

- [W3C Pointer Events Spec](https://www.w3.org/TR/pointerevents3/)
- [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [SortableJS Documentation](https://sortablejs.github.io/Sortable/)
- [WCAG 2.1 Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [iOS Safari Touch Best Practices](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/)

---

## 🚀 NEXT STEPS

1. **Review dit document** met stakeholders
2. **Prioritize Fase 1** (critical path) - start immediately
3. **Setup test devices** voor vroege validatie
4. **Create feature branch** `touch-refactor` from checkpoint
5. **Implement iteratively** - commit per component refactor

---

**Einde analyse - Klaar voor implementatie** 🎉
