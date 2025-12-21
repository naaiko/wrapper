# Edit Screen Architectuur

## Overzicht

Het **Edit Screen** is een universeel UI-patroon voor de applicatie: een bottom sheet / slide-up panel dat als template en architecturale basis dient voor **alle** huidige en toekomstige edit screens.

Dit is geen ad-hoc oplossing, maar een **fundamenteel contract** tussen de UI en de gebruiker over hoe edit-functionaliteit werkt in deze applicatie.

---

## Kernprincipes

### 1. **Vaste Zonestructuur**

Elk edit screen heeft altijd dezelfde vier zones, in deze volgorde (van boven naar beneden):

```
┌─────────────────────────────────┐
│   [Handle] [Close Button]       │  ← Sluitzone
│   TITLE                          │  ← Header
├─────────────────────────────────┤
│                                  │
│   FORMULIER                      │  ← Formulierzone (scrollt)
│   (alle editvelden)              │
│                                  │
│   ↓ scroll ↓                     │
│                                  │
├─────────────────────────────────┤
│   CONTEXT                        │  ← Contextzone (altijd zichtbaar)
│   (preview/tip/waarschuwing)     │
├─────────────────────────────────┤
│   [Cancel]  [Save]               │  ← Actiezone (altijd zichtbaar)
└─────────────────────────────────┘
```

### 2. **Scroll-gedrag Contract**

Dit gedrag is **niet onderhandelbaar** en geldt voor alle edit screens:

- ✅ **Formulierzone**: mag scrollen (bevat alle editvelden)
- ❌ **Actiezone**: scrollt NOOIT weg (altijd beschikbaar)
- ❌ **Contextzone**: scrollt NOOIT weg (altijd zichtbaar)
- ❌ **Sluitzone**: scrollt NOOIT weg (altijd toegankelijk)

**Waarom?** De gebruiker moet altijd kunnen:
- Opslaan of annuleren (actiezone)
- Zien wat de impact is (contextzone)
- Het paneel sluiten (sluitzone)

### 3. **DaisyUI Formulieren**

Alle formuliervelden gebruiken DaisyUI-componenten met deze eigenschappen:

- **Compact maar luchtig**: balans tussen ruimte-efficiëntie en leesbaarheid
- **Icon-driven**: iconen maken formulieren compacter en scanbaarder
- **Multi-column**: waar zinvol meerdere kolommen gebruiken
- **Visuele hiërarchie**: de gebruiker wordt door het formulier geleid
- **Logische groepering**: gerelateerde velden bij elkaar

### 4. **Responsive Gedrag**

#### Desktop (>1024px)
- Gecentreerd paneel, max-width 800px (standaard) of 1200px (wide variant)
- 75% viewport hoogte (standaard)
- Afgeronde hoeken boven

#### Tablet (769px - 1024px)
- Full-width paneel
- 80% viewport hoogte
- Afgeronde hoeken boven

#### Mobiel (<768px)
- **Volledig scherm** (100vh)
- Geen afgeronde hoeken
- Aangepaste padding
- Formulieren altijd single-column
- Actieknoppen kunnen wrappen

**Belangrijk**: Mobiel mag (en moet) het patroon herinterpretren voor betere UX, zolang de kernprincipes behouden blijven.

---

## Componenten

### EditScreen Class (`editScreen.js`)

De basis-component die alle logica bevat:

```javascript
import { EditScreen } from './components/editScreen.js';

const myEditScreen = new EditScreen({
    id: 'myEditScreen',              // Unieke ID
    title: 'Edit Something',          // Titel in header
    height: '75vh',                   // Optioneel: custom hoogte
    
    // Render callbacks
    renderFormContent: (data) => {
        // Return HTML string voor formulierzone
        return `<div class="form-control">...</div>`;
    },
    
    renderContextContent: (data) => {
        // Return HTML string voor contextzone
        return `<div class="alert">...</div>`;
    },
    
    // Event handlers
    onSave: async (formData, originalData) => {
        // Opslag-logica
        await MyService.update(originalData.id, formData);
    },
    
    onCancel: (data) => {
        // Optioneel: cancel-logica
    }
}).init();
```

