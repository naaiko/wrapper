# Design System & UI Patterns

## Universal Navigation Pattern

### Overview
All screens in the application use a **consistent dual-navigation system**:
- **Top-right navigation** (fixed position) for screen switching
- **Bottom dock** (fixed position) for screen-specific actions

**Important**: NO full-width navbars. This keeps the interface clean and maximizes content space.

### Top-Right Navigation

Fixed navigation in the top-right corner of every screen.

```html
<!-- Top-right navigation - UNIVERSAL PATTERN -->
<div class="fixed top-4 right-4 z-50 flex items-center gap-2">
    <!-- Home button -->
    <a href="projects.html" class="btn btn-circle btn-ghost" title="Home">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    </a>
    
    <!-- Other navigation buttons (Calendar, Timeline, etc.) -->
    <a href="calendar.html?project={projectId}" class="btn btn-circle btn-ghost" title="Calendar">
        <!-- Calendar icon -->
    </a>
    
    <!-- Current screen indicator (optional, shows active state) -->
    <button class="btn btn-circle btn-primary" title="Cast Grid">
        <!-- Active screen icon -->
    </button>
</div>
```

**Key Points**:
- Fixed position: `fixed top-4 right-4 z-50`
- Circular buttons: `btn-circle`
- Active screen uses `btn-primary`, others use `btn-ghost`
- All icons are 5x5: `h-5 w-5`
- Consistent gap: `gap-2`

### Bottom Dock

Fixed action bar at the bottom of every screen for screen-specific controls.

```html
<!-- Bottom dock - UNIVERSAL PATTERN -->
<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
    <div class="bg-base-100 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4">
        
        <!-- Example: Search input -->
        <input 
            type="text" 
            placeholder="Search..." 
            class="input input-sm input-bordered w-64"
        >
        
        <!-- Divider -->
        <div class="divider divider-horizontal mx-0"></div>
        
        <!-- Secondary action buttons -->
        <button class="btn btn-sm bg-base-300/50 hover:bg-base-300 border-none">
            <svg><!-- Icon --></svg>
            Label
        </button>
        
        <!-- Clear button (circle) -->
        <button class="btn btn-sm btn-circle bg-base-300/50 hover:bg-base-300 border-none">
            <svg><!-- X icon --></svg>
        </button>
        
        <!-- Divider -->
        <div class="divider divider-horizontal mx-0"></div>
        
        <!-- Primary action button (Add, Create, etc.) -->
        <button class="btn btn-sm btn-primary btn-circle">
            <svg stroke-width="2.5"><!-- Plus icon --></svg>
        </button>
    </div>
</div>
```

**Key Points**:
- Fixed position: `fixed bottom-4 left-1/2 -translate-x-1/2 z-40`
- Container styling: `bg-base-100 shadow-2xl rounded-2xl px-6 py-3`
- Flexbox layout: `flex items-center gap-4`
- **Secondary buttons**: `bg-base-300/50 hover:bg-base-300 border-none`
- **Primary action**: `btn-primary btn-circle` (icon only, no text)
- Dividers between sections: `divider divider-horizontal mx-0`
- Plus icon stroke width: `stroke-width="2.5"` for better visibility

### Page Padding

Since navigation is fixed, content needs appropriate padding:

```html
<div class="min-h-screen bg-base-200 pt-4 pb-24 px-8">
    <!-- pt-4: Top padding (no navbar, just small gap) -->
    <!-- pb-24: Bottom padding to clear dock -->
    <!-- px-8: Horizontal padding -->
</div>
```

## Button Styling Patterns

### Primary Action Buttons
Used for main actions (Add, Create, Save):

```html
<button class="btn btn-primary btn-circle">
    <svg stroke-width="2.5"><!-- Icon --></svg>
</button>
```

- Always circular: `btn-circle`
- Icon only (no text in dock)
- Stroke width 2.5 for plus icons
- DaisyUI primary color (green by default)

