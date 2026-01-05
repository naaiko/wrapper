# Version Management System

## Overview

Dit project gebruikt **Semantic Versioning (SemVer)** volgens [semver.org](https://semver.org/).

## Versie Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes, incompatibele API wijzigingen, grote features
- **MINOR**: Nieuwe functionaliteit, backwards compatible
- **PATCH**: Bug fixes, kleine verbeteringen

## Hoe Versie Updaten

### 1. Update `frontend/js/version.js`

```javascript
export const version = {
    major: 1,
    minor: 0,
    patch: 0,  // ← Verhoog dit getal
    // ...
};
```

### 2. Update `package.json`

```json
{
  "version": "1.0.0"  // ← Zelfde versie als version.js
}
```

### 3. Commit met versienummer

```bash
git commit -m "v1.0.1: Fix scrollbar bug"
git tag v1.0.1
git push origin main --tags
```

## Versie Badge

Elke pagina toont automatisch een versie badge linksonder:
- Gebaseerd op `version.js`
- Hover voor details
- Automatisch ge-inject via module import

## Wanneer Welk Getal Verhogen?

### PATCH (1.0.0 → 1.0.1)
- Bug fixes
- Text/style tweaks
- Performance verbeteringen
- Documentation updates

### MINOR (1.0.0 → 1.1.0)
- Nieuwe features
- Nieuwe screens/views
- Nieuwe settings opties
- API uitbreidingen (backwards compatible)

### MAJOR (1.0.0 → 2.0.0)
- Database schema wijzigingen
- Breaking API changes
- Grote architectural changes
- Removal van deprecated features

## Huidige Versie Checken

### In Browser Console
```javascript
import { version } from './js/version.js';
console.log(version.full); // "1.0.0"
```

### Badge op Pagina
Kijk linksonder op elke pagina (Timeline, Calendar, Actors).

## Voorbeeld Changelog

```
v1.2.0 - 2026-01-05
  ✨ MINOR: Added actor management screen
  🐛 PATCH: Fixed timeline drag-and-drop
  ⚡ PATCH: Improved calendar performance

v1.1.0 - 2026-01-04
  ✨ MINOR: Added minimap to timeline
  🐛 PATCH: Fixed scene card rendering

v1.0.0 - 2026-01-03
  🎉 MAJOR: Initial production release
```

## Best Practices

1. **Altijd synchroon houden**: `version.js` en `package.json` moeten matchen
2. **Tag elke release**: `git tag v1.0.0` voor elke versie
3. **Beschrijvende commits**: Vermeld versie in commit message
4. **Test voor release**: Geen broken builds taggen
5. **Document changes**: Update deze guide bij major changes

## Files die Versie Gebruiken

- `frontend/js/version.js` - Centrale definitie
- `package.json` - npm package versie
- `frontend/timeline.html` - Badge inject
- `frontend/calendar.html` - Badge inject
- `frontend/actors.html` - Badge inject
- `frontend/js/timeline.js` - Import voor logging
- `frontend/js/calendar-toastui.js` - Import voor logging
- `frontend/js/actors.js` - Import voor logging
