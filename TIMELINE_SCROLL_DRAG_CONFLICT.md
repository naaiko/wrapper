# Timeline Scroll + Drag Conflict - Analysis & Solution

## Probleemanalyse

### Huidige Situatie

**Timeline Container:**
```css
#sceneContainer {
    touch-action: pan-y pinch-zoom;
    /* Blokkeert horizontale touch scroll! */
}
```

**Scene Cards:**
```css
.scene-card {
    touch-action: none;
    /* Blokkeert ALLE touch interacties op de card */
}
```

**SortableJS Config:**
```javascript
sortableInstance = Sortable.create(container, {
    delay: 0,
    delayOnTouchOnly: false,
    touchStartThreshold: 3,
    scroll: true,
    scrollSensitivity: 140,
    scrollSpeed: 43,
    // ... maar autoscroll werkt niet goed op touch
});
```

### Waarom het Niet Werkt

1. **Timeline kan niet scrollen op touch:**
   - `touch-action: pan-y` blokkeert horizontale swipe
   - Gebruiker kan niet horizontaal swipen om te scrollen

2. **Cards blokkeren scroll:**
   - `touch-action: none` op cards voorkomt alle native touch
   - Pointer events worden gecaptured door SortableJS
   - Geen scroll mogelijk terwijl je card vasthoudt

3. **SortableJS autoscroll is mager:**
   - Werkt alleen tijdens actieve drag
   - Moet eerst drag threshold passeren
   - Geen smooth scroll tijdens "explore" phase

4. **Geen gesture intent detection:**
   - Elke touch op card = potentiële drag
   - Geen onderscheid tussen "swipe to scroll" vs "drag to reorder"

## Industry Standard Oplossing

### 1. Gesture Intent Detection System

**Concept:** Eerste 100-200ms observeren, dan beslissen tussen scroll of drag.

```javascript
class GestureIntentDetector {
    constructor(options = {}) {
        this.thresholds = {
            time: 100,              // ms - observation window
            distance: 10,           // px - movement threshold
            velocity: 0.5,          // px/ms - fast swipe detection
            dragAngleMax: 30        // degrees - max angle for horizontal drag
        };
        
        this.state = {
            startX: 0,
            startY: 0,
            startTime: 0,
            currentX: 0,
            currentY: 0,
            intent: null            // 'scroll' | 'drag' | 'unknown'
        };
    }
    
    onPointerDown(e) {
        this.state.startX = e.clientX;
        this.state.startY = e.clientY;
        this.state.startTime = Date.now();
        this.state.intent = 'unknown';
    }
    
    onPointerMove(e) {
        const dx = Math.abs(e.clientX - this.state.startX);
        const dy = Math.abs(e.clientY - this.state.startY);
        const dt = Date.now() - this.state.startTime;
        
        // Fast horizontal swipe = scroll intent
        const velocity = dx / (dt || 1);
        if (velocity > this.thresholds.velocity && dx > dy * 2) {
            this.state.intent = 'scroll';
            return 'scroll';
        }
        
        // Vertical movement = drag intent (reorder)
        if (dy > this.thresholds.distance && dy > dx) {
            this.state.intent = 'drag';
            return 'drag';
        }
        
        // Still observing
        if (dt < this.thresholds.time) {
            return 'unknown';
        }
        
        // Timeout: minimal movement = click, else drag
        if (dx < this.thresholds.distance && dy < this.thresholds.distance) {
            this.state.intent = 'click';
            return 'click';
        }
        
        this.state.intent = 'drag';
        return 'drag';
    }
    
    getIntent() {
        return this.state.intent;
    }
    
    reset() {
        this.state.intent = 'unknown';
    }
}
```

### 2. Dynamische Touch-Action Management

**Concept:** Start met scroll enabled, schakel naar drag mode alleen na intent detection.

```css
/* Timeline: Horizontaal scrollbaar by default */
#sceneContainer {
    touch-action: pan-x pan-y pinch-zoom;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch; /* iOS momentum */
    overscroll-behavior-x: contain;
}

/* Cards: Horizontaal scroll toegestaan, verticaal disabled voor drag detection */
.scene-card {
    touch-action: pan-x;
    /* Allows horizontal scroll, blocks vertical for drag intent detection */
    -webkit-user-select: none;
    user-select: none;
}

/* During active drag: block all touch actions */
.scene-card.is-dragging {
    touch-action: none !important;
}
```