### Secondary Action Buttons
Used for filters, sort, auxiliary actions:

```html
<button class="btn btn-sm bg-base-300/50 hover:bg-base-300 border-none">
    <svg><!-- Icon --></svg>
    Label
</button>
```

- Background: `bg-base-300/50` (50% opacity)
- Hover: `hover:bg-base-300` (100% opacity)
- No border: `border-none`
- Small size: `btn-sm`

### Clear/Close Buttons
Circular buttons for clear, delete, close actions:

```html
<button class="btn btn-sm btn-circle bg-base-300/50 hover:bg-base-300 border-none">
    <svg><!-- X icon --></svg>
</button>
```

- Same styling as secondary but circular
- Icon only

### Ghost Buttons
Used in top-right navigation:

```html
<button class="btn btn-circle btn-ghost">
    <svg class="h-5 w-5"><!-- Icon --></svg>
</button>
```

- Transparent background
- Subtle hover effect
- Always circular for navigation

## Card Patterns

### Actor Cards
Square cards (1:1 aspect ratio) for better density:

```javascript
// In ActorCard component
figure.className = 'aspect-square bg-base-300 overflow-hidden';
```

**CSS Grid**:
```css
.cast-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}
```

### Add Placeholder Cards
Dashed border cards for adding new items (actors, scenes):

```html
<div class="add-actor-placeholder">
    <div class="add-actor-placeholder__fill"></div>
    <div class="add-actor-placeholder__icon">+</div>
</div>
```

**CSS**:
```css
.add-actor-placeholder {
    aspect-ratio: 1 / 1;
    min-height: 250px;
    border: 3px dashed oklch(var(--a) / 0.3); /* Accent color */
    border-radius: 1rem;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease-in-out;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
}

.add-actor-placeholder__icon {
    font-size: 4rem;
    color: oklch(var(--a) / 0.3);
    transition: all 0.25s ease-in-out;
    position: relative;
    z-index: 2;
}

.add-actor-placeholder__fill {
    position: absolute;
    inset: 0;
    background: oklch(var(--a) / 0);
    transition: background 0.25s ease-in-out;
    z-index: 1;
}

.add-actor-placeholder:hover {
    border-color: oklch(var(--a) / 0.75);
    filter: drop-shadow(0 0 10px oklch(var(--a) / 0.3));
    transform: scale(1.05);
}

.add-actor-placeholder:hover .add-actor-placeholder__icon {
    color: oklch(var(--a) / 0.75);
    transform: scale(1.1);
}

.add-actor-placeholder:hover .add-actor-placeholder__fill {
    background: oklch(var(--a) / 0.15);
}
```

**Key Points**:
- Use accent color (`--a`) from DaisyUI palette
- Dashed border at 30% opacity
- Hover effect: darker border, glow, scale up
- Background fill fades in on hover
- Icon scales up on hover
- Same aspect ratio as regular cards

## Color System

### DaisyUI OKLCH Colors
All colors use OKLCH format for better color accuracy:

- **Primary** (`--p`): Main action color (green-blue by default)
- **Secondary** (`--s`): Secondary elements
- **Accent** (`--a`): Highlights and accents (used for dashed borders)
- **Base-100** (`--b1`): Background color
- **Base-200** (`--b2`): Slightly darker background
- **Base-300** (`--b3`): Even darker (used for buttons)
- **Base-Content** (`--bc`): Text color

### Opacity Levels
Standard opacity levels for consistency:

- `0.1` - Very subtle (10%)
- `0.15` - Subtle (15%)
- `0.3` - Light (30%)
- `0.5` - Medium (50%)
- `0.75` - Strong (75%)
- `1.0` - Full opacity (100%)

### Usage Examples

```css
/* Primary color with 30% opacity */
background: oklch(var(--p) / 0.3);

/* Accent color with 75% opacity */
border-color: oklch(var(--a) / 0.75);

/* Base-300 with 50% opacity for secondary buttons */
background: oklch(var(--b3) / 0.5);
```

