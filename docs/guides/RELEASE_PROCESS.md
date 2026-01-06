# Release Process Guide

This document describes the mandatory release process for this project. Every version change **MUST** be accompanied by proper release notes.

## 📋 Release Checklist

When bumping a version, you **MUST** complete all these steps:

### 1. Update Version Number

Edit these files:
- [ ] `frontend/js/version.js` - Update major/minor/patch
- [ ] `package.json` - Update version field

### 2. Create Release Notes

#### A. Update CHANGELOG.md

Add a new section following the [Keep a Changelog](https://keepachangelog.com/) format:

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
```

**Categories to use:**
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes
- **Technical** - Internal improvements, refactoring
- **Documentation** - Documentation updates

#### B. Update releases.json

Add a new release object to the `releases` array (at the beginning):

```json
{
  "version": "X.Y.Z",
  "date": "YYYY-MM-DD",
  "name": "Release Name",
  "type": "major|minor|patch",
  "branch": "branch-name",
  "commits": ["commit-hash"],
  "features": [
    "Feature 1",
    "Feature 2"
  ],
  "bugfixes": [
    "Bug fix 1"
  ],
  "technical": [
    "Technical change 1"
  ],
  "breaking": [],
  "deprecated": [],
  "documentation": [
    "Doc file 1"
  ]
}
```

### 3. Commit & Tag

```bash
# Stage all changes
git add -A

# Commit with conventional commit message
git commit -m "chore: Release v X.Y.Z

- Updated version.js to X.Y.Z
- Updated package.json to X.Y.Z
- Added release notes to CHANGELOG.md
- Updated releases.json
"

# Create git tag
git tag -a vX.Y.Z -m "Release version X.Y.Z"

# Push commits and tags
git push origin branch-name
git push origin vX.Y.Z
```

### 4. Merge to Main (if on feature branch)

```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feature-branch-name

# Push to main
git push origin main
```

## 🔢 Version Numbering

We follow [Semantic Versioning](https://semver.org/):

### Format: MAJOR.MINOR.PATCH

- **MAJOR** (X.0.0) - Incompatible API changes, major features
  - Example: Complete UI redesign, breaking database changes
  - Increment when: Breaking changes that require migration
  
- **MINOR** (0.X.0) - New functionality, backwards compatible
  - Example: New feature, new component, new page
  - Increment when: Adding features without breaking existing code
  
- **PATCH** (0.0.X) - Bug fixes, small improvements
  - Example: Bug fixes, performance improvements, small tweaks
  - Increment when: Fixing bugs or making small improvements

### Current Version Strategy

Since we're in **0.x.x** (pre-1.0), we use:
- **0.X.0** for significant features
- **0.0.X** for bug fixes and small improvements

## 📝 Conventional Commit Messages

Use these prefixes for commit messages:

- `feat:` - New feature (bumps MINOR in 0.x.x)
- `fix:` - Bug fix (bumps PATCH)
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, version bumps
- `build:` - Build system changes
- `ci:` - CI configuration changes

### Examples:

```bash
git commit -m "feat: Add cast grid view with polaroid cards"
git commit -m "fix: Prevent iOS zoom on input focus"
git commit -m "docs: Update README with new features"
git commit -m "chore: Release v0.2.0"
```

## 🚨 Pre-Commit Validation

Before committing, always check:

1. **Did you update version.js?**
   - If YES → Continue to step 2
   - If NO → Only commit if this is not a release

2. **Did you update CHANGELOG.md?**
   - If YES → Continue to step 3
   - If NO → STOP! Add changelog entry first

3. **Did you update releases.json?**
   - If YES → Safe to commit
   - If NO → STOP! Add release entry first

## 📦 Release Types & Examples

### Patch Release (0.2.0 → 0.2.1)

**When:**
- Bug fixes
- Small improvements
- Performance tweaks
- Documentation updates

**Example:**
```bash
# 1. Update versions
# version.js: patch: 0 → 1
# package.json: "0.2.1"

# 2. Add to CHANGELOG.md
## [0.2.1] - 2026-01-07
### Fixed
- Fixed photo upload not working on Safari
- Fixed grid layout on narrow screens

# 3. Add to releases.json
{
  "version": "0.2.1",
  "type": "patch",
  "bugfixes": ["Safari photo upload", "Grid layout fix"]
}

# 4. Commit & tag
git commit -m "fix: Safari photo upload and grid layout issues"
git tag -a v0.2.1 -m "Release version 0.2.1"
```

### Minor Release (0.2.0 → 0.3.0)

**When:**
- New features
- New components
- New pages
- Significant enhancements

**Example:**
```bash
# 1. Update versions
# version.js: minor: 2 → 3, patch: 0
# package.json: "0.3.0"

# 2. Add to CHANGELOG.md
## [0.3.0] - 2026-01-15
### Added
- Bulk Cast Member operations
- Advanced filtering system
- Export to PDF

# 3. Add to releases.json
{
  "version": "0.3.0",
  "type": "minor",
  "features": ["Bulk operations", "Advanced filters", "PDF export"]
}

# 4. Commit & tag
git commit -m "feat: Add bulk operations and advanced filtering"
git tag -a v0.3.0 -m "Release version 0.3.0"
```

### Major Release (0.3.0 → 1.0.0)

**When:**
- Breaking changes
- Complete rewrites
- API changes
- Production ready milestone

**Example:**
```bash
# 1. Update versions
# version.js: major: 0 → 1, minor: 0, patch: 0
# package.json: "1.0.0"

# 2. Add to CHANGELOG.md
## [1.0.0] - 2026-02-01
### Breaking
- New authentication system (requires re-login)
- Updated database schema (migration required)

### Added
- Production-ready deployment
- Complete test coverage

# 3. Add to releases.json
{
  "version": "1.0.0",
  "type": "major",
  "breaking": ["New auth system", "Database migration"],
  "features": ["Production deployment", "Test coverage"]
}

# 4. Commit & tag
git commit -m "chore: Release v1.0.0 - Production Ready"
git tag -a v1.0.0 -m "Release version 1.0.0 - Production Ready"
```

## 🔧 Tools & Utilities

### Version Checker

Use this in your code to check version:

```javascript
import { version } from './version.js';
console.log(version.full); // "0.2.0"
```

### Release Notes Viewer

Show release notes to users:

```javascript
import ReleaseNotes from './utils/releaseNotes.js';

// Show latest release
await ReleaseNotes.showModal();

// Show specific version
await ReleaseNotes.showModal('0.2.0');
```

### Check if Version Has Notes

```javascript
const hasNotes = await ReleaseNotes.hasReleaseNotes('0.2.0');
if (!hasNotes) {
  console.error('Missing release notes for v0.2.0!');
}
```

## 📊 Release History

See [CHANGELOG.md](./CHANGELOG.md) for full release history.

## ❌ What NOT to Do

1. **Never bump version without updating CHANGELOG.md**
2. **Never bump version without updating releases.json**
3. **Never merge to main without release notes**
4. **Never skip the git tag when releasing**
5. **Never reuse version numbers**

## ✅ Quick Reference

**Before every release commit:**
```
□ Updated version.js
□ Updated package.json
□ Added entry to CHANGELOG.md
□ Added entry to releases.json
□ Committed with "chore: Release vX.Y.Z" message
□ Created git tag vX.Y.Z
□ Pushed commits and tags
```

## 🆘 Need Help?

- Check existing releases in CHANGELOG.md for examples
- Review releases.json structure
- Follow the version numbering guide above
- When in doubt, ask before releasing!

---

**Remember:** Good release notes help everyone understand what changed and why. Take the time to document properly! 📝
