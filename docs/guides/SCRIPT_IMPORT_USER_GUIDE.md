# Script Import Feature - User Guide

## Overzicht

De script import feature maakt het mogelijk om complete scripts te importeren en automatisch scenes te extraheren. Dit bespaart tijd bij het opzetten van nieuwe projecten.

## Ondersteunde Formats

### Fountain (.fountain)
**Aanbevolen format** - Industry-standaard plain text screenplay format.

**Voordelen:**
- Deterministisch en betrouwbaar
- Ondersteunt alle screenplay elementen
- Character detectie werkt perfect
- Metadata (title, author) wordt automatisch geëxtraheerd

**Voorbeeld:**
```fountain
Title: My Script
Author: Your Name

===

INT. BEDROOM - DAY

JOHN wakes up.

JOHN
Good morning.
```

### Plain Text (.txt)
Klassieke screenplay formatting met INT/EXT headings.

**Let op:** 
- Iets minder betrouwbaar dan Fountain
- Scene headings moeten duidelijk zijn (ALL CAPS met INT/EXT)
- Character detectie werkt op basis van formatting

**Voorbeeld:**
```
INT. BEDROOM - DAY

John wakes up.

JOHN
Good morning.
```

## Hoe te Gebruiken

### Stap 1: Open Import Dialog

1. Ga naar de **Timeline** view
2. Klik op de **Import** knop in het dock (naast Add Scene)
3. De import dialog opent

### Stap 2: Upload Script

**Optie A: Drag & Drop**
- Sleep je .fountain of .txt bestand naar de drop zone

**Optie B: File Browser**
- Klik op de drop zone
- Selecteer je bestand

**Format Selectie:**
- **Auto-detect** (aanbevolen): herkent automatisch Fountain vs Plain Text
- **Fountain**: forceer Fountain parsing
- **Plain Text**: forceer plain text parsing

### Stap 3: Parse Script

1. Klik op **Parse Script**
2. Wacht terwijl het script wordt geanalyseerd
3. De preview grid verschijnt met alle gedetecteerde scenes

### Stap 4: Review & Edit Scenes

**Preview Grid:**
- Elk scene wordt getoond als een card
- ✅ Checkmark = scene wordt geïmporteerd
- ⚠️ Warning badge = low confidence of warnings

**Actions:**
- **Select All / Deselect All**: snel alle scenes aan/uitzetten
- **Click op card**: edit individuele scene (coming soon)
- **Checkbox**: toggle scene aan/uit

**Wat wordt getoond:**
- Scene nummer
- Heading (INT/EXT, locatie, time)
- Gedetecteerde characters
- Confidence score (bij lage scores)

### Stap 5: Import

1. Controleer de selected count (rechtsboven)
2. Klik op **Import X Scenes**
3. Bevestig de import
4. Scenes worden toegevoegd aan je timeline

## Tips & Best Practices

### Voor Beste Resultaten

1. **Gebruik Fountain format** waar mogelijk
2. **Consistente formatting**: houd scene headings uniform
3. **Duidelijke INT/EXT**: zorg dat elke scene een duidelijke INT/EXT heeft
4. **Scene nummers**: kunnen optioneel, worden anders automatisch gegenereerd

### Veelvoorkomende Problemen

**"Low confidence" warnings:**
- Scene heading is onduidelijk
- Ontbrekende INT/EXT designation
- Zeer lange heading
- Review de scene en pas aan indien nodig

**Scenes niet herkend:**
- Check of scene headings ALL CAPS zijn
- Zorg voor duidelijke INT/EXT markers
- Probeer Fountain format voor betere herkenning

**Characters niet gedetecteerd:**
- In Fountain: character names moeten voor dialogue staan
- In Plain Text: character names moeten all caps en gecentreerd zijn

## Wat Gebeurt Er Met Geïmporteerde Scenes?

### Database
Scenes worden opgeslagen met:
- Scene nummer (uit script of auto-generated)
- Description (volledige heading)
- INT/EXT designation
- Location
- Time of day
- Continuity (indien gedetecteerd)
- Story order (automatisch berekend)

