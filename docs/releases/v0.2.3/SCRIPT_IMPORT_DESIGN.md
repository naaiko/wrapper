# Script Import & Parsing Feature - Design Document

## Overzicht

Script-import feature voor automatische scene extractie uit Fountain en plain text screenplay formats. De feature integreert naadloos in de bestaande timeline-workflow en volgt alle bestaande architectuurprincipes.

## Library-keuzes

### 1. Fountain.js (Primaire Parser)
**Library**: `fountain-js` (https://github.com/mattdaly/Fountain.js)  
**Versie**: 0.1.10  
**CDN**: `https://cdn.jsdelivr.net/npm/fountain-js@0.1.10/fountain.min.js`

**Waarom gekozen:**
- ✅ Deterministisch - geen AI, pure regel-gebaseerde parsing
- ✅ Volledige Fountain spec support
- ✅ Stabiel en battle-tested (sinds 2012)
- ✅ Geen dependencies
- ✅ Output bevat exact wat we nodig hebben:
  - Scene headings met locatie/tijd parsing
  - Karakter detectie per scene
  - Dialoog vs action onderscheid
  - Regelnummers voor traceerbaarheid

**Verantwoordelijkheid:**
- Raw parsing van Fountain syntax
- Structurele herkenning (scenes, dialogue, action)
- Character extraction

**Isolatie strategie:**
```javascript
// Adapter pattern - fountain.js geeft HTML, wij willen data
class FountainAdapter {
    parse(text) {
        const fountainOutput = fountain.parse(text, true);
        return this.normalize(fountainOutput);
    }
    
    normalize(fountainOutput) {
        // Converteer naar ons Scene model
        // Als we later wisselen: alleen deze class aanpassen
    }
}
```

### 2. Fallback: Plain Text Parser (Eigen Implementatie)
**Verantwoordelijkheid:**
- Scripts zonder Fountain markers
- Klassieke screenplay formatting (alles caps headings)
- Heuristieken voor scene detection

**Waarom eigen code:**
- Plain text heeft geen standaard spec
- Te simpel voor een library
- Geeft ons volledige controle over edge cases

**Strategie:**
```javascript
class PlainTextSceneParser {
    // Heuristieken:
    // - ALL CAPS met INT/EXT = scene heading
    // - Patronen zoals "FADE IN:", "CUT TO:" detecteren
    // - Dialoog vs action door indentatie
}
```

### 3. Future: Final Draft FDX Parser
**Library**: `fdx-parser` of eigen XML parser  
**Status**: Voorbereid maar niet fase 1

**Voorbereiding nu:**
- Interface `IScriptParser` met method `parse(text): Scene[]`
- Alle parsers implementeren deze interface
- Makkelijk uitbreidbaar zonder breaking changes

---

## Datamodel & Types

### Core Types

```javascript
/**
 * Normalized scene object from script import
 * Compliant met bestaand scenes table schema
 */
class ImportedScene {
    constructor() {
        // Required fields (voor database)
        this.scene_number = '';      // String: "1", "1A", "12"
        this.description = '';        // Full heading: "INT. BEDROOM - DAY"
        this.story_order = 0;         // Int: positie in script
        
        // Parsed components (voor UI editing)
        this.int_ext = null;          // "INT", "EXT", "INT/EXT", null
        this.location = '';           // "BEDROOM", "COFFEE SHOP"
        this.time = null;             // "DAY", "NIGHT", "MORNING", etc.
        this.continuity = null;       // "CONTINUOUS", "LATER", etc.
        
        // Raw content & metadata
        this.rawText = '';            // Volledige scene text (action + dialogue)
        this.characters = [];         // Array<string>: detected character names
        
        // Source tracing
        this.sourceMeta = {
            lineStart: 0,             // Start regel in origineel script
            lineEnd: 0,               // Eind regel
            confidence: 1.0,          // 0.0-1.0: parsing confidence
            warnings: []              // Array<string>: ambiguities
        };
        
        // UI state (tijdelijk, niet opgeslagen)
        this.isEnabled = true;        // User kan scenes uitschakelen
        this.hasChanges = false;      // Track edits in preview
    }
}

/**
 * Script import result
 */
class ScriptImportResult {
    constructor() {
        this.scenes = [];             // Array<ImportedScene>
        this.metadata = {
            title: '',                // Script title (indien gevonden)
            author: '',               // Author (indien gevonden)
            totalScenes: 0,
            totalCharacters: 0,
            parseWarnings: []         // Global warnings
        };
        this.rawText = '';            // Original input (voor re-parse)
    }
}
```

### Type Conversie Flow

```
Fountain Text 
    ↓ (FountainAdapter.parse)
FountainAST
    ↓ (SceneNormalizer.normalize)
ImportedScene[]
    ↓ (User edits in preview)
ImportedScene[] (modified)
    ↓ (TimelineIntegration.createScenes)
Database Scenes
```

---

## Architectuur

### Layered Architecture

```
┌─────────────────────────────────────────┐
│  UI Layer (ScriptImportScreen.js)      │
│  - File upload                          │
│  - Scene preview grid                   │
│  - Edit controls                        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Service Layer (ScriptImportService.js) │
│  - Orchestration                        │
│  - Validation                           │
│  - Timeline integration                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Parsing Layer                          │
│  ┌──────────────────────────────────┐   │
│  │ FountainAdapter                  │   │
│  │  - fountain.js wrapper           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ PlainTextParser                  │   │
│  │  - heuristic-based parsing       │   │
│  └──────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Normalization Layer                    │
│  - SceneNormalizer                      │
│  - Character extraction                 │
│  - Location/Time mapping                │
└──────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. ScriptImportService.js
**Verantwoordelijkheid:** High-level orchestration

```javascript
class ScriptImportService {
    // Parse script text naar ImportedScenes
    static async parseScript(text, format = 'auto')
    
    // Valideer scenes voor database insert
    static validateScenes(scenes)
    
    // Maak definitieve scenes in database
    static async createScenesFromImport(projectId, importedScenes)
    
    // Herken script format
    static detectFormat(text)
}
```

#### 2. FountainAdapter.js
**Verantwoordelijkheid:** Fountain.js isolatie

```javascript
class FountainAdapter {
    parse(text) {
        // 1. Parse met fountain.js
        // 2. Extract scenes
        // 3. Convert naar ImportedScene[]
        // 4. Calculate confidence scores
    }
    
    extractCharacters(fountainScene) {
        // Extract character names from dialogue
    }
}
```

#### 3. PlainTextParser.js
**Verantwoordelijkheid:** Plain text heuristieken

```javascript
class PlainTextParser {
    parse(text) {
        // Regex patterns voor scene headings
        // Character detection
        // Return ImportedScene[]
    }
    
    isSceneHeading(line) {
        // Heuristics voor heading detection
    }
}
```

#### 4. SceneNormalizer.js
**Verantwoordelijkheid:** Data normalisatie

```javascript
class SceneNormalizer {
    // Split heading naar components
    static parseHeading(heading)
    
    // Normaliseer INT/EXT varianten
    static normalizeIntExt(value)
    
    // Extract time of day
    static extractTime(heading)
    
    // Map naar database enums
    static mapToDatabase(importedScene)
}
```

#### 5. ScriptImportScreen.js
**Verantwoordelijkheid:** UI & UX

```javascript
class ScriptImportScreen {
    constructor(projectId, onComplete)
    
    // Render upload interface
    renderUpload()
    
    // Render preview grid met editable scenes
    renderPreview(importedScenes)
    
    // Handle user edits
    handleSceneEdit(sceneId, field, value)
    
    // Finalize & insert into timeline
    async finalize()
}
```

---

## UI/UX Flow

### Step 1: Import Trigger

**Locatie:** Timeline dock (naast "Add Scene" knop)

```html
<button class="btn btn-sm bg-base-300/50 hover:bg-base-300 border-none">
    <svg><!-- Document upload icon --></svg>
    Import Script
</button>
```

### Step 2: Upload Modal

**Component:** ScriptImportScreen (EditScreen mode=modal)

```
┌─────────────────────────────────────────────────┐
│  Import Script                            [ × ] │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │  Drop .fountain or .txt file here       │  │
│   │         or click to browse               │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│   Format: ● Auto-detect  ○ Fountain  ○ Plain   │
│                                                 │
│   [ Cancel ]                       [ Parse ▶ ]  │
└─────────────────────────────────────────────────┘
```

### Step 3: Preview Grid

**Layout:** Full-screen edit interface (mode=fullscreen)

```
┌─────────────────────────────────────────────────────────┐
│  Import Preview                              [Done] [×]  │
├─────────────────────────────────────────────────────────┤
│  Found 24 scenes  |  Select All  |  Deselect All        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                │
│  │ ✓ 1  │  │ ✓ 2  │  │ ✓ 3  │  │ ✓ 4  │   Scene cards  │
│  │ INT. │  │ EXT. │  │ INT. │  │ EXT. │   (DaisyUI)    │
│  │BEDRM │  │PARK  │  │CAFE  │  │STRT  │                │
│  │ DAY  │  │ NGHT │  │ DAY  │  │ DAY  │   Editable     │
│  └──────┘  └──────┘  └──────┘  └──────┘   on click     │
│                                                          │
│  [Reorder ⇅]  [Merge Selected]  [Split Scene]          │
│                                                          │
│  Selected: 3/24  |  [Import 3 Scenes]                   │
└──────────────────────────────────────────────────────────┘
```

**Scene Card (DaisyUI):**

```html
<div class="card bg-base-100 shadow-md compact relative">
    <!-- Checkbox overlay -->
    <label class="absolute top-2 right-2 z-10">
        <input type="checkbox" class="checkbox checkbox-sm" checked />
    </label>
    
    <!-- Card body -->
    <div class="card-body cursor-pointer" onclick="editScene(1)">
        <div class="badge badge-sm">Scene 1</div>
        <h3 class="card-title text-sm">INT. BEDROOM - DAY</h3>
        <div class="text-xs opacity-60">
            Characters: John, Mary
        </div>
    </div>
</div>
```

### Step 4: Edit Individual Scene

**Component:** EditScreen (inline or modal)

```
┌──────────────────────────────────────────────┐
│  Edit Scene 1                          [×]   │
├──────────────────────────────────────────────┤
│  Scene #: [1]   INT/EXT: [INT ▼]            │
│  Location: [BEDROOM              ]          │
│  Time: [DAY ▼]   Continuity: [-- ▼]        │
│                                              │
│  Description:                                │
│  [INT. BEDROOM - DAY                    ]   │
│                                              │
│  Characters detected:                        │
│  • John   • Mary   [+ Add]                  │
│                                              │
│  [ Cancel ]                     [ Save ]     │
└──────────────────────────────────────────────┘
```

### Step 5: Finalize

**Action:** Klik "Import X Scenes"

**Proces:**
1. Validate alle enabled scenes
2. Toon confirmation modal met summary
3. Bulk insert via SceneService.createBulk()
4. Timeline re-renders met nieuwe scenes
5. Success toast

---

## Parsing Strategie

### Format Detection

```javascript
function detectFormat(text) {
    // Check voor Fountain markers
    if (text.includes('===') || /^Title:/m.test(text)) {
        return 'fountain';
    }
    
    // Check voor Final Draft XML
    if (text.trim().startsWith('<?xml') && text.includes('FinalDraft')) {
        return 'fdx';
    }
    
    // Default: plain text
    return 'plaintext';
}
```

### Scene Heading Parsing

**Fountain:**
```javascript
// Input: "INT. BEDROOM - DAY"
{
    int_ext: "INT",
    location: "BEDROOM",
    time: "DAY",
    continuity: null
}

// Input: "INT./EXT. OFFICE - CONTINUOUS"
{
    int_ext: "INT/EXT",
    location: "OFFICE",
    time: null,
    continuity: "CONTINUOUS"
}
```

**Regex patterns:**
```javascript
const HEADING_PATTERN = /^(INT|EXT|INT\/EXT|INT\.\/EXT\.|I\/E)\.?\s+(.+?)(?:\s+-\s+(.+))?$/i;

// Groepen:
// 1: INT/EXT
// 2: Location
// 3: Time/Continuity (optioneel)
```

### Character Detection

**Fountain:**
- Alles wat voor dialogue staat is een character
- Upper case names
- Fountain.js geeft dit al parsed

**Plain text:**
```javascript
// Heuristic: Upper case line followed by dialogue
// Between ACTION and DIALOGUE sections
const CHARACTER_PATTERN = /^[A-Z][A-Z\s]+$/;
```

### Confidence Scoring

```javascript
function calculateConfidence(scene) {
    let score = 1.0;
    
    // Penalties
    if (!scene.int_ext) score -= 0.1;
    if (!scene.location) score -= 0.2;
    if (!scene.time) score -= 0.1;
    if (scene.characters.length === 0) score -= 0.1;
    
    // Warnings
    if (scene.location.length > 50) {
        scene.sourceMeta.warnings.push('Long location name');
        score -= 0.1;
    }
    
    return Math.max(0, score);
}
```

---

## Timeline Integratie

### Bestaande Systemen (NIET dupliceren)

#### 1. Scene Creation
**Gebruik:** `SceneService.create(projectId, sceneData)`

```javascript
// GOED: Gebruik bestaande service
await SceneService.create(projectId, {
    scene_number: importedScene.scene_number,
    description: importedScene.description,
    int_ext: importedScene.int_ext,
    location: importedScene.location,
    time: importedScene.time,
    continuity: importedScene.continuity
});

// FOUT: Direct database call
// await supabase.from('scenes').insert(...);  // ❌ NIET DOEN
```

#### 2. Story Order
**Gebruik:** SceneService berekent automatisch `story_order`

```javascript
// SceneService.create() doet al:
// - Haal bestaande scenes op
// - Bereken maxOrder
// - Zet nieuwe scene op maxOrder + 1

// Wij hoeven alleen sequentieel aan te roepen
for (const scene of importedScenes) {
    await SceneService.create(projectId, scene);
}
```

#### 3. Timeline Rendering
**Gebruik:** Bestaande `renderTimeline()` in timeline.js

```javascript
// Na bulk import:
scenes = await SceneService.getAll(currentProject.id);
renderTimeline(); // Bestaande functie
```

### Bulk Insert Optimalisatie

**Nieuw in SceneService:**

```javascript
class SceneService {
    /**
     * Bulk create scenes (optimized for script import)
     * Maintains story_order sequence
     */
    static async createBulk(projectId, scenesData) {
        const existingScenes = await this.getAll(projectId);
        let maxOrder = existingScenes.length > 0 
            ? Math.max(...existingScenes.map(s => s.story_order))
            : 0;
        
        // Add story_order to each scene
        const scenesWithOrder = scenesData.map((sceneData, index) => ({
            project_id: projectId,
            story_order: maxOrder + index + 1,
            ...sceneData
        }));
        
        // Single database transaction
        return await supabaseClient.createScenes(scenesWithOrder);
    }
}
```

---

## Edge Cases & Handling

### 1. Inconsistente Formatting

**Probleem:**
```
INT BEDROOM - DAY       (geen punt)
INT. KITCHEN  -  NIGHT  (extra spaties)
I/E OFFICE - CONTINUOUS (afkorting)
```

**Oplossing:**
```javascript
function normalizeHeading(heading) {
    return heading
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/I\/E/gi, 'INT/EXT')   // Expand abbreviations
        .trim();
}
```

### 2. Ontbrekende Scene Headings

**Probleem:** Scene zonder duidelijke heading

**Oplossing:**
```javascript
{
    scene_number: "?",  // Mark als onzeker
    description: "UNTITLED SCENE",
    sourceMeta: {
        confidence: 0.3,
        warnings: ["No scene heading found"]
    }
}
```

### 3. Dubbele Scene Numbers

**Probleem:**
```
1. INT. BEDROOM - DAY
1A. INT. BEDROOM - LATER
2. EXT. STREET - DAY
```

**Oplossing:** Accepteer strings, valideer uniekheid

```javascript
function validateSceneNumbers(scenes) {
    const numbers = scenes.map(s => s.scene_number);
    const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
    
    if (duplicates.length > 0) {
        return {
            valid: false,
            message: `Duplicate scene numbers: ${duplicates.join(', ')}`
        };
    }
    
    return { valid: true };
}
```

### 4. Niet-Engelstalige Scripts

**Probleem:** Nederlandse/Duitse scene headings
```
BINNEN. SLAAPKAMER - DAG
INNEN. SCHLAFZIMMER - TAG
```

**Oplossing:** Pattern matching op structuur, niet taal

```javascript
const INTL_PATTERNS = {
    nl: /^(BINNEN|BUITEN|BINNEN\/BUITEN)/i,
    de: /^(INNEN|AUSSEN|INNEN\/AUSSEN)/i,
    fr: /^(INT|EXT|INT\/EXT)/i  // Frans gebruikt Engels
};

