# 📝 Integrated Release Notes System

## Overview

Dit project heeft een **verplicht** release notes systeem dat automatisch elke versie wijziging documenteert.

## 🎯 Key Features

- **Mandatory Documentation**: Elke versie change vereist release notes
- **Dual Format**: CHANGELOG.md (human) + releases.json (machine)
- **Automatic Validation**: Script checkt of release notes compleet zijn
- **Interactive UI**: Version badge toont release notes via modal
- **Git Integration**: Versie tags gekoppeld aan release notes

## 📁 Files

### Core Files
- **CHANGELOG.md** - Human-readable changelog (Keep a Changelog format)
- **releases.json** - Machine-readable release data (JSON)
- **RELEASE_PROCESS.md** - Complete mandatory release process guide
- **VERSION_GUIDE.md** - Quick reference for version updates

### Utilities
- **validate-release.js** - Validation script (run voor commit)
- **frontend/js/utils/releaseNotes.js** - Release notes viewer utility
- **frontend/js/version.js** - Version management + interactive badge

## 🚀 Quick Start

### 1. Making a Release

```bash
# 1. Update version
# Edit: frontend/js/version.js (bump major/minor/patch)
# Edit: package.json (same version)

# 2. Document changes
# Edit: CHANGELOG.md (add new section)
# Edit: releases.json (add new release object)

# 3. Validate
npm run validate-release

# 4. Commit & tag
git commit -m "chore: Release vX.Y.Z"
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin branch-name
git push origin vX.Y.Z
```

### 2. Validation Before Commit

```bash
npm run validate-release
```

This checks:
- ✓ version.js matches package.json
- ✓ CHANGELOG.md has entry for version
- ✓ releases.json has entry for version

### 3. Viewing Release Notes

**In UI:**
- Click version badge (bottom-left corner)
- Modal shows release notes for current version

**Programmatically:**
```javascript
import ReleaseNotes from './utils/releaseNotes.js';

// Show latest release
await ReleaseNotes.showModal();

// Show specific version
await ReleaseNotes.showModal('0.2.0');

// Get release data
const latest = await ReleaseNotes.getLatest();
const all = await ReleaseNotes.getReleases();
```

## 📋 Release Process Checklist

Before every release commit:

```
□ Updated version.js (major/minor/patch)
□ Updated package.json (version field)
□ Added section to CHANGELOG.md
□ Added object to releases.json
□ Ran: npm run validate-release (✓ passed)
□ Committed with: "chore: Release vX.Y.Z"
□ Created git tag: vX.Y.Z
□ Pushed commits and tags
```

## 📊 CHANGELOG.md Format

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature 1
- New feature 2

### Changed
- Changed behavior 1

### Fixed
- Bug fix 1
- Bug fix 2

### Technical
- Internal improvement 1

### Breaking
- Breaking change 1 (only for MAJOR)
```

### Categories:
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes
- **Technical** - Internal improvements
- **Documentation** - Docs updates
- **Breaking** - Breaking changes (MAJOR version)

## 📦 releases.json Format

```json
{
  "releases": [
    {
      "version": "X.Y.Z",
      "date": "YYYY-MM-DD",
      "name": "Release Name",
      "type": "major|minor|patch",
      "branch": "feature-branch",
      "commits": ["hash1", "hash2"],
      "features": ["Feature 1", "Feature 2"],
      "bugfixes": ["Bug fix 1"],
      "technical": ["Internal change 1"],
      "breaking": [],
      "deprecated": [],
      "documentation": ["DOC.md"]
    }
  ],
  "unreleased": {
    "features": [],
    "bugfixes": [],
    "technical": []
  }
}
```

## 🔢 Semantic Versioning

```
MAJOR.MINOR.PATCH
```

### When to Bump:

**PATCH (0.2.0 → 0.2.1)**
- Bug fixes
- Small improvements
- Performance tweaks
- No new features

**MINOR (0.2.0 → 0.3.0)**
- New features
- New components/pages
- Backwards compatible changes
- Most releases in 0.x.x

**MAJOR (0.9.0 → 1.0.0)**
- Breaking changes
- API changes requiring migration
- Complete rewrites
- Production-ready milestone

## 🛠️ Tools & Commands

### Validation
```bash
npm run validate-release
```

### View Changelog
```bash
cat CHANGELOG.md
# or
code CHANGELOG.md
```

### Check Git Tags
```bash
git tag -l
```

### View Specific Release
```bash
git show v0.2.0
```

## 🎨 UI Integration

### Version Badge

Every page shows a version badge (bottom-left):
- **Hover**: Shows tooltip
- **Click**: Opens release notes modal
- **Auto-updates**: Reads from version.js

### Release Notes Modal

Modal shows:
- Version number with badge
- Release date and type
- Features (green icon)
- Bug fixes (yellow icon)
- Breaking changes (red icon)
- Technical details (collapsible)

## ❌ Common Mistakes to Avoid

1. ❌ Bumping version without updating CHANGELOG.md
2. ❌ Bumping version without updating releases.json
3. ❌ Mismatched versions in version.js and package.json
4. ❌ Forgetting to create git tag
5. ❌ Wrong date format (use YYYY-MM-DD)
6. ❌ Empty features/bugfixes arrays in releases.json
7. ❌ Not running validate-release before commit

## ✅ Best Practices

1. ✅ Write clear, concise release notes
2. ✅ Use conventional commit messages
3. ✅ Run validate-release before every commit
4. ✅ Tag releases immediately after commit
5. ✅ Keep CHANGELOG.md up to date
6. ✅ Document breaking changes clearly
7. ✅ Test release notes modal locally

## 📚 Full Documentation

- **RELEASE_PROCESS.md** - Complete step-by-step guide
- **VERSION_GUIDE.md** - Quick version update reference
- **CHANGELOG.md** - Full release history
- **releases.json** - Machine-readable releases

## 🆘 Need Help?

1. Check existing releases in CHANGELOG.md for examples
2. Read RELEASE_PROCESS.md for detailed instructions
3. Run `npm run validate-release` to see what's missing
4. Look at releases.json structure for format

## 🎯 Example Workflow

```bash
# You're working on a new feature
git checkout -b feature-cool-thing

# ... make changes ...

# Ready to release? Update version
# 1. Edit frontend/js/version.js: minor: 2 → 3
# 2. Edit package.json: "0.3.0"

# Document your changes
# 3. Add to CHANGELOG.md:
## [0.3.0] - 2026-01-10
### Added
- Cool new thing

# 4. Add to releases.json (beginning of releases array):
{
  "version": "0.3.0",
  "date": "2026-01-10",
  "name": "Cool Thing Feature",
  "type": "minor",
  "features": ["Cool new thing"]
}

# Validate before commit
npm run validate-release
# ✓ All checks passed!

# Commit & tag
git add -A
git commit -m "chore: Release v0.3.0"
git tag -a v0.3.0 -m "Release version 0.3.0"
git push origin feature-cool-thing
git push origin v0.3.0

# Merge to main
git checkout main
git merge feature-cool-thing
git push origin main
```

---

**Remember:** Consistent, clear release notes help everyone understand the evolution of the project! 📝✨
