# Demo & Test Scripts

Realistische testbestanden voor script import feature development, QA en demos.

## Folderstructuur

```
docs/resources/scripts/
├── fountain/          # Fountain format scripts
├── plain-text/        # Plain text screenplay format
├── fdx/              # Final Draft XML (future)
└── pdf/              # PDF scripts (future)
```

---

## Fountain Scripts

### 1. brick-and-steel.fountain

**Formaat:** Fountain  
**Herkomst:** Gebaseerd op het originele "Brick & Steel" voorbeeld door Stu Maschwitz (Fountain.io referentiescript)  
**Doel:** Volledig voorbeeld van correct Fountain format met alle elementen

**Wat de parser herkent:**
- ✅ Title page metadata (Title, Author, Draft date, Contact)
- ✅ 13 scenes met correct INT/EXT
- ✅ Character names: BRICK, STEEL, MARCUS, PAWNBROKER, BOUNCER
- ✅ Dialogue met parentheticals (whispering), (lying), (V.O.)
- ✅ Scene transitions (FADE IN, FADE OUT, CONTINUOUS)
- ✅ Action lines
- ✅ Proper formatting throughout

**Verwachte resultaten:**
- 13 scenes extracted
- 5 unique characters
- Confidence: 0.9-1.0 voor alle scenes
- Geen warnings

**Gebruik voor:**
- Happy path testing
- Demo presentaties
- Volledige feature showcase

---

### 2. big-fish.fountain

**Formaat:** Fountain  
**Herkomst:** Industry-sized professional screenplay  
**Doel:** Performance testing met realistisch groot script

**Wat de parser herkent:**
- ✅ Volledig professioneel screenplay
- ✅ Meerdere characters en locaties
- ✅ Complex scene structuur
- ✅ Uitgebreide dialogue en action

**Verwachte resultaten:**
- Veel scenes extracted
- Meerdere characters
- Performance test: parsing duurt enkele seconden
- Loading indicator moet zichtbaar zijn

**Gebruik voor:**
- Performance testing
- Loading state validation
- Real-world script size testing
- Stress testing van parser

---

### 3. the-short-film.fountain

**Formaat:** Fountain  
**Herkomst:** Origineel demo script  
**Doel:** Compact voorbeeld voor snelle tests

**Wat de parser herkent:**
- ✅ Title page (Title, Author, Draft date)
- ✅ 5 scenes met INT/EXT
- ✅ Character names: SARAH, JAMES
- ✅ Phone dialogue (V.O.)
- ✅ CONTINUOUS time marker
- ✅ Parentheticals (to herself, into phone, sitting, smiling, shrugging)

**Verwachte resultaten:**
- 5 scenes extracted
- 2 unique characters
- Confidence: 1.0
- Geen warnings

**Gebruik voor:**
- Snelle tests
- Demo's met korte flow
- Character detection testing

---

## Plain Text Scripts

### 4. the-meeting.txt

**Formaat:** Plain text screenplay  
**Herkomst:** Origineel  
**Doel:** Clean plain text met consistent formatting

**Wat de parser herkent:**
- ✅ Scene headings (INT. OFFICE, INT. HALLWAY)
- ✅ Character names: JOHN, MARY, TOM
- ✅ Dialogue
- ✅ Basic scene structure
- ⚠️ Sommige headings hebben geen DAY/NIGHT specificatie

**Verwachte resultaten:**
- 4 scenes extracted
- 3 unique characters
- Confidence: 0.8-0.9
- Mogelijk warnings: missing time of day

**Gebruik voor:**
- Plain text format testing
- Heuristic parser validation

---

### 4. messy-script.txt

**Formaat:** Plain text (inconsistent)  
**Herkomst:** Origineel  
**Doel:** Edge case - slordig geformatteerd script zoals vaak voorkomt bij IMSDb downloads

**Wat de parser herkent:**
- ⚠️ Scenes zonder INT/EXT (CAFE - DAY, STREET, PARK - LATER)
- ✅ Character names: ALICE, BOB
- ⚠️ Inconsistente indentatie
- ⚠️ Sommige scene headings zonder tijd

**Verwachte resultaten:**
- 3-4 scenes detected (afhankelijk van heuristieken)
- 2 unique characters
- Confidence: 0.4-0.7 (low)
- Warnings: 
  - Missing INT/EXT designations
  - Inconsistent formatting
  - Ambiguous scene headings

**Gebruik voor:**
- Robustness testing
- Error handling validation
- Low confidence scoring
- Warning system testing

---

### 5. edge-case-script.txt

**Formaat:** Plain text  
**Herkomst:** Origineel  
**Doel:** Stress test met extreme edge cases

**Wat de parser moet handelen:**
- ⚠️ Scene zonder heading (eerste blok)
- ✅ Scene numbers met prefix (1., 2A.)
- ✅ Compound INT/EXT varianten (INT/EXT, I/E)
- ⚠️ Multiple descriptors (MOVING, DREAM SEQUENCE)
- ⚠️ Special scenes (FLASHBACK, MONTAGE, OMITTED)
- ⚠️ Extra tijd info (1995, CREDITS SEQUENCE)
- ✅ Character with (O.S.) marker

**Verwachte resultaten:**
- 7-9 scenes detected (sommige edge cases worden mogelijk overgeslagen)
- 3-4 characters (ALEX, PERSON, TEACHER, MYSTERIOUS VOICE)
- Confidence: 0.3-0.8 (mixed)
- Warnings:
  - Very long scene headings
  - Ambiguous scene structure
  - Special formatting detected
  - Possible missing scenes

**Gebruik voor:**
- Edge case validation
- Parser limits testing
- Error recovery testing
- Future improvements prioritization

---

## FDX Scripts (Future)

Folder voorbereid voor Final Draft XML samples.

**Planned:**
- Sample .fdx bestand van Final Draft website
- Converter test cases

---

## PDF Scripts (Future)

Folder voorbereid voor PDF samples.

**Planned:**
- Text extraction testing
- Warning generation voor unsupported format

---

## Gebruik in Development

### Manual Testing
1. Open timeline
2. Klik "Import"
3. Upload één van deze bestanden
4. Verificeer parsing results tegen verwachte output

### Automated Testing (Future)
```javascript
// Example test
test('Parse brick-and-steel.fountain', () => {
    const result = parseScript(brickAndSteelContent);
    expect(result.scenes.length).toBe(13);
    expect(result.metadata.characters.length).toBe(5);
});
```

### Demo Mode
Scripts zijn beschikbaar als demo's in de UI (zie demo integration sectie).

---

## Licensing & Attribution

**Brick & Steel:**
- Original concept by Stu Maschwitz (Fountain.io)
- Recreated for educational/demo purposes
- Public domain screenplay format

**Other scripts:**
- Original content
- Created specifically for testing
- Free to use for development/testing

---

## Maintenance

Bij updates aan de parser:
1. Test tegen alle scripts
2. Documenteer nieuwe edge cases
3. Add nieuwe testbestanden indien nodig
4. Update expected results

---

## Contributing

Nieuwe testbestanden toevoegen:
1. Plaats in juiste format folder
2. Update deze README met:
   - Formaat & herkomst
   - Parsing verwachtingen
   - Use cases
3. Geen binaries (gebruik text-based formats)
4. Behoud originele formatting