## Animation & Transitions

### Standard Transition Duration
```css
transition: all 0.25s ease-in-out;
```

### Hover Scale Effects
```css
/* Cards */
.actor-card:hover {
    transform: scale(1.05);
}

/* Placeholder cards */
.add-actor-placeholder:hover {
    transform: scale(1.05);
}

/* Icons inside placeholders */
.add-actor-placeholder:hover .add-actor-placeholder__icon {
    transform: scale(1.1);
}
```

### Shadow Effects
```css
/* Dock shadow */
shadow-2xl

/* Card shadow */
shadow-xl

/* Hover shadow */
hover:shadow-2xl

/* Glow effect on hover */
filter: drop-shadow(0 0 10px oklch(var(--a) / 0.3));
```

## Implementation Checklist

When adding a new screen, ensure:

- [ ] Top-right navigation implemented
  - [ ] Fixed position: `fixed top-4 right-4 z-50`
  - [ ] Circular buttons with `btn-circle`
  - [ ] Active screen uses `btn-primary`
  - [ ] 5x5 icons

- [ ] Bottom dock implemented
  - [ ] Fixed position: `fixed bottom-4 left-1/2 -translate-x-1/2 z-40`
  - [ ] Container: `bg-base-100 shadow-2xl rounded-2xl px-6 py-3`
  - [ ] Secondary buttons: `bg-base-300/50 hover:bg-base-300 border-none`
  - [ ] Primary action: `btn-primary btn-circle` (icon only)
  - [ ] Dividers between sections

- [ ] Page padding
  - [ ] Top: `pt-4` (no navbar padding needed)
  - [ ] Bottom: `pb-24` (clear dock)
  - [ ] Horizontal: `px-8`

- [ ] NO full-width navbar
- [ ] NO standalone FAB buttons (use dock instead)

## Code Examples

### Complete Screen Template

```html
<!DOCTYPE html>
<html lang="en" data-theme="cupcake">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screen Name - Continuity Manager</title>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/screen-name.css">
</head>
<body class="font-sans">
    <!-- Main Content -->
    <div class="min-h-screen bg-base-200 pt-4 pb-24 px-8">
        <!-- Top-right navigation -->
        <div class="fixed top-4 right-4 z-50 flex items-center gap-2">
            <a href="projects.html" class="btn btn-circle btn-ghost" title="Home">
                <!-- Home icon -->
            </a>
            <a href="calendar.html?project={projectId}" class="btn btn-circle btn-ghost" title="Calendar">
                <!-- Calendar icon -->
            </a>
            <button class="btn btn-circle btn-primary" title="Current Screen">
                <!-- Active icon -->
            </button>
        </div>
        
        <!-- Your content here -->
        <div class="container mx-auto">
            <!-- Screen content -->
        </div>
    </div>
    
    <!-- Bottom dock -->
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div class="bg-base-100 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4">
            <!-- Screen-specific controls -->
            <button class="btn btn-sm bg-base-300/50 hover:bg-base-300 border-none">
                Action
            </button>
            
            <div class="divider divider-horizontal mx-0"></div>
            
            <button class="btn btn-sm btn-primary btn-circle">
                <svg stroke-width="2.5"><!-- Plus --></svg>
            </button>
        </div>
    </div>
    
    <script type="module" src="js/screen-name.js"></script>
</body>
</html>
```

### Reusable Dock Component (JavaScript)

