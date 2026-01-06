# v0.2.3 Release Documentation

## Script Import & Parsing Feature

### Quick Links
- [Design Document](SCRIPT_IMPORT_DESIGN.md) - Complete architectuur en library keuzes
- [Implementation Summary](SCRIPT_IMPORT_IMPLEMENTATION.md) - Technische details en metrics
- [User Guide](../../guides/SCRIPT_IMPORT_USER_GUIDE.md) - Gebruikershandleiding

### Feature Overview

**Release Date:** January 6, 2026  
**Type:** Major Feature Addition  
**Status:** ✅ Complete & Production Ready

### What's New

Import Fountain en plain text screenplays met automatische scene extractie:

- 📄 Drag & drop file upload (.fountain, .txt)
- 🔍 Auto-detection van script format
- 🎬 Scene heading parsing (INT/EXT, location, time, continuity)
- 👥 Character detection uit dialogue
- 📊 Preview grid met confidence scores
- ⚡ Bulk import met single database transaction
- 🎯 Volledig geïntegreerd in timeline

### Files Added

**Core Implementation:**
- `frontend/js/models/ImportedScene.js`
- `frontend/js/utils/sceneNormalizer.js`
- `frontend/js/parsers/fountainAdapter.js`
- `frontend/js/parsers/plainTextParser.js`
- `frontend/js/services/scriptImportService.js`
- `frontend/js/screens/ScriptImportScreen.js`

**Modified:**
- `frontend/js/services/sceneService.js` - Added `createBulk()`
- `frontend/timeline.html` - Added import button + Fountain.js
- `frontend/js/timeline.js` - Added ScriptImportScreen integration

**Documentation:**
- This index file
- Design document
- Implementation summary
- User guide (in guides/)

**Test:**
- `test-script.fountain` - Example script

### Dependencies

- **Fountain.js** v0.1.10 (CDN) - Industry-standard Fountain parser

### Migration Required

**None** - Fully backwards compatible, uses existing scenes table schema.

### Breaking Changes

**None**

### Known Limitations

- FDX (Final Draft XML) not supported yet
- Character-to-cast member auto-matching not implemented
- Scene editing in preview not available (can edit after import in timeline)

### Future Roadmap

- FDX parser support
- Character matching to existing Cast
- Script revision tracking
- Scene editing in preview

### Performance

- Parse 100 scenes: < 1s
- UI: 60fps (no lag)
- Bulk insert: Single transaction

### Documentation

See the linked documents above for complete details on:
- Architecture & design decisions
- Library choices & rationale
- Implementation details & metrics
- User guide & troubleshooting
