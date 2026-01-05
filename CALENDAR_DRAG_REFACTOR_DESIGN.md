# Calendar Drag-Drop Refactor - Design Document

## Huidige Situatie

### HTML5 Drag API (moet vervangen worden)
```javascript
// card.draggable = true
// dragstart/dragend events
// dragover/drop document-level events
```

**Problemen:**
1. Geen betrouwbare touch support in Safari iOS
2. Android touch support is inconsistent  
3. Geen controle over ghost element appearance
4. dataTransfer API is complex en fragiel

## Nieuwe Architectuur: Pointer-Based Drag-Drop

### Ontwerp Principes

1. **Gebruik PointerInput utility** voor unified event handling
2. **Custom ghost element** voor visual feedback (werkt op touch + mouse)
3. **Explicit drop target detection** via `document.elementFromPoint()`
4. **State machine** voor drag lifecycle
5. **Geen HTML5 Drag API** dependencies

### Componenten

#### 1. Drag State Manager
```javascript
const dragState = {
    isDragging: false,
    sceneId: null,
    sceneData: null,
    ghostElement: null,
    startX: 0,
    startY: 0,
    currentDropTarget: null
};
```

#### 2. Ghost Element
- Clone van originele scene card
- Positioned fixed, follows pointer
- Reduced opacity + shadow for "lifting" effect
- Auto-cleanup on drag end

#### 3. Drop Target Detection
- Use `document.elementFromPoint(x, y)` during move
- Find closest `.toastui-calendar-daygrid-cell`
- Highlight valid drop targets
- Show invalid state for non-shooting days

#### 4. Integration met Toast UI Calendar
- Trigger `beforeCreateEvent` programmatically
- Reuse existing scheduling logic
- Maintain compatibility met calendar API

## Implementatie Stappen

### Stap 1: Setup Pointer Input per Unscheduled Card

```javascript
function createUnscheduledSceneCard(scene) {
    const card = renderSceneCard(scene, { ... });
    
    // Remove HTML5 drag API
    // card.draggable = true; // DELETE
    
    // Add pointer-based drag
    const pointer = new PointerInput(card, {
        threshold: 5, // Touch-friendly threshold
        onStart: (data) => handleDragStart(card, scene, data),
        onMove: (data) => handleDragMove(data),
        onEnd: (data) => handleDragEnd(data)
    });
    
    pointer.enable();
    card._pointerInput = pointer; // Store for cleanup
    
    return card;
}
```

### Stap 2: Drag Start Handler

```javascript
function handleDragStart(card, scene, data) {
    console.log('🎯 Drag started:', scene.scene_number);
    
    // Update state
    dragState.isDragging = true;
    dragState.sceneId = scene.id;
    dragState.sceneData = scene;
    dragState.startX = data.x;
    dragState.startY = data.y;
    
    // Create ghost element
    dragState.ghostElement = createGhostElement(card, data.x, data.y);
    document.body.appendChild(dragState.ghostElement);
    
    // Hide original (semi-transparent)
    card.style.opacity = '0.4';
    card.style.pointerEvents = 'none';
}
```

### Stap 3: Ghost Element Creation

```javascript
function createGhostElement(sourceCard, x, y) {
    const ghost = sourceCard.cloneNode(true);
    
    ghost.style.position = 'fixed';
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
    ghost.style.transform = 'translate(-50%, -50%)';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.8';
    ghost.style.zIndex = '9999';
    ghost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    ghost.style.transition = 'none';
    ghost.classList.add('dragging-ghost');
    
    // Remove any event listeners from clone
    const newGhost = ghost.cloneNode(true);
    return newGhost;
}
```

### Stap 4: Drag Move Handler

```javascript
function handleDragMove(data) {
    if (!dragState.isDragging || !dragState.ghostElement) return;
    
    // Update ghost position
    dragState.ghostElement.style.left = `${data.x}px`;
    dragState.ghostElement.style.top = `${data.y}px`;
    
    // Detect drop target
    const element = document.elementFromPoint(data.x, data.y);
    const cell = element?.closest('.toastui-calendar-daygrid-cell');
    
    // Update drop target highlighting
    if (cell !== dragState.currentDropTarget) {
        // Clear previous highlight
        if (dragState.currentDropTarget) {
            dragState.currentDropTarget.classList.remove('drop-target-valid', 'drop-target-invalid');
        }
        
        // Highlight new target
        if (cell) {
            const date = getCellDate(cell);
            const isValid = !isNonShootingDay(date) && isCurrentMonth(date);
            cell.classList.add(isValid ? 'drop-target-valid' : 'drop-target-invalid');
        }
        
        dragState.currentDropTarget = cell;
    }
}
```

### Stap 5: Drag End Handler

