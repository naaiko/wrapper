# Cast Management Feature - Setup Guide

## Branch: `Cast-management`

Deze branch bevat de nieuwe acteurs-beheerfunctie voor het bijhouden van continuïteit in make-up en kledij op filmsets.

## Wat is toegevoegd

### Database
- **Cast** tabel - Acteurs met fysieke eigenschappen
- **cast_member_continuity** tabel - Scene-specifieke continuïteit (makeup, kledij, haar, etc.)

### Frontend Schermen
- **Cast.html** - Acteurs beheerscherm met CRUD functionaliteit
- **Cast.css** - Visuele styling met DaisyUI
- **Cast.js** - Hoofdapplicatie logica
- **actorService.js** - Business logic laag voor database operaties

### Kenmerken
- ✅ "Create-a-Sim" stijl character preview met silhouet
- ✅ Volledige CRUD operaties (Create, Read, Update, Delete)
- ✅ Zoeken en filteren van acteurs
- ✅ Fysieke karakteristieken tracking (lengte, haar, ogen, huid, etc.)
- ✅ Onderscheidende kenmerken (littekens, tatoeages, etc.)
- ✅ Contactinformatie
- ✅ Profielfoto support
- ✅ Belgische/Europese demo data
- ✅ Navigatie-integratie met Timeline en Calendar
- ✅ Database fundament voor toekomstige continuïteitsfoto's

## Database Migratie

Voer de volgende SQL uit in Supabase SQL Editor:

```bash
# Navigeer naar: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
# Kopieer de inhoud van: frontend/docs/migration-add-Cast.sql
# Plak en voer uit
```

Of gebruik de Supabase CLI:

```bash
supabase db push
```

## Demo Data

De ActorService bevat demo-acteurs met Belgische namen:
- Emma De Caluwe als Sophie Maes
- Thomas Vandenberghe als Marc Dubois  
- Marie Dubois als Claire Laurent
- Lucas Peeters als Jonas Willems

Demo data toevoegen in de console:
```javascript
await ActorService.createDemoActors(projectId);
```

## Navigatie

De acteurs screen is toegankelijk via:
- **Timeline** → Cast button in navbar
- **Calendar** → Cast button in navbar
- **Direct URL**: `Cast.html?project=YOUR_PROJECT_ID`

## Bestandsstructuur

```
frontend/
├── Cast.html                          # Acteurs beheerscherm
├── css/
│   └── Cast.css                       # Acteurs styling
├── js/
│   ├── Cast.js                        # Main app logic
│   └── services/
│       └── actorService.js              # Database service
└── docs/
    └── migration-add-Cast.sql         # Database migratie

ACTORS_DOCUMENTATION.md                  # Uitgebreide documentatie
```

## Visueel Design

### Character Silhouette
Een eenvoudige SVG silhouet wordt gebruikt als placeholder:
- Hoofd, lichaam, armen, benen
- Vervangen door echte foto via `profile_image_url`
- "Create-a-Sim" gevoel voor character building

### Cast Member Cards
- Grid layout (1-4 kolommen afhankelijk van schermgrootte)
- Hover effecten voor interactiviteit
- Quick-view badges voor fysieke eigenschappen
- Edit en Delete knoppen per card

### Modal Forms
- Twee-kolom layout voor overzicht
- Real-time preview van profielfoto
- Gestructureerde secties (Basic Info, Physical Characteristics)

## Toekomstige Uitbreidingen

De database is voorbereid voor:
- 📸 Continuïteitsfoto's per scene
- 👔 Wardrobe tracking met foto's
- 💄 Makeup details met referentiemateriaal
- ✂️ Haar en baardgroei tracking
- 📅 Scene-linking voor acteurs
- 📊 Continuïteitsrapporten

## Testing

Om de feature te testen:

1. Checkout de branch:
   ```bash
   git checkout Cast-management
   ```

2. Voer de database migratie uit in Supabase

3. Open `Cast.html?project=YOUR_PROJECT_ID` in browser

4. Klik op "Add Cast Member" om eerste acteur toe te voegen

5. Test:
   - Acteur aanmaken met en zonder foto
   - Zoekfunctie
   - Filters (A-Z, Recent)
   - Edit functionaliteit
   - Detail modal
   - Delete functionaliteit

## Industry Best Practices

Volgt professionele continuïteit praktijken uit:
- **België/Europa** - Contactinfo, flexibele scheduling
- **Hollywood** - Gedetailleerde fysieke documentatie, foto referenties
- **Universeel** - Non-chronologische opnames, kostuum wijzigingen, verouderingseffecten

## Support

Voor vragen of problemen:
- Zie [ACTORS_DOCUMENTATION.md](ACTORS_DOCUMENTATION.md) voor uitgebreide documentatie
- Check de demo data in `actorService.js`
- Review de database schema in `migration-add-Cast.sql`

## Merge naar Main

Wanneer getest en goedgekeurd:

```bash
git checkout main
git merge Cast-management
git push origin main
```

Vergeet niet de database migratie uit te voeren in productie!
