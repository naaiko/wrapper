# AI ASSISTANT - READ THIS FIRST

## ⚠️ CRITICAL - ALWAYS FOLLOW THESE RULES

### Version Management

**BEFORE ANY WORK**:

1. Read `NEXT_VERSION` file → Current: **0.2.2**
2. Read `VERSION` file → Production: **0.2.1**
3. Check current branch name should include version

**ALL WORK GOES IN**: `docs/releases/v0.2.2/`

### Documentation Requirements

**EVERY feature/fix MUST have**:

1. Entry in `docs/releases/v0.2.2/CHANGELOG.md`
2. Reference in `docs/releases/v0.2.2/README.md`
3. Implementation details if significant

### Migration Files

**FORMAT**: `YYYYMMDDNNNNNN_description.sql`

**LOCATION**: `supabase/migrations/` (single source of truth)

**DOCUMENTATION** (reference migrations in release docs):
- Create `docs/releases/v0.2.2/MIGRATIONS.md` with full details
- Create `docs/releases/v0.2.2/RUN_MIGRATIONS.md` with instructions
- Reference in `docs/releases/v0.2.2/README.md`
- Add to `CHANGELOG.md` under Technical section

**MIGRATIONS.md should include**:
- Migration overview and purpose
- Schema changes (ADD COLUMN, indexes, etc.)
- Execution order
- Rollback instructions
- Impact analysis (backwards compatible?)
- Verification queries
- Testing checklist

### Commit Messages

**USE CONVENTIONAL COMMITS**:

```
feat: Add square actor cards
fix: Correct placeholder card height  
docs: Update design system documentation
chore: Update dependencies
```

### Branch Naming

**FORMAT**: `type/v0.2.2-description`

Examples:
- `feature/v0.2.2-design-system`
- `fix/v0.2.2-card-height`
- `docs/v0.2.2-versioning`

### Before Push to Main

**RUN**: `.\scripts\prepare-release.ps1`

This will:
- Generate changelog from commits
- Update VERSION to 0.2.2
- Create tag v0.2.2
- Increment NEXT_VERSION to 0.2.3
- Create v0.2.3 folder
- Copy templates

### File Locations Reference

```
📁 Project Root
├── VERSION (0.2.1 - production)
├── NEXT_VERSION (0.2.2 - working)
├── CHANGELOG.md (master changelog)
├── VERSIONING.md (read this for workflow)
├── DESIGN_SYSTEM.md (universal patterns)
├── docs/
│   └── releases/
│       ├── .template/ (templates for new releases)
│       ├── v0.2.1/ (production release)
│       └── v0.2.2/ (current work) ← YOU ARE HERE
│           ├── README.md
│           ├── CHANGELOG.md
│           └── *.md (feature docs)
├── supabase/
│   └── migrations/
│       └── YYYYMMDDNNNNNN_*.sql
└── scripts/
    └── prepare-release.ps1
```

### Quick Checklist

Before suggesting any changes:

- [ ] Checked NEXT_VERSION (should be 0.2.2)
- [ ] All docs go in v0.2.2 folder
- [ ] Migrations named with YYYYMMDDNNNNNN
- [ ] Migrations documented in README
- [ ] Changes logged in v0.2.2/CHANGELOG.md
- [ ] Commit message follows Conventional Commits
- [ ] Branch name includes v0.2.2

### Common Mistakes to Avoid

❌ **DON'T**:
- Work in v0.2.1 or current version folder
- Create migrations without YYYYMMDDNNNNNN prefix
- Forget to document migrations
- Use generic commit messages
- Skip CHANGELOG.md updates

✅ **DO**:
- Always work in NEXT_VERSION folder
- Use proper migration naming
- Document everything
- Use Conventional Commits
- Keep CHANGELOG.md updated

---

**Current State**:
- Production: v0.2.1
- Working: v0.2.2 (feature/v0.2.2-design-system)
- Next: v0.2.3 (will be created on release)

**Last Updated**: 2026-01-06
