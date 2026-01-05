# Scene Properties Uitbreiding - Implementatie Overzicht

## Wat is toegevoegd

### 1. Database Schema Wijzigingen

#### Nieuwe Kolommen aan `scenes` table:
- `continuity` (TEXT) - Voor continuity designations (CONTINUOUS, LATER, etc.)

#### Nieuwe Table: `project_settings`
- Configuratie per project met feature flags
- Feature toggles voor elk scene heading component:
  - `show_int_ext` - Toon INT./EXT.
  - `show_location` - Toon location
  - `show_time` - Toon time of day
  - `show_conditions` - Toon weather/conditions
  - `show_continuity` - Toon continuity
- Configureerbare continuity options (JSONB array)

### 2. Scene Heading Format

De scene headings volgen nu de industry standard:
```
INT./EXT. LOCATION - TIME - CONTINUITY
```

Voorbeelden:
- `INT. COFFEE SHOP - DAY`
- `EXT. PARK - NIGHT - CONTINUOUS`
- `INT. BEDROOM - MORNING - FLASHBACK`

### 3. Nieuwe Features

#### Settings Modal
- Toegankelijk via gear icon in de dock
- Toggle elke component aan/uit
- Preview van scene heading format
- Real-time update van alle scene headings

#### Continuity Selector
- Dropdown in scene drawer
- 8 standaard opties:
  - CONTINUOUS - Action continues from previous scene
  - LATER - Some time has passed
  - SAME TIME - Happening simultaneously
  - MOMENTS LATER - A few moments later
  - FLASHBACK - Scene from the past
  - FLASH FORWARD - Scene from the future
  - DREAM SEQUENCE - Dream or fantasy
  - MONTAGE - Series of shots

#### Smart Scene Heading Builder
- Automatisch opgebouwd uit scene properties
- Respecteert feature flag settings
- Valt terug op description als geen properties ingevuld

### 4. Bestaande Features Behouden

Alle bestaande functionaliteit blijft werken:
- INT/EXT toggle ✓
- Location dropdown ✓
- Time of day selector ✓
- Conditions selector ✓
- Calendar drag & drop ✓
- Split scenes ✓
- Non-shooting days ✓

## Migratie Files

### Uit te voeren in volgorde:

1. `migration-add-continuity.sql` - Voegt continuity kolom toe aan scenes
2. `migration-add-settings.sql` - Creëert project_settings table

### Hoe uit te voeren:

```bash
# Via Supabase CLI
supabase db push

# Of handmatig via SQL editor in Supabase dashboard
```

## Nieuwe Bestanden

### Services
- `frontend/js/services/settingsService.js` - Settings management met feature flags

### Database Migraties
- `frontend/docs/migration-add-continuity.sql`
- `frontend/docs/migration-add-settings.sql`

## Aangepaste Bestanden

### JavaScript
- `frontend/js/calendar-toastui.js`:
  - Import settingsService
  - `buildSceneHeading()` functie toegevoegd
  - Settings modal functies toegevoegd
  - Continuity selector rendering
  - Drawer visibility management
  - Settings laden bij initialization
  
- `frontend/js/services/sceneService.js`:
  - Support voor `continuity` en `location_id` properties

### HTML
- `frontend/calendar.html`:
  - Settings button in dock
  - Settings modal toegevoegd
  - Continuity dropdown in scene drawer

## Gebruik

### Voor Gebruikers

1. **Settings configureren:**
   - Klik op gear icon (⚙️) in de dock
   - Toggle gewenste scene heading componenten aan/uit
   - Klik "Save Settings"

2. **Continuity toevoegen:**
   - Open scene drawer (klik op scene in calendar)
   - Selecteer continuity uit dropdown
   - Scene wordt automatisch bijgewerkt

3. **Scene Headings:**
   - Worden automatisch gegenereerd uit properties
   - Zichtbaar in calendar en unscheduled lijst
   - Respecteert je settings preferences

### Voor Developers

```javascript
// Settings ophalen
const features = settingsService.getAllFeatures();
if (features.show_continuity) {
  // Toon continuity UI
}

// Scene heading bouwen
const heading = buildSceneHeading(scene);
// Returns: "INT. COFFEE SHOP - DAY - CONTINUOUS"

// Settings updaten
await settingsService.updateSettings(projectId, {
  show_continuity: true,
  show_time: false
});
```

## Testing Checklist

- [ ] Migraties runnen zonder errors
- [ ] Settings modal opent en sluit correct
- [ ] Feature toggles werken (hide/show drawer fields)
- [ ] Continuity selector toont opties
- [ ] Scene headings worden correct gebouwd
- [ ] Scene headings updaten bij settings wijziging
- [ ] Bestaande scenes laden correct
- [ ] Nieuwe scenes kunnen worden aangemaakt
- [ ] Split scenes behouden properties
- [ ] Calendar rendering werkt met nieuwe headings

## Industry Standard Scene Heading Components

Volledig geïmplementeerd volgens screenplay formatting standards:
1. ✓ INT./EXT. (Interior/Exterior)
2. ✓ LOCATION (Setting name)
3. ✓ TIME OF DAY (DAY, NIGHT, etc.)
4. ✓ CONTINUITY (CONTINUOUS, LATER, etc.)
5. ✓ CONDITIONS (Weather/environmental - optioneel)

## Toekomstige Uitbreidingen

Mogelijk om toe te voegen:
- Custom continuity options per project
- Scene heading templates
- Batch update van properties
- Export naar screenplay format
- Import/export van settings
