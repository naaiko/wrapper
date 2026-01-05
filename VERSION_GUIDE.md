# Version Management System

## 🚨 IMPORTANT: Release Notes Are Mandatory

**Every version change MUST be accompanied by release notes!**

See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) for the complete mandatory process.

## Overview

Dit project gebruikt **Semantic Versioning (SemVer)** volgens [semver.org](https://semver.org/).

All changes are tracked in:
- **CHANGELOG.md** - Human-readable changelog
- **releases.json** - Machine-readable release data

## Versie Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes, incompatibele API wijzigingen, grote features
- **MINOR**: Nieuwe functionaliteit, backwards compatible
- **PATCH**: Bug fixes, kleine verbeteringen

## 📋 Quick Release Checklist

Before committing a version bump:

- [ ] Updated `frontend/js/version.js`
- [ ] Updated `package.json`
- [ ] Added entry to `CHANGELOG.md`
- [ ] Added entry to `releases.json`
- [ ] Created git tag `vX.Y.Z`
- [ ] Pushed commits and tags

**⚠️ Skip ANY step = Invalid release!**

## Hoe Versie Updaten

### 1. Update `frontend/js/version.js`

```javascript
export const version = {
    major: 0,
    minor: 2,
    patch: 0,  // ← Verhoog het juiste getal
    // ...
};
```

### 2. Update `package.json`

```json
{
  "version": "0.2.0"  // ← Zelfde versie als version.js
}
```

### 3. Update `CHANGELOG.md`

Add a new section with your changes:

```markdown
## [0.2.0] - 2026-01-06

### Added
- New feature 1
- New feature 2

### Fixed
- Bug fix 1
```

### 4. Update `releases.json`

Add a new release object (at the start of the releases array):

```json
{
  "version": "0.2.0",
  "date": "2026-01-06",
  "name": "Release Name",
  "type": "minor",
  "features": ["Feature 1", "Feature 2"],
  "bugfixes": ["Bug fix 1"]
}
```

### 5. Commit met versienummer

```bash
git commit -m "chore: Release v0.2.0

- Updated version.js to 0.2.0
- Updated package.json to 0.2.0
- Added release notes to CHANGELOG.md
- Updated releases.json
"
git tag -a v0.2.0 -m "Release version 0.2.0"
git push origin branch-name
git push origin v0.2.0
```

## Versie Badge

Elke pagina toont automatisch een versie badge linksonder:
- Gebaseerd op `version.js`
- Hover voor details
- Click to show release notes (via ReleaseNotes.showModal())
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