### Zones in Detail

#### 1. Formulierzone

**Doel**: Alle editbare velden

**Belangrijke patterns**:

```javascript
// Multi-column layout
renderFormContent: (data) => `
    <div class="edit-screen__form-row edit-screen__form-row--2col">
        <div class="form-control">
            <label class="label">
                <span class="label-text font-semibold">Field 1</span>
            </label>
            <input type="text" class="input input-bordered" />
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text font-semibold">Field 2</span>
            </label>
            <input type="text" class="input input-bordered" />
        </div>
    </div>
    
    <!-- Sectie met heading -->
    <div class="edit-screen__form-section">
        <h4 class="edit-screen__form-section-title">Advanced Options</h4>
        <!-- Velden -->
    </div>
    
    <!-- Icon-enhanced field -->
    <div class="form-control">
        <label class="label">
            <span class="label-text font-semibold">Location</span>
        </label>
        <div class="edit-screen__field-with-icon">
            <svg class="edit-screen__field-icon h-5 w-5">...</svg>
            <input type="text" class="input input-bordered" />
        </div>
    </div>
`
```

**Form Rows**:
- `.edit-screen__form-row` - basis container
- `.edit-screen__form-row--2col` - 2 kolommen (1 op mobiel)
- `.edit-screen__form-row--3col` - 3 kolommen (1 op mobiel)

**Form Sections**:
- `.edit-screen__form-section` - visuele sectie-scheiding
- `.edit-screen__form-section-title` - uppercase sectie-titel

#### 2. Actiezone

**Doel**: Primaire en secundaire acties

**Structuur**:
- Links: secundaire acties (delete, remove, etc.)
- Rechts: primaire acties (cancel, save)

**Secundaire actie toevoegen**:

```javascript
myEditScreen.addSecondaryAction(
    'Delete',                          // Label
    '<svg>...</svg>',                  // Icon
    'error',                           // DaisyUI variant (error, warning, etc.)
    async (data) => {                  // Handler
        if (confirm('Are you sure?')) {
            await MyService.delete(data.id);
            myEditScreen.close();
        }
    }
);
```

#### 3. Contextzone

**Doel**: Preview, relevante links, tips, waarschuwingen

**Content is optioneel**, maar de zone is altijd aanwezig in de layout.

**Patterns**:

```javascript
renderContextContent: (data) => `
    <!-- Preview -->
    <div class="edit-screen__context-preview">
        <strong>Preview:</strong> ${generatePreview(data)}
    </div>
    
    <!-- Tip -->
    <div class="edit-screen__context-tip">
        <svg class="h-5 w-5">...</svg>
        <span>Helpful tip for the user</span>
    </div>
    
    <!-- Waarschuwing -->
    <div class="edit-screen__context-warning">
        <svg class="h-5 w-5">...</svg>
        <span>Important warning</span>
    </div>
    
    <!-- Link -->
    <a href="#" class="edit-screen__context-link">
        Learn more
        <svg class="h-4 w-4">→</svg>
    </a>
`
```

#### 4. Sluitzone

**Doel**: Duidelijke affordance om te sluiten

**Gedrag**:
- Close button (top-right)
- Drag handle (top-center)
- Backdrop click
- ESC-toets

Geen configuratie nodig - werkt automatisch.

---

## API Reference

### Constructor Options

| Option | Type | Default | Beschrijving |
|--------|------|---------|-------------|
| `id` | string | `'editScreen'` | Unieke ID voor het element |
| `title` | string | `'Edit'` | Titel in header |
| `height` | string | `'75vh'` | CSS height value |
| `renderFormContent` | function | `null` | Render functie voor formulier |
| `renderContextContent` | function | `null` | Render functie voor context |
| `onSave` | function | `null` | Save handler (async) |
| `onCancel` | function | `null` | Cancel handler |

### Methods

#### `init()`
Initialiseer en inject in DOM. **Moet altijd worden aangeroepen**.

