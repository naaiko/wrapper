# Versioning System

## Overview

This project uses **Semantic Versioning** with automated changelog generation and release bundling.

**Critical Rule**: ALWAYS work in the next version folder. Never work directly in the current version.

## Version Files

- **`VERSION`** - Current production version (on main branch)
- **`NEXT_VERSION`** - Upcoming version being developed
- Branch name MUST include version number

## Folder Structure

```
docs/
  releases/
    v0.2.1/           # Current release on main
      README.md       # Release overview
      CHANGELOG.md    # Auto-generated from commits
      *.md           # Feature documentation
    v0.2.2/           # Next release (work in progress)
      README.md       # Release overview
      CHANGELOG.md    # Accumulated changes
      *.md           # Feature documentation
```

## Workflow

### 1. Start New Feature

```bash
# Read next version
$nextVersion = Get-Content NEXT_VERSION
# Create feature branch with version
git checkout -b "feature/v$nextVersion-feature-name"
```

### 2. During Development

**ALL documentation goes in the next version folder:**

```
docs/releases/v0.2.2/
  README.md                          # Release overview
  CHANGELOG.md                       # Accumulated changes
  FEATURE_NAME_IMPLEMENTATION.md     # Feature docs
  FEATURE_NAME_COMPLETE.md           # Completion checklist
```

**Database migrations go in:**

```
supabase/migrations/
  YYYYMMDDNNNNNN_feature_description.sql
```

### 3. Commit Messages

Follow **Conventional Commits** format:

```
feat: Add square actor cards to Cast Grid
fix: Resolve navigation module import error
docs: Update design system documentation
chore: Update dependencies
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 4. Pre-Push to Main

**Automated by git hook** (`.git/hooks/pre-push`):

1. Read `NEXT_VERSION` → `0.2.2`
2. Bundle all changes from `docs/releases/v0.2.2/`
3. Generate release notes from commits
4. Update `CHANGELOG.md` with new version
5. Create git tag `v0.2.2`
6. Update `VERSION` file to match `NEXT_VERSION`
7. Increment `NEXT_VERSION` to `0.2.3`
8. Create empty `docs/releases/v0.2.3/` folder

### 5. After Push to Main

```bash
# VERSION is now 0.2.2
# NEXT_VERSION is now 0.2.3
# docs/releases/v0.2.3/ is ready for next work
```

## Automation Scripts

### `scripts/version-bump.ps1`

Handles version bumping and release preparation.

```powershell
# Usage
.\scripts\version-bump.ps1 -Type minor  # 0.2.1 → 0.3.0
.\scripts\version-bump.ps1 -Type patch  # 0.2.1 → 0.2.2
.\scripts\version-bump.ps1 -Type major  # 0.2.1 → 1.0.0
```

### `scripts/generate-changelog.ps1`

Generates changelog from git commits.

```powershell
# Usage
.\scripts\generate-changelog.ps1 -FromTag v0.2.1 -ToTag HEAD
```

### `scripts/prepare-release.ps1`

Complete release preparation workflow.

```powershell
# Usage (run before pushing to main)
.\scripts\prepare-release.ps1
```

This will:
1. Validate all migrations are documented
2. Validate all features have documentation
3. Generate changelog from commits
4. Update version files
5. Create release tag
6. Prepare next version folder

## Git Hooks

### Pre-Push Hook

Located at `.git/hooks/pre-push`

Automatically runs `scripts/prepare-release.ps1` when pushing to `main`.

### Pre-Commit Hook

Located at `.git/hooks/pre-commit`

Validates:
- Commit message follows Conventional Commits
- All new features have documentation in next version folder
- Migration files follow naming convention

## Version Numbering

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0) - Breaking changes, incompatible API changes
- **MINOR** (0.2.0) - New features, backwards compatible
- **PATCH** (0.2.1) - Bug fixes, backwards compatible

**Current Strategy**: Minor releases for features, patch for fixes.

## Documentation Requirements

### For Each Feature

Every feature MUST have in `docs/releases/vX.Y.Z/`:

1. **README.md** - Release overview with feature list
2. **CHANGELOG.md** - Accumulated changes (auto-generated from commits)
3. **FEATURE_IMPLEMENTATION.md** - Implementation details (for significant features)
4. **FEATURE_COMPLETE.md** - Testing checklist (for significant features)
5. **MIGRATIONS.md** - Complete migration documentation (if database changes)
6. **RUN_MIGRATIONS.md** - Step-by-step migration instructions (if database changes)

### For Each Migration

Every migration MUST:

1. Be in `supabase/migrations/` with format `YYYYMMDDNNNNNN_description.sql`
2. Be documented in `docs/releases/vX.Y.Z/MIGRATIONS.md` with:
   - Purpose and schema changes
   - Execution order
   - Rollback instructions
   - Impact analysis
   - Verification queries
   - Testing checklist
3. Be referenced in `docs/releases/vX.Y.Z/README.md`
4. Have step-by-step instructions in `docs/releases/vX.Y.Z/RUN_MIGRATIONS.md`
5. Be referenced in `CHANGELOG.md` under Technical section

## Branch Naming Convention

Format: `type/vX.Y.Z-description`

Examples:
- `feature/v0.2.2-design-system`
- `fix/v0.2.2-actor-card-height`
- `docs/v0.2.2-versioning-system`

**Required**: Version number MUST match `NEXT_VERSION` file.

## Release Checklist

Before pushing to main:

- [ ] All commits follow Conventional Commits format
- [ ] All features documented in `docs/releases/vX.Y.Z/`
- [ ] All migrations in `supabase/migrations/` with proper naming
- [ ] Migrations referenced in README.md and RUN_MIGRATIONS.md
- [ ] CHANGELOG.md updated (auto-generated)
- [ ] Version files updated (auto)
- [ ] Git tag created (auto)
- [ ] Next version folder prepared (auto)

## Manual Override

If automation fails, manual steps:

```powershell
# 1. Read next version
$nextVersion = Get-Content NEXT_VERSION
$currentVersion = Get-Content VERSION