### Timeline
- Scenes verschijnen aan het einde van de timeline
- Story order wordt automatisch berekend
- Drag & drop werkt normaal
- Edit functionaliteit is beschikbaar

### Characters
- Gedetecteerde characters worden NIET automatisch als Cast aangemaakt
- Dit komt in een toekomstige versie (character matching)
- Momenteel: je ziet welke characters zijn gedetecteerd, maar moet ze handmatig als Cast toevoegen

## Technische Details

### Parsing Methode

**Fountain:**
- Gebruikt fountain.js library (industry standard)
- 100% deterministisch (geen AI)
- Herkent alle Fountain syntax

**Plain Text:**
- Heuristic-based pattern matching
- Regex patterns voor scene headings
- Confidence scoring voor elke scene

### Data Traceerbaarheid
- Elke scene bevat source metadata (line numbers)
- Confidence score (0.0 - 1.0)
- Warnings array voor ambiguiteiten
- Raw text wordt bewaard (voor re-parse indien nodig)

### Performance
- 100+ scenes parsen: < 2 seconden
- Preview grid: virtuele scrolling (geen lag)
- Bulk import: single database transaction
- UI blijft responsive tijdens parsing

## Limitaties (Huidige Versie)

**Niet Ondersteund:**
- ❌ Final Draft (.fdx) format - komt in toekomstige versie
- ❌ PDF import
- ❌ Automatische Character-to-cast member matching
- ❌ Scene inhoud editing in preview (alleen select/deselect)
- ❌ Scene merging/splitting in preview

**Wel Ondersteund:**
- ✅ Fountain (.fountain)
- ✅ Plain text (.txt)
- ✅ Character detectie
- ✅ Scene heading parsing
- ✅ Bulk import (ongelimiteerd aantal scenes)
- ✅ Preview & selection

## Toekomstige Features

Geplande uitbreidingen:
1. **FDX Support**: Final Draft XML import
2. **Character Matching**: automatisch characters linken aan Cast
3. **Scene Editing**: individuele scenes bewerken in preview
4. **Scene Operations**: merge, split, reorder in preview
5. **Script Revisions**: re-import met change detection
6. **Multi-language**: betere support voor niet-Engelstalige scripts

## Troubleshooting

### Script wordt niet correct geparsed

**Probleem:** Te weinig scenes gedetecteerd

**Oplossing:**
1. Check scene heading format (INT/EXT present?)
2. Probeer format handmatig selecteren (Fountain vs Plain Text)
3. Open script in text editor en controleer formatting
4. Converteer naar Fountain format voor beste resultaten

### Karakters niet gedetecteerd

**Probleem:** Characters array is leeg

**Oplossing:**
1. Fountain: zorg dat character names voor dialogue staan
2. Plain text: character names moeten ALL CAPS zijn
3. Check of dialogue sections correct geformateerd zijn

### Import duurt lang

**Probleem:** Import van grote scripts is traag

**Oplossing:**
1. Scripts tot 500 scenes zijn normaal geen probleem
2. Bij > 500 scenes: overweeg script opsplitsen
3. Check browser console voor errors
4. Refresh de pagina en probeer opnieuw

### Duplicate scene numbers

**Probleem:** "Duplicate scene numbers" error

**Oplossing:**
1. Scene numbers moeten uniek zijn
2. Edit script om duplicates te verwijderen
3. Of: laat scene numbers weg, dan worden ze auto-generated

## Feedback & Support

Voor vragen, bugs, of feature requests:
- Check de documentatie in `docs/guides/`
- Bekijk de CHANGELOG.md voor recente wijzigingen
- Open een issue in de repository

## Zie Ook

- [Design Document](SCRIPT_IMPORT_DESIGN.md) - Technische architectuur
- [Scene Model](../frontend/docs/supabase-schema.sql) - Database schema
- [Fountain Spec](https://fountain.io/syntax) - Fountain format specificatie