```javascript
const screen = new EditScreen(options).init();
```

#### `open(data)`
Open het edit screen met optionele data.

```javascript
screen.open(myObject);
```

#### `close()`
Sluit het edit screen.

```javascript
screen.close();
```

#### `setTitle(title)`
Update de titel dynamisch.

```javascript
screen.setTitle('Edit Scene #42');
```

#### `addSecondaryAction(label, icon, variant, handler)`
Voeg een secundaire actie toe.

```javascript
screen.addSecondaryAction('Delete', iconSvg, 'error', deleteHandler);
```

#### `destroy()`
Verwijder volledig uit DOM.

```javascript
screen.destroy();
```

### Events

Custom events die je kunt afluisteren:

```javascript
const container = document.getElementById('myEditScreen');

container.addEventListener('editscreen:opened', (e) => {
    console.log('Opened with data:', e.detail.data);
});

container.addEventListener('editscreen:closed', () => {
    console.log('Closed');
});
```

---

## Implementatie-richtlijnen

### ✅ DO

1. **Gebruik de EditScreen class** voor alle edit-functionaliteit
2. **Respecteer de zonestructuur** - geen zones weglaten of verplaatsen
3. **Gebruik DaisyUI componenten** in formulieren
4. **Test op mobiel** - formulieren moeten single-column worden
5. **Gebruik icon-enhanced fields** waar het helpt
6. **Groepeer gerelateerde velden** in sections
7. **Geef context** via de contextzone (preview, tips)
8. **Test scroll-gedrag** - actie/context zones moeten zichtbaar blijven

### ❌ DON'T

1. **Geen inline styles** - gebruik de CSS classes
2. **Geen custom scroll handling** - de component regelt dit
3. **Geen acties buiten de actiezone** - houd structuur consistent
4. **Geen vaste hoogtes in formulieren** - laat scrollen werken
5. **Geen z-index hacks** - de zones hebben correcte layering
6. **Geen custom animaties** - gebruik de standaard transitions
7. **Geen formulieren zonder labels** - altijd duidelijke labels
8. **Geen te lange formulieren zonder sections** - breek op in logische delen

---

## Voorbeelden

### Voorbeeld 1: Scene Editor

```javascript
const sceneEditScreen = new EditScreen({
    id: 'sceneEditScreen',
    title: 'Edit Scene',
    
    renderFormContent: (scene) => `
        <div class="edit-screen__form-row edit-screen__form-row--2col">
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Scene Number</span>
                </label>
                <input 
                    type="text" 
                    name="scene_number" 
                    value="${scene?.scene_number || ''}"
                    class="input input-bordered" 
                    required 
                />
            </div>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Location</span>
                </label>
                <select name="location_id" class="select select-bordered">
                    ${locations.map(loc => `
                        <option value="${loc.id}" ${scene?.location_id === loc.id ? 'selected' : ''}>
                            ${loc.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
        
        <div class="edit-screen__form-section">
            <h4 class="edit-screen__form-section-title">Scene Properties</h4>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">INT/EXT</span>
                </label>
                <div class="edit-screen__toggle-group" style="grid-template-columns: repeat(4, 1fr);">
                    <label class="btn btn-outline">
                        <input type="radio" name="int_ext" value="INT" class="hidden" 
                            ${scene?.int_ext === 'INT' ? 'checked' : ''} />
                        <span>INT.</span>
                    </label>
                    <label class="btn btn-outline">
                        <input type="radio" name="int_ext" value="EXT" class="hidden"
                            ${scene?.int_ext === 'EXT' ? 'checked' : ''} />
                        <span>EXT.</span>
                    </label>
                    <!-- etc. -->
                </div>
            </div>
        </div>
    `,
    
    renderContextContent: (scene) => {
        const heading = buildSceneHeading(scene);
        return `
            <div class="edit-screen__context-preview">
                <div class="text-xs text-base-content/60 mb-1">Scene Heading Preview:</div>
                <div class="font-mono font-semibold">${heading}</div>
            </div>
        `;
    },
    
    onSave: async (formData, scene) => {
        await SceneService.update(scene.id, formData);
        // Refresh UI
        refreshScenes();
    }
}).init();