```javascript
async function handleDragEnd(data) {
    if (!dragState.isDragging) return;
    
    console.log('🎯 Drag ended');
    
    // Find drop target
    const element = document.elementFromPoint(data.x, data.y);
    const cell = element?.closest('.toastui-calendar-daygrid-cell');
    
    if (cell) {
        const date = getCellDate(cell);
        
        // Check validity
        if (isNonShootingDay(date)) {
            alert('Cannot schedule on non-shooting days');
        } else if (!isCurrentMonth(date)) {
            // Navigate to that month
            calendar.setDate(new Date(date));
            updateCalendarTitle();
        } else {
            // Schedule the scene
            await scheduleScene(dragState.sceneId, date);
        }
    }
    
    // Cleanup
    cleanupDrag();
}
```

### Stap 6: Cleanup Function

```javascript
function cleanupDrag() {
    // Remove ghost
    if (dragState.ghostElement) {
        dragState.ghostElement.remove();
        dragState.ghostElement = null;
    }
    
    // Restore original card
    const card = document.querySelector(`[data-scene-id="${dragState.sceneId}"]`);
    if (card) {
        card.style.opacity = '';
        card.style.pointerEvents = '';
    }
    
    // Clear drop target highlight
    if (dragState.currentDropTarget) {
        dragState.currentDropTarget.classList.remove('drop-target-valid', 'drop-target-invalid');
    }
    
    // Reset state
    dragState.isDragging = false;
    dragState.sceneId = null;
    dragState.sceneData = null;
    dragState.currentDropTarget = null;
}
```

### Stap 7: Helper Functions

```javascript
function getCellDate(cell) {
    // Extract date from cell using same logic as current implementation
    const dayCells = document.querySelectorAll('.toastui-calendar-daygrid-cell');
    const cellIndex = Array.from(dayCells).indexOf(cell);
    
    const currentDate = calendar.getDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysFromPrevMonth = (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1);
    const gridStartDate = new Date(currentYear, currentMonth, 1 - daysFromPrevMonth);
    
    const cellDate = new Date(gridStartDate);
    cellDate.setDate(gridStartDate.getDate() + cellIndex);
    
    const year = cellDate.getFullYear();
    const month = cellDate.getMonth();
    const day = cellDate.getDate();
    
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isCurrentMonth(dateStr) {
    const cellDate = new Date(dateStr);
    const currentDate = calendar.getDate();
    return cellDate.getMonth() === currentDate.getMonth() &&
           cellDate.getFullYear() === currentDate.getFullYear();
}
```

## CSS Changes

```css
/* Ghost element during drag */
.dragging-ghost {
    cursor: grabbing !important;
    rotate: 2deg;
}

/* Drop target highlighting */
.drop-target-valid {
    background: oklch(var(--su) / 0.1) !important;
    outline: 2px solid oklch(var(--su));
    outline-offset: -2px;
}

.drop-target-invalid {
    background: oklch(var(--er) / 0.1) !important;
    outline: 2px dashed oklch(var(--er));
    outline-offset: -2px;
}

/* Source card while dragging */
.unscheduled-scene-card {
    transition: opacity 0.2s ease;
}
```

## Verwijderen

1. ✅ `card.draggable = true`
2. ✅ `dragstart` event listener
3. ✅ `dragend` event listener
4. ✅ Document `dragover` listener
5. ✅ Document `drop` listener
6. ✅ `setupCalendarDropZone()` function (vervangen door nieuwe implementatie)

## Testing Checklist

- [ ] Desktop mouse drag works
- [ ] iPad touch drag works
- [ ] iPhone touch drag works
- [ ] Ghost element follows pointer smoothly
- [ ] Drop target highlights correctly
- [ ] Invalid targets show error state
- [ ] Non-shooting day check works
- [ ] Cross-month navigation works
- [ ] Multi-day scene placement works
- [ ] No memory leaks (ghost cleanup)
- [ ] Scene card restores after failed drag
- [ ] Console logs are helpful for debugging

## Risks & Mitigaties

**Risk:** Ghost element performance on older devices
**Mitigatie:** Use `will-change: transform` on ghost, cleanup immediately on drop

**Risk:** Drop target detection fails on complex DOM
**Mitigatie:** Use multiple fallback selectors, log warnings

**Risk:** Touch scroll conflicts with drag
**Mitigatie:** `touch-action: none` on cards, threshold = 5px

**Risk:** Regression on desktop
**Mitigatie:** Pointer events zijn backwards compatible, thorough testing

## Geschatte Implementatie Tijd

- Refactor code: 2-3 uur (zorgvuldig)
- Testing & debugging: 1-2 uur
- Edge cases: 1 uur
- **Totaal: 4-6 uur** (doordacht en getest)

---

**Start: Nu doordacht implementeren, stap voor stap**