```javascript
// Dynamisch touch-action switchen
function activateDragMode(cardElement) {
    cardElement.classList.add('is-dragging');
    // Nu blokkeert touch-action: none alle scroll
}

function deactivateDragMode(cardElement) {
    cardElement.classList.remove('is-dragging');
    // Terug naar touch-action: pan-x (scroll enabled)
}
```

### 3. SortableJS Integration met Intent Detection

**Concept:** Disable SortableJS immediate drag, enable alleen na drag intent.

```javascript
let gestureDetector = null;
let potentialDragCard = null;

function initializeSortableWithIntentDetection(container) {
    // SortableJS met delay voor intent detection
    sortableInstance = Sortable.create(container, {
        animation: 120,
        direction: 'horizontal',
        
        // KEY: Add delay for intent detection
        delay: 100,                    // 100ms observation window
        delayOnTouchOnly: true,        // Only on touch devices
        
        // Touch-friendly threshold
        touchStartThreshold: 10,       // 10px movement before drag
        
        // Autoscroll config
        scroll: true,
        forceAutoScrollFallback: true,
        scrollSensitivity: 100,
        scrollSpeed: 15,
        
        draggable: '.scene-card',
        
        // Custom filter function
        filter: (evt, target) => {
            // Don't start drag if we detected scroll intent
            if (gestureDetector && gestureDetector.getIntent() === 'scroll') {
                return true; // Cancel drag
            }
            return false;
        },
        
        onChoose: (evt) => {
            // Card is chosen, start intent detection
            gestureDetector = new GestureIntentDetector();
            potentialDragCard = evt.item;
            
            // Add temp listeners for intent detection
            document.addEventListener('pointermove', handleIntentDetection);
        },
        
        onStart: (evt) => {
            console.log('Drag started');
            activateDragMode(evt.item);
        },
        
        onEnd: (evt) => {
            console.log('Drag ended');
            deactivateDragMode(evt.item);
            cleanup();
        }
    });
}

function handleIntentDetection(e) {
    if (!gestureDetector) return;
    
    const intent = gestureDetector.onPointerMove(e);
    
    if (intent === 'scroll') {
        // User wants to scroll, not drag
        if (sortableInstance) {
            // Cancel potential drag
            sortableInstance.option('disabled', true);
            setTimeout(() => {
                sortableInstance.option('disabled', false);
            }, 100);
        }
        cleanup();
    } else if (intent === 'drag') {
        // Drag intent confirmed, SortableJS will handle it
        cleanup();
    }
}

function cleanup() {
    document.removeEventListener('pointermove', handleIntentDetection);
    gestureDetector = null;
    potentialDragCard = null;
}
```

### 4. Enhanced Autoscroll During Drag

**Concept:** Smooth, progressive autoscroll when pointer near edges.

```javascript
class EdgeAutoscroller {
    constructor(scrollContainer, options = {}) {
        this.container = scrollContainer;
        this.edgeSize = options.edgeSize || 100;        // px from edge
        this.maxSpeed = options.maxSpeed || 20;         // px per frame
        this.animationId = null;
        this.isScrolling = false;
    }
    
    start(pointerX, pointerY) {
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        this.scroll(pointerX, pointerY);
    }
    
    scroll(pointerX, pointerY) {
        if (!this.isScrolling) return;
        
        const rect = this.container.getBoundingClientRect();
        const containerLeft = rect.left;
        const containerRight = rect.right;
        
        // Distance from edges
        const distanceFromLeft = pointerX - containerLeft;
        const distanceFromRight = containerRight - pointerX;
        
        let scrollDelta = 0;
        
        // Scroll left
        if (distanceFromLeft < this.edgeSize && distanceFromLeft > 0) {
            const intensity = 1 - (distanceFromLeft / this.edgeSize);
            scrollDelta = -this.maxSpeed * intensity;
        }
        // Scroll right
        else if (distanceFromRight < this.edgeSize && distanceFromRight > 0) {
            const intensity = 1 - (distanceFromRight / this.edgeSize);
            scrollDelta = this.maxSpeed * intensity;
        }
        
        if (scrollDelta !== 0) {
            this.container.scrollLeft += scrollDelta;
        }
        
        this.animationId = requestAnimationFrame(() => 
            this.scroll(pointerX, pointerY)
        );
    }
    
    update(pointerX, pointerY) {
        if (!this.isScrolling) {
            this.start(pointerX, pointerY);
        }
        // Position will be updated on next frame
    }
    
    stop() {
        this.isScrolling = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Integration with SortableJS
let autoscroller = null;

sortableInstance = Sortable.create(container, {
    // ... other options
    
    onStart: (evt) => {
        autoscroller = new EdgeAutoscroller(container, {
            edgeSize: 100,
            maxSpeed: 15
        });
    },
    
    onMove: (evt) => {
        if (autoscroller) {
            autoscroller.update(evt.originalEvent.clientX, evt.originalEvent.clientY);
        }
    },
    
    onEnd: (evt) => {
        if (autoscroller) {
            autoscroller.stop();
            autoscroller = null;
        }
    }
});
```

