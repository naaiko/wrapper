# Continuity Manager

Film continuity management system with cast, scene, and location management.

**Version**: 0.2.0 | [Release Notes](CHANGELOG.md) | [What's New](#whats-new)

## 📋 Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Full release history
- **[RELEASE_NOTES_SYSTEM.md](RELEASE_NOTES_SYSTEM.md)** - Release notes system overview
- **[RELEASE_PROCESS.md](RELEASE_PROCESS.md)** - How to make a release
- **[VERSION_GUIDE.md](VERSION_GUIDE.md)** - Quick version update guide

## 🚀 What's New

### v0.2.0 - Cast Member Grid Feature (2026-01-06)

Complete redesign of the cast screen with modern grid interface:

✨ **New Features:**
- Polaroid-style grid view for cast members
- Filter by role (Hoofdrol/Bijrol/Figurant)
- Sort by name, scene count, or recently added
- Real-time search
- Quick Add with photo upload
- Cast member detail screen with prev/next navigation
- Keyboard shortcuts (← → ESC)
- Touch swipe navigation for mobile/iPad
- Toast notifications
- Integrated release notes system

🐛 **Bug Fixes:**
- Fixed viewport meta tag
- Fixed iOS input zoom
- Fixed photo preview reset

See [CHANGELOG.md](CHANGELOG.md) for complete history.

## 🔧 Current Setup: CDN-Based (No Build Step)

### Why CDN-Based?

This project currently uses **CDN-based Tailwind CSS and DaisyUI** for the following reasons:

1. **Rapid MVP Development** - Get started immediately without build tooling setup
2. **Zero Configuration** - No npm, no webpack, no build pipeline complexity
3. **Instant Deployment** - Push to GitHub and Cloudflare Pages serves it immediately
4. **Prototype Validation** - Perfect for testing ideas before investing in infrastructure

### What's Included

- **Tailwind CSS** (via CDN) - Utility-first CSS framework
- **DaisyUI** (via CDN) - Component library that extends Tailwind CSS
- **Vanilla JavaScript** - ES6 modules
- **Supabase** - Backend (PostgreSQL + Auth)
- **SortableJS** - Drag-and-drop
- **Toast UI Calendar** - Calendar integration
- **Documentation** - See `docs/frontend.md` for technical details

### Deployment Instructions

1. Push this repository to GitHub
2. Connect the repository to Cloudflare Pages
3. Configure build settings:
   - **Build command**: Leave empty
   - **Build output directory**: `/`
4. Deploy - the site will be live immediately

## 📦 Release Management

This project uses an **integrated release notes system**. Every version change requires:

1. Update `frontend/js/version.js`
2. Update `package.json`
3. Add entry to `CHANGELOG.md`
4. Add entry to `releases.json`
5. Run validation: `npm run validate-release`
6. Commit with tag: `git tag vX.Y.Z`

See [RELEASE_PROCESS.md](RELEASE_PROCESS.md) for detailed instructions.

## Important: This is a Temporary MVP Setup

### ⚠️ Limitations of CDN-Based Approach

- **Performance**: CDN loads are slower than optimized builds
- **File Size**: You get the entire Tailwind CSS library (not purged)
- **Production**: Not recommended for production applications
- **Customization**: Limited theme customization compared to build-based setup

### When to Migrate to a Build Pipeline

You should migrate when:

- You need to optimize performance for production users
- Your CSS bundle size becomes a concern (currently ~3-4 MB unpurged)
- You want advanced Tailwind customization (custom themes, plugins)
- You're ready to add TypeScript, React, or other build-dependent tools
- You need to integrate with backend APIs and want a unified build process

### Migration Path (Future)

When ready to move beyond MVP stage:

1. Set up **Node.js** and **npm** in your local environment
2. Install Tailwind CSS and DaisyUI as npm packages
3. Configure PostCSS with PurgeCSS for production optimization
4. Add a build script (e.g., using Vite, Parcel, or Next.js)
5. Update Cloudflare Pages build configuration to use your build command
6. Remove CDN links and use bundled CSS instead

See `docs/frontend.md` for detailed migration instructions.

## Project Structure

```
/
├── index.html          # Main entry point with CDN setup
├── README.md           # This file
└── docs/
    └── frontend.md     # Frontend architecture documentation
```

## Local Development

Simply open `index.html` in your browser. No server required for basic development.

For a better development experience with live reload:
```bash
# Optional: Use Python's built-in server
python -m http.server 8000

# Or use any static file server
npx serve
```

Then visit `http://localhost:8000`

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Documentation](https://daisyui.com/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

---

## Development Guidelines

### UI Framework Philosophy

**Always use DaisyUI components** for UI elements. DaisyUI is the way to go for:
- Buttons, modals, drawers, tabs, forms
- Consistent styling across the application
- Built-in accessibility and responsive design
- Semantic component names that improve code readability

When DaisyUI doesn't have what you need, extend with Tailwind utilities, but always check DaisyUI first.

### User Experience Philosophy: Immersive & Immediate

**Minimize friction - Auto-save by default**

Actions should be **immediate and direct** unless they are:
- **Destructive**: Deleting data permanently
- **Irreversible**: Cannot be undone
- **Critical**: Requires user confirmation for safety

**DO auto-save:**
- ✅ Toggle switches (feature flags, visibility settings)
- ✅ Dropdown selections
- ✅ Adding items to lists
- ✅ Reordering items via drag & drop
- ✅ Editing text fields (on blur or after short delay)
- ✅ Checkbox changes

**DO ask for confirmation:**
- ⚠️ Delete buttons (show modal: "Are you sure?")
- ⚠️ Permanent changes that affect multiple items
- ⚠️ Actions that cannot be undone

**Example: Settings Management**
- Scene heading toggles → Auto-save on change
- Add time of day → Save immediately after form submit
- Delete time → Show confirmation modal first
- Reorder times → Auto-save new order

This creates an **immersive, seamless experience** where users feel in control without constant interruption.

### Self-Guided Learning: Show, Don't Just Tell

**Use live previews to educate users in context**

Users learn best when they can immediately see the impact of their actions. Always include visual previews that show:
- **Where** the setting will appear in the UI
- **How** it will look in the actual application
- **What** the user is configuring

**Implementation examples:**

**Scene Headings Settings:**
```
Preview: INT. COFFEE SHOP - DAY - CONTINUOUS
         ↑ Shows exactly how the heading appears on scene cards
```

**Time of Day Settings:**
```
Preview on Scene Card:
  [☀️ Icon] DAY
  ↑ Shows the icon + label as it appears on actual scenes
```

**Conditions Settings:**
```
Preview on Scene Card:
  [🌤️ Icon] SUNNY
  ↑ Shows how weather conditions display on scenes
```

**Benefits:**
- ✅ Users immediately understand where to find features
- ✅ Reduces need for external documentation
- ✅ Builds confidence through visual feedback
- ✅ Creates a self-guided, intuitive experience

**When to add previews:**
- Settings that affect visual appearance
- Configuration that impacts multiple locations
- Any feature where "where does this show up?" is unclear

This creates a **user-friendly, self-guiding platform** that takes time to show and explain, making the learning curve smooth and natural.

---

**Last Updated**: December 2025  
**Status**: MVP / Prototype Phase