// Add delete action
sceneEditScreen.addSecondaryAction(
    'Delete Scene',
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>`,
    'error',
    async (scene) => {
        if (confirm('Delete this scene?')) {
            await SceneService.delete(scene.id);
            sceneEditScreen.close();
            refreshScenes();
        }
    }
);
```

### Voorbeeld 2: Location Editor (Eenvoudig)

```javascript
const locationEditScreen = new EditScreen({
    id: 'locationEditScreen',
    title: 'Edit Location',
    height: '50vh',  // Korter omdat minder velden
    
    renderFormContent: (location) => `
        <div class="form-control">
            <label class="label">
                <span class="label-text font-semibold">Location Name</span>
            </label>
            <input 
                type="text" 
                name="name" 
                value="${location?.name || ''}"
                class="input input-bordered" 
                required 
            />
        </div>
        
        <div class="form-control">
            <label class="label">
                <span class="label-text font-semibold">Address (Optional)</span>
            </label>
            <textarea 
                name="address" 
                class="textarea textarea-bordered"
                rows="2"
            >${location?.address || ''}</textarea>
        </div>
    `,
    
    renderContextContent: (location) => `
        <div class="edit-screen__context-tip">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Locations can be reused across multiple scenes</span>
        </div>
    `,
    
    onSave: async (formData, location) => {
        if (location) {
            await LocationService.update(location.id, formData);
        } else {
            await LocationService.create(formData);
        }
        refreshLocations();
    }
}).init();
```

---

## CSS Customization

Als je specifieke styling nodig hebt voor een edit screen:

```css
/* Targeting specific edit screen */
#myEditScreen {
    /* Custom height */
    height: 60vh;
}

#myEditScreen .edit-screen__form {
    /* Custom form gap */
    gap: 1.5rem;
}

/* Wide variant for complex forms */
#myComplexEditScreen {
    /* Use wide variant on desktop */
}

@media (min-width: 1025px) {
    #myComplexEditScreen {
        max-width: 1200px;
        width: 95%;
    }
}
```

---

## Migratie van bestaande drawers

Als je een bestaand drawer/modal/panel hebt:

1. **Identificeer de zones**:
   - Wat zijn de formuliervelden? → Formulierzone
   - Wat zijn de acties? → Actiezone
   - Is er preview/context? → Contextzone

2. **Converteer naar EditScreen**:
   - Maak nieuwe EditScreen instance
   - Migreer form HTML naar `renderFormContent`
   - Migreer context HTML naar `renderContextContent`
   - Migreer save-logica naar `onSave`

3. **Test scroll-gedrag**:
   - Voeg dummy content toe aan formulier
   - Controleer dat acties zichtbaar blijven
   - Test op mobiel

4. **Verwijder oude code**:
   - Oude HTML template
   - Oude CSS
   - Oude JavaScript event handlers

---

## Toekomstige uitbreidingen

Dit patroon kan later worden uitgebreid met:

- **Wizard mode**: multi-step formulieren met voortgangsindicator
- **Dirty state detection**: waarschuwing bij unsaved changes
- **Auto-save**: optionele automatische opslag
- **Validation feedback**: inline error messages
- **Loading states**: skeleton loaders tijdens data fetch
- **Keyboard shortcuts**: sneltoetsen voor save/cancel
- **Drag to resize**: aanpasbare hoogte

Maar de kernstructuur (vier zones, scroll-gedrag) blijft altijd hetzelfde.

---

## Vragen?

Bij twijfel over de toepassing van dit patroon:

1. ✅ **Gebruik de vier zones** - altijd
2. ✅ **Respecteer scroll-gedrag** - formulier scrollt, rest niet
3. ✅ **DaisyUI components** - geen custom form styling
4. ✅ **Test op mobiel** - responsive gedrag is essentieel

Dit patroon is geen suggestie maar een **architecturaal contract**.