```javascript
export class Dock {
    static create(options = {}) {
        const {
            actions = [],
            primaryAction = null
        } = options;
        
        const dock = document.createElement('div');
        dock.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-40';
        
        const container = document.createElement('div');
        container.className = 'bg-base-100 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4';
        
        // Add actions
        actions.forEach((action, index) => {
            if (index > 0) {
                // Add divider
                const divider = document.createElement('div');
                divider.className = 'divider divider-horizontal mx-0';
                container.appendChild(divider);
            }
            
            if (typeof action === 'string') {
                // HTML string
                container.insertAdjacentHTML('beforeend', action);
            } else {
                // DOM element
                container.appendChild(action);
            }
        });
        
        // Add primary action
        if (primaryAction) {
            const divider = document.createElement('div');
            divider.className = 'divider divider-horizontal mx-0';
            container.appendChild(divider);
            
            container.appendChild(primaryAction);
        }
        
        dock.appendChild(container);
        return dock;
    }
}
```

**Usage**:
```javascript
import { Dock } from './components/dock.js';

const searchInput = `
    <input 
        type="text" 
        id="searchInput"
        placeholder="Search..." 
        class="input input-sm input-bordered w-64"
    >
`;

const filterButton = `
    <button class="btn btn-sm bg-base-300/50 hover:bg-base-300 border-none">
        Filter
    </button>
`;

const addButton = `
    <button class="btn btn-sm btn-primary btn-circle" id="addBtn">
        <svg stroke-width="2.5"><!-- Plus icon --></svg>
    </button>
`;

const dock = Dock.create({
    actions: [searchInput, filterButton],
    primaryAction: addButton
});

document.body.appendChild(dock);
```

## Best Practices

1. **Consistency is Key**
   - Use the exact same navigation pattern on every screen
   - Don't deviate from button styling patterns
   - Maintain consistent spacing and sizing

2. **Accessibility**
   - Always include `title` attributes on icon-only buttons
   - Use semantic HTML elements
   - Ensure sufficient color contrast

3. **Performance**
   - Use `will-change` and `transform` for animations
   - Lazy load images with `loading="lazy"`
   - Keep animations under 300ms

4. **Responsive Design**
   - Test on mobile devices
   - Use touch-friendly button sizes (min 44px)
   - Adjust dock layout for smaller screens if needed

5. **DaisyUI Integration**
   - Leverage DaisyUI components (`btn`, `card`, `badge`)
   - Use DaisyUI color variables (`oklch(var(--p))`)
   - Follow DaisyUI naming conventions

## Migration Guide

### Converting Old Navbar to New Pattern

**Before** (OLD - Don't use):
```html
<div class="navbar bg-base-100">
    <div class="flex-1">
        <a class="btn btn-ghost text-xl">Screen Name</a>
    </div>
    <div class="flex-none">
        <button class="btn btn-primary">Add</button>
    </div>
</div>
```

**After** (NEW - Use this):
```html
<!-- Top-right navigation -->
<div class="fixed top-4 right-4 z-50 flex items-center gap-2">
    <a href="projects.html" class="btn btn-circle btn-ghost" title="Home">
        <!-- Icon -->
    </a>
</div>

<!-- Bottom dock -->
<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
    <div class="bg-base-100 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4">
        <button class="btn btn-sm btn-primary btn-circle">
            <svg stroke-width="2.5"><!-- Plus --></svg>
        </button>
    </div>
</div>
```

**Page padding changes**:
- Remove: `pt-20` (navbar height)
- Add: `pt-4` (small top gap)
- Keep: `pb-24` (dock clearance)

### Converting Standalone FAB to Dock

**Before** (OLD):
```html
<button class="btn btn-circle btn-primary fixed bottom-8 right-8 shadow-xl">
    <svg><!-- Plus --></svg>
</button>
```

**After** (NEW):
```html
<!-- In dock -->
<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
    <div class="bg-base-100 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4">
        <!-- Other controls... -->
        <div class="divider divider-horizontal mx-0"></div>
        <button class="btn btn-sm btn-primary btn-circle">
            <svg stroke-width="2.5"><!-- Plus --></svg>
        </button>
    </div>
</div>
```

## Related Documentation

- [DaisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OKLCH Color Format](https://oklch.com/)

---

**Last Updated**: v0.2.1  
**Status**: ✅ Active Design System
