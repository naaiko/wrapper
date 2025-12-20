# SaaS MVP - Cloudflare Pages Deployment

This is a minimal SaaS MVP designed for rapid prototyping and deployment on Cloudflare Pages.

## Current Setup: CDN-Based (No Build Step)

### Why CDN-Based?

This project currently uses **CDN-based Tailwind CSS and DaisyUI** for the following reasons:

1. **Rapid MVP Development** - Get started immediately without build tooling setup
2. **Zero Configuration** - No npm, no webpack, no build pipeline complexity
3. **Instant Deployment** - Push to GitHub and Cloudflare Pages serves it immediately
4. **Prototype Validation** - Perfect for testing ideas before investing in infrastructure

### What's Included

- **Tailwind CSS** (via CDN) - Utility-first CSS framework
- **DaisyUI** (via CDN) - Component library that extends Tailwind CSS
- **index.html** - Demo page showcasing DaisyUI components
- **Documentation** - See `docs/frontend.md` for technical details

### Deployment Instructions

1. Push this repository to GitHub
2. Connect the repository to Cloudflare Pages
3. Configure build settings:
   - **Build command**: Leave empty
   - **Build output directory**: `/`
4. Deploy - the site will be live immediately

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

**Last Updated**: December 2025  
**Status**: MVP / Prototype Phase
