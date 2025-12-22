# Screens Folder

This folder contains all full-screen modal/drawer components that use the `EditScreen` base component.

## Architecture Pattern

All screen components in this folder follow the same architecture:

### 1. ES6 Module Structure
- Export as named class: `export class ScreenName {}`
- Import EditScreen component: `import { EditScreen } from '../components/editScreen.js'`
- NO separate `<script>` tags in HTML - screens are imported as ES6 modules in the main app file

### 2. Constructor Pattern
```javascript
export class ScreenName {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.locations = options.locations || [];
        this.times = options.times || [];
        this.conditions = options.conditions || [];
        
        // Callbacks
        this.onItemUpdated = options.onItemUpdated || null;
        this.onItemDeleted = options.onItemDeleted || null;
        
        // Create EditScreen instance
        this.editScreen = new EditScreen({
            id: 'uniqueScreenId',
            title: 'Screen Title',
            height: '90vh',
            renderFormContent: (item) => this.renderForm(item),
            renderContextContent: (item) => this.renderContext(item),
            onChange: (field, value, item) => this.handleChange(field, value, item),
            onAfterRender: (item) => this.initializeForm(item)
        }).init();
        
        this.addSecondaryActions();
    }
}
```

### 3. Required Methods
- `renderForm(item)` - Returns HTML string for form content
- `renderContext(item)` - Returns HTML string for right panel preview
- `handleChange(field, value, item)` - Auto-save logic
- `initializeForm(item)` - Setup form controls after render
- `addSecondaryActions()` - Add delete/other actions to header
- `open(itemId)` - Public method to open the screen
- `close()` - Public method to close the screen
- `updateOptions(options)` - Update locations/times/conditions

### 4. HTML Import Pattern

**❌ WRONG - Don't do this:**
```html
<script type="module" src="js/components/editScreen.js"></script>
<script type="module" src="js/screens/actorEditScreen.js"></script>
<script type="module" src="js/actors.js"></script>
```

**✅ CORRECT - Follow this pattern:**
```html
<!-- Only import main app file -->
<script src="js/supabase-config.js"></script>
<script type="module" src="js/actors.js"></script>
```

Then in `actors.js`:
```javascript
import { ActorEditScreen } from './screens/actorEditScreen.js';
```

This is the same pattern used in `calendar.html` - keeps imports clean and prevents load order issues.

## Current Screens

1. **sceneEditScreen.js** - Edit existing scenes (used in calendar, timeline)
2. **addSceneScreen.js** - Add new scenes with scheduling
3. **actorEditScreen.js** - Edit actor details

## Benefits

✅ **Consistent UX** - All screens slide up from bottom with same animation
✅ **Auto-save** - No save button needed, changes persist immediately  
✅ **DRY Principle** - Reuses EditScreen component (no duplicate drawer code)
✅ **Clean Imports** - ES6 modules imported once in main app file
✅ **Organized Structure** - All screens in one folder, easy to find

## Creating a New Screen

1. Create file in `frontend/js/screens/yourScreen.js`
2. Follow the constructor pattern above
3. Import in your main app file: `import { YourScreen } from './screens/yourScreen.js'`
4. Initialize: `this.yourScreen = new YourScreen({ ... })`
5. Open when needed: `this.yourScreen.open(itemId)`