function detectLanguage(text) {
    for (const [lang, pattern] of Object.entries(INTL_PATTERNS)) {
        if (pattern.test(text)) return lang;
    }
    return 'en';
}
```

### 5. Grote Scripts (100+ scenes)

**Probleem:** Performance bij parsing & rendering

**Oplossing:**
- Virtuele scrolling in preview grid (DaisyUI + CSS)
- Batch rendering (25 scenes per keer)
- Progress indicator tijdens parse

```javascript
async function parseWithProgress(text) {
    const lines = text.split('\n');
    const totalLines = lines.length;
    let parsed = 0;
    
    // Update progress elke 100 regels
    for (let i = 0; i < lines.length; i += 100) {
        const chunk = lines.slice(i, i + 100);
        await parseChunk(chunk);
        
        parsed += chunk.length;
        updateProgress(parsed / totalLines);
        
        // Yield to UI thread
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}
```

---

## Future-Proofing

### 1. FDX Support

**Architectuur:** Plug-and-play parser

```javascript
class FDXParser {
    parse(xmlText) {
        // XML parsing
        // Return ImportedScene[]
    }
}

// In ScriptImportService:
static getParser(format) {
    switch(format) {
        case 'fountain': return new FountainAdapter();
        case 'plaintext': return new PlainTextParser();
        case 'fdx': return new FDXParser();  // Future
        default: throw new Error('Unknown format');
    }
}
```

### 2. Scene-cast member Combinaties

**Database:** `scene_cast_members` table bestaat al

**Uitbreiding:**
```javascript
class ScriptImportService {
    static async createScenesFromImport(projectId, importedScenes) {
        // 1. Create scenes
        const createdScenes = await SceneService.createBulk(projectId, importedScenes);
        
        // 2. Voor elke scene, link characters
        for (let i = 0; i < createdScenes.length; i++) {
            const scene = createdScenes[i];
            const imported = importedScenes[i];
            
            // Match character names naar Cast
            const actorIds = await this.matchCharactersToActors(
                projectId, 
                imported.characters
            );
            
            // Create scene_actor links
            if (actorIds.length > 0) {
                await SceneActorService.createBulk(scene.id, actorIds);
            }
        }
        
        return createdScenes;
    }
    
    static async matchCharactersToActors(projectId, characterNames) {
        // Fuzzy match character names naar bestaande Cast
        // Return array van Cast Member IDs
        // Toon onbekende characters in UI voor mapping
    }
}
```

### 3. Script Revisions

**Database:** Nieuwe tabel (later)

```sql
CREATE TABLE script_imports (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects,
    filename TEXT,
    import_date TIMESTAMP,
    scenes_created INTEGER,
    raw_text TEXT,  -- Voor re-parse
    metadata JSONB
);
```

**Gebruik:** Re-import detecteert wijzigingen

---

## Implementatie Volgorde

### Fase 1: Core Parsing (MVP)
1. ✅ FountainAdapter met fountain.js
2. ✅ PlainTextParser (basis)
3. ✅ SceneNormalizer
4. ✅ ImportedScene model
5. ✅ ScriptImportService (orchestration)

### Fase 2: UI
6. ✅ ScriptImportScreen - Upload modal
7. ✅ Preview grid (DaisyUI cards)
8. ✅ Scene edit modal (hergebruik AddSceneScreen pattern)
9. ✅ Timeline dock button

### Fase 3: Integration
10. ✅ SceneService.createBulk()
11. ✅ Timeline rendering update
12. ✅ Success feedback & error handling

### Fase 4: Polish
13. ✅ Edge case handling
14. ✅ Internationalization prep
15. ✅ Performance optimization
16. ✅ Documentatie

### Fase 5: Future (niet nu)
- FDX parser
- Character-to-cast member matching
- Script revision tracking
- Bulk edit operations

---

## Testing Strategie

### Unit Tests
```javascript
// SceneNormalizer tests
test('parseHeading splits INT/EXT correctly', () => {
    const result = SceneNormalizer.parseHeading('INT. BEDROOM - DAY');
    expect(result.int_ext).toBe('INT');
    expect(result.location).toBe('BEDROOM');
    expect(result.time).toBe('DAY');
});

// FountainAdapter tests
test('parse extracts scenes from fountain text', () => {
    const text = `INT. BEDROOM - DAY\n\nJohn enters.`;
    const scenes = new FountainAdapter().parse(text);
    expect(scenes.length).toBe(1);
    expect(scenes[0].location).toBe('BEDROOM');
});
```

### Integration Tests
```javascript
// End-to-end import flow
test('full import creates scenes in database', async () => {
    const text = readFile('test-script.fountain');
    const result = await ScriptImportService.parseScript(text);
    const created = await ScriptImportService.createScenesFromImport(
        testProjectId, 
        result.scenes
    );
    
    expect(created.length).toBe(result.scenes.length);
});
```

### Manual Test Cases
1. Fountain script met 20+ scenes
2. Plain text screenplay (klassiek format)
3. Script met edge cases (dubbele nummers, rare formatting)
4. Grote script (100+ scenes)
5. Niet-Engels script

---

## Success Criteria

### Functioneel
- ✅ Herkent 95%+ van scene headings correct (Fountain)
- ✅ Herkent 80%+ van scene headings correct (plain text)
- ✅ Extracteert characters uit dialogue
- ✅ Scenes zijn bewerkbaar voor finalisatie
- ✅ Bulk insert in 1 transactie
- ✅ Timeline update is instant

### Non-functioneel
- ✅ Parse 100 scenes in < 2 seconden
- ✅ UI responsive tijdens parsing (> 60fps)
- ✅ Geen blocking tijdens import
- ✅ Clear error messages bij failures
- ✅ Traceerbaar naar originele script (line numbers)

### UX
- ✅ Flow voelt aan als natuurlijke extensie van timeline
- ✅ Alle UI is DaisyUI compliant
- ✅ Preview is intuïtief en overzichtelijk
- ✅ Edits zijn instant (geen lag)
- ✅ Success feedback is duidelijk

---

## Conclusie

Deze implementatie:
- **Gebruikt bestaande libraries** waar mogelijk (fountain.js)
- **Hergebruikt bestaande systemen** (SceneService, EditScreen pattern)
- **Volgt DaisyUI design system** strikt
- **Is future-proof** (FDX, revisions, character matching)
- **Blijft traceerbaar** (source line numbers, confidence scores)
- **Is uitbreidbaar** zonder breaking changes

**Kern principes:**
1. Geen dubbele logica - hergebruik SceneService
2. Geen custom UI - alleen DaisyUI
3. Deterministisch - geen AI guesswork
4. Modulair - elke layer is vervangbaar

De implementatie start met Fase 1-3 (MVP) en laat ruimte voor Fase 4-5 (polish & future).
