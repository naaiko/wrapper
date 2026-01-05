# Documentation Index

Welcome to the Continuity Manager documentation! All documentation is organized by release version and category.

## 📖 Quick Links

- **[README](../../README.md)** - Project overview and setup
- **[CHANGELOG](../../CHANGELOG.md)** - Complete release history
- **[Release Browser](../../releases.json)** - Machine-readable releases

## 📚 Guides

General documentation and process guides:

- **[RELEASE_PROCESS.md](guides/RELEASE_PROCESS.md)** - How to create a release
- **[RELEASE_NOTES_SYSTEM.md](guides/RELEASE_NOTES_SYSTEM.md)** - Release system overview
- **[VERSION_GUIDE.md](guides/VERSION_GUIDE.md)** - Quick version update guide
- **[SPACING_SYSTEM.md](guides/SPACING_SYSTEM.md)** - UI spacing guidelines
- **[SVG_UTILITIES_DOCUMENTATION.md](guides/SVG_UTILITIES_DOCUMENTATION.md)** - SVG helper utilities
- **[SVG_LOADING_CRITICAL.md](guides/SVG_LOADING_CRITICAL.md)** - SVG loading best practices
- **[SORTABLEJS_IMPLEMENTATION.md](guides/SORTABLEJS_IMPLEMENTATION.md)** - Drag & drop implementation
- **[PINK_MODE_ANIMATIONS.md](guides/PINK_MODE_ANIMATIONS.md)** - Pink mode animations
- **[IMPLEMENTATION_SUMMARY.md](guides/IMPLEMENTATION_SUMMARY.md)** - Overall implementation summary
- **[EDIT_SCREEN_ARCHITECTURE.md](guides/EDIT_SCREEN_ARCHITECTURE.md)** - Edit screen architecture
- **[CALENDAR_SETUP.md](guides/CALENDAR_SETUP.md)** - Calendar integration guide
- **[USER_PROJECT_BRANCH_README.md](guides/USER_PROJECT_BRANCH_README.md)** - User/project branch docs

## 📦 Release-Specific Documentation

Documentation organized by version number:

### [v0.2.1](releases/v0.2.1/) - 2026-01-06
**Release Browser & Documentation Organization**

- Release browser with search
- Documentation reorganization
- Enhanced release notes system

### [v0.2.0](releases/v0.2.0/) - 2026-01-06
**Cast Grid Feature**

- **[CAST_GRID_COMPLETE.md](releases/v0.2.0/CAST_GRID_COMPLETE.md)** - Complete feature documentation
- **[CAST_GRID_IMPLEMENTATION_PLAN.md](releases/v0.2.0/CAST_GRID_IMPLEMENTATION_PLAN.md)** - 8-phase implementation plan

Features:
- Polaroid-style grid view
- Filter, sort, search functionality
- Quick add with photo upload
- Actor detail screen with navigation
- Touch swipe and keyboard shortcuts
- Toast notifications

### [v0.1.0](releases/v0.1.0/) - 2026-01-05
**Initial Release with Version System**

- **[ACTORS_DOCUMENTATION.md](releases/v0.1.0/ACTORS_DOCUMENTATION.md)** - Actor system documentation
- **[ACTORS_FEATURE_README.md](releases/v0.1.0/ACTORS_FEATURE_README.md)** - Actor feature overview
- **[SCENE_ACTOR_IMPLEMENTATION.md](releases/v0.1.0/SCENE_ACTOR_IMPLEMENTATION.md)** - Scene-actor relationships
- **[SCENE_PROPERTIES_IMPLEMENTATION.md](releases/v0.1.0/SCENE_PROPERTIES_IMPLEMENTATION.md)** - Scene properties system

Features:
- Base continuity management system
- Scene and actor management
- Location management
- Calendar integration
- SVG silhouette system
- User authentication

## 🔍 Finding Documentation

### By Category

**Feature Documentation**
- Cast Grid: [v0.2.0](releases/v0.2.0/)
- Actors System: [v0.1.0](releases/v0.1.0/)
- Scene Properties: [v0.1.0](releases/v0.1.0/)

**Process Guides**
- Release Process: [guides/RELEASE_PROCESS.md](guides/RELEASE_PROCESS.md)
- Version Management: [guides/VERSION_GUIDE.md](guides/VERSION_GUIDE.md)

**Technical Guides**
- SVG Utilities: [guides/SVG_UTILITIES_DOCUMENTATION.md](guides/SVG_UTILITIES_DOCUMENTATION.md)
- Drag & Drop: [guides/SORTABLEJS_IMPLEMENTATION.md](guides/SORTABLEJS_IMPLEMENTATION.md)
- Calendar: [guides/CALENDAR_SETUP.md](guides/CALENDAR_SETUP.md)

### By Version

To find documentation for a specific version, go to:
```
docs/releases/vX.Y.Z/
```

For example:
- v0.2.0 docs: `docs/releases/v0.2.0/`
- v0.1.0 docs: `docs/releases/v0.1.0/`

### By Topic

Use the search functionality in the Release Browser (click version badge in UI) to search across all releases for:
- Feature names
- Bug fixes
- Technical details
- Keywords

## 📝 Contributing Documentation

When adding documentation:

1. **Release-Specific Docs**: Place in `docs/releases/vX.Y.Z/`
2. **General Guides**: Place in `docs/guides/`
3. **Update This Index**: Add links to new documentation
4. **Update CHANGELOG.md**: Document in the "Documentation" section

### Naming Conventions

- Use SCREAMING_SNAKE_CASE for doc files: `MY_FEATURE_DOCS.md`
- Be descriptive: `CAST_GRID_IMPLEMENTATION_PLAN.md`
- Include version in folder path, not filename

## 🆘 Need Help?

Can't find what you're looking for?

1. **Search in Release Browser** (UI: click version badge)
2. **Check CHANGELOG.md** for feature history
3. **Browse releases.json** for structured data
4. **Check guides/** for general documentation

---

**Last Updated**: 2026-01-06 (v0.2.1)