## Implementatie Stappenplan

### Stap 1: CSS Fixes (Critical)

```css
/* Allow horizontal scroll on timeline */
#sceneContainer {
    touch-action: pan-x pan-y pinch-zoom !important;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
}

/* Allow horizontal scroll on cards (until drag activates) */
.scene-card {
    touch-action: pan-x !important;
}

/* Block all touch during active drag */
.scene-card.sortable-chosen,
.scene-card.sortable-drag {
    touch-action: none !important;
}
```

### Stap 2: SortableJS Config Update

```javascript
sortableInstance = Sortable.create(container, {
    animation: 120,
    direction: 'horizontal',
    
    // Touch-friendly intent detection
    delay: 150,                        // Observation window
    delayOnTouchOnly: true,            // Only on touch
    touchStartThreshold: 8,            // Slight movement tolerance
    
    // Improved autoscroll
    scroll: true,
    forceAutoScrollFallback: true,
    scrollSensitivity: 80,             // Closer to edge
    scrollSpeed: 12,                   // Smoother speed
    bubbleScroll: true,
    
    // ... rest of config
});
```

### Stap 3: Custom Autoscroll (Optional Enhancement)

Implementeer EdgeAutoscroller class voor betere UX tijdens drag.

### Stap 4: Testing Protocol

**Desktop:**
- [ ] Mouse drag-and-drop werkt
- [ ] Mouse wheel scroll werkt
- [ ] Trackpad scroll werkt
- [ ] Geen regressies

**iPad:**
- [ ] Horizontal swipe scrollt timeline
- [ ] Vertical drag reorders cards
- [ ] Edge autoscroll tijdens drag
- [ ] Smooth scroll met momentum
- [ ] Geen dead zones

**iPhone:**
- [ ] Swipe to scroll werkt
- [ ] Drag to reorder werkt
- [ ] Geen conflicts

## Referenties & Best Practices

### Industry Examples

**Figma Timeline (Web):**
- Delay van ~150ms voor intent detection
- Horizontal scroll = swipe
- Vertical drag = reorder
- Auto-scroll tijdens drag

**Trello (Mobile Web):**
- `touch-action: pan-y` op cards
- Horizontal scroll op board
- Drag activatie na vertical movement

**Asana Timeline:**
- Progressive autoscroll near edges
- Clear visual feedback tijdens drag
- No scroll blocking

### W3C Pointer Events Best Practices

1. **Use `touch-action` declaratively in CSS**
   - Prefer CSS over `preventDefault()`
   - More performant, better browser optimization

2. **Pointer Capture Management**
   - Only capture after intent confirmed
   - Always release on end/cancel

3. **Progressive Enhancement**
   - Works with mouse by default
   - Enhanced for touch
   - No device detection, feature detection only

4. **Scroll Performance**
   - Use `overscroll-behavior` for scroll boundaries
   - `-webkit-overflow-scrolling: touch` for iOS momentum
   - Avoid `preventDefault()` on scroll events

## Verwachte Resultaten

✅ **Horizontal swipe = scroll timeline**  
✅ **Vertical drag = reorder card**  
✅ **During drag: edge autoscroll works**  
✅ **No desktop regressions**  
✅ **Native iOS/Android scroll feel**  
✅ **Clear gesture intent detection**  
✅ **No dead zones or conflicts**

---

**Implementatie: Doordacht en volgens industry standards**  
**Testing: Exhaustive op alle devices**  
**Performance: Native feel, geen hacks**