# 2. Update CHANGELOG.md
# Add section for $nextVersion at the top

# 3. Update VERSION file
Set-Content VERSION $nextVersion

# 4. Create git tag
git tag "v$nextVersion"

# 5. Increment NEXT_VERSION
# 0.2.2 → 0.2.3
$parts = $nextVersion.Split('.')
$parts[2] = [int]$parts[2] + 1
$newNext = $parts -join '.'
Set-Content NEXT_VERSION $newNext

# 6. Create next release folder
New-Item -ItemType Directory "docs\releases\v$newNext"

# 7. Create template files
Copy-Item "docs\releases\.template\*" "docs\releases\v$newNext\"
```

## Integration with CHANGELOG.md

The root `CHANGELOG.md` is the source of truth. Format:

```markdown
# Changelog

## [Unreleased]
- Features being worked on in NEXT_VERSION

## [0.2.2] - YYYY-MM-DD
### Added
- Feature 1
- Feature 2

### Fixed
- Bug 1

### Technical
- Migration 1
- Migration 2

## [0.2.1] - 2026-01-06
...
```

## AI Assistant Instructions

**CRITICAL - ALWAYS FOLLOW**:

1. **Check NEXT_VERSION** at start of every session
2. **Create/update documentation** in `docs/releases/vX.Y.Z/` (next version)
3. **Name migrations** as `YYYYMMDDNNNNNN_description.sql`
4. **Reference migrations** in README.md and RUN_MIGRATIONS.md
5. **Use Conventional Commits** in all commit messages
6. **Never work in current version folder** - always in NEXT_VERSION folder
7. **Bundle branch name** with version number
8. **Validate** before suggesting push to main

## Future Enhancements

- [ ] GitHub Actions workflow for automated releases
- [ ] Automatic migration verification before release
- [ ] Changelog generation from commit messages
- [ ] Release notes email generation
- [ ] Version compatibility matrix

---

**Status**: ✅ Active System  
**Last Updated**: 2026-01-06  
**Current Version**: 0.2.1  
**Next Version**: 0.2.2
