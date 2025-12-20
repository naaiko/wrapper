# Database Migration & Calendar Setup

## Step 1: Run Database Migration

Je hebt nu een nieuwe database migratie nodig om echte datums te ondersteunen.

1. Ga naar Supabase SQL Editor: https://app.supabase.com/project/jdjwkidtslnqvfednuga/sql
2. Kopieer de inhoud van `frontend/docs/migration-add-dates.sql`
3. Plak en run het in de SQL Editor

Dit voegt toe:
- `shooting_dates` column (DATE array) voor echte kalender datums
- `production_start_date` op projects (optioneel)
- Helper functies voor datum queries
- Indexes voor betere performance

## Step 2: Nieuwe Features

### Kalender View
- Ga naar **Calendar** in de navbar
- Sleep scenes van "Unscheduled Scenes" naar kalender dagen
- Scenes kunnen op meerdere dagen geplaatst worden
- Synchroniseert automatisch met timeline view

### Timeline View (bijgewerkt)
- Nu met link naar Calendar view
- Scenes tonen zowel shooting days (nummers) als shooting dates (echte datums)

## Code Structuur (Refactored)

De code is nu professioneel gestructureerd:

```
js/
├── api/
│   └── supabaseClient.js      # Database layer - easy to switch providers
├── services/
│   └── sceneService.js         # Business logic - reusable across views
├── ui/
│   ├── sceneRenderer.js        # UI components - consistent rendering
│   ├── dragScroll.js           # Smooth scrolling - reusable
│   └── dragDropReorder.js      # Timeline reordering logic
├── calendar.js                 # Calendar view controller
└── timeline.js                 # Timeline view controller (to be refactored)
```

### Voordelen:
✅ **Herbruikbaar**: SceneService werkt voor timeline EN kalender  
✅ **Testbaar**: Business logic gescheiden van UI  
✅ **Onderhoudbaar**: Elke module heeft 1 verantwoordelijkheid  
✅ **Switchbaar**: Makkelijk database provider wisselen  
✅ **Uitbreidbaar**: Nieuwe views (Gantt, reports) eenvoudig toe te voegen  

## Volgende Stappen

1. **Timeline Refactoren**: Timeline.js nog updaten naar module structuur
2. **Gantt Handles**: Multi-dag scenes met resize handles
3. **Real-time Sync**: Supabase realtime voor team collaboration
4. **Authentication**: User auth toevoegen voor productie

## Testen

1. Voer migratie uit in Supabase
2. Refresh de app (Ctrl + Shift + R)
3. Maak een scene aan
4. Sleep naar kalender datum
5. Check timeline view - scene zou datum moeten tonen
6. Check database - shooting_dates array gevuld
