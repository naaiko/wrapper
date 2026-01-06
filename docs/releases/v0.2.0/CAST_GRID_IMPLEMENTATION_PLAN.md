# Cast Grid Implementation Plan
**Feature Branch:** `feature-cast-grid`  
**Version:** v0.2.0 (minor feature addition)

## 🎯 Doelstellingen

1. **Cast Grid View** - Polaroid-achtig kaartjes grid als hoofdscherm
2. **Filter & Sort** - Intuïtieve filtering en sortering
3. **Navigatie** - Soepele flow tussen grid ↔ detail
4. **Mobile Support** - Responsive voor iPad/mobile
5. **Quick Add** - Nieuwe Cast toevoegen zoals scenes in timeline
6. **Detail Navigation** - Scrollen door Cast vanuit detail screen (Odoo-style)

## 📦 DaisyUI Components te Gebruiken

### Primaire Components
- **Card** - Voor Cast Member polaroid cards
  - `card` + `card-body` voor structuur
  - `card-title` voor Cast Member naam
  - `badge` voor role/status indicators
  
- **Filter** - Voor filtering actoren
  - Native DaisyUI filter component
  - Radio button group stijl
  
- **Dropdown** - Voor sort opties
  - `dropdown` + `dropdown-content`
  - Menu met sort options

- **Kbd** - Voor keyboard shortcuts
  - Arrows voor navigatie tussen Cast
  - ESC voor terug naar grid

### Ondersteunende Components
- **Avatar** - Placeholder voor foto's
- **Badge** - Status indicators (hoofdrol, bijrol, figurant)
- **Skeleton** - Loading states
- **Modal/Drawer** - Detail screen (drawer op mobile, modal op desktop)
- **FAB** - Floating Add button (zoals timeline)

## 🏗️ Architectuur

### File Structure
```
frontend/
  Cast.html          → RENAMED to Cast-old.html (backup)
  Cast-grid.html     → NEW main Cast page (grid view)
  Cast-detail.html   → NEW detail view (standalone/embedded)
  
  js/
    Cast.js          → RENAMED to Cast-old.js (backup)
    Cast-grid.js     → NEW grid controller
    Cast-detail.js   → NEW detail controller (extracted from Cast.js)
    
    screens/
      castGridScreen.js      → NEW grid screen component
      actorDetailScreen.js   → REFACTORED from ActorEditScreen
      
    components/
      actorCard.js       → NEW polaroid card component
      actorFilters.js    → NEW filter/sort component
      
  css/
    Cast-grid.css    → NEW grid-specific styles
```

### State Management
```javascript
class CastGridState {
  Cast: Cast Member[]           // All Cast
  filteredActors: Cast Member[]   // After filter/sort
  currentFilter: string     // 'all' | 'hoofdrol' | 'bijrol' | 'figurant'
  sortBy: string           // 'name' | 'scenes' | 'recent'
  searchTerm: string
  selectedActorId: number | null
  viewMode: 'grid' | 'detail'
}
```

## 🎨 UI Design

### Grid View Layout
```
┌─────────────────────────────────────────────────────┐
│  [Search] [Filter: All ▼] [Sort: Name ▼]      [+]  │ ← Top bar
├─────────────────────────────────────────────────────┤
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │ Photo │  │ Photo │  │ Photo │  │ Photo │       │
│  │       │  │       │  │       │  │       │       │ ← Polaroid cards
│  │ Name  │  │ Name  │  │ Name  │  │ Name  │       │   (Grid auto-fill)
│  │ Badge │  │ Badge │  │ Badge │  │ Badge │       │
│  └───────┘  └───────┘  └───────┘  └───────┘       │
│  ┌───────┐  ┌───────┐  ┌───────┐                  │
│  │ Photo │  │ Photo │  │ Photo │                  │
│  └───────┘  └───────┘  └───────┘                  │
└─────────────────────────────────────────────────────┘
```

### Detail View (Desktop)
```
┌─────────────────────────────────────────────────────┐
│  [← Back to Grid]    Cast Member Name    [← Prev | Next →]│
├─────────────────────────────────────────────────────┤
│  [Same 3-column layout as current Cast.html]     │
│  - Left: Details panel                             │
│  - Middle: Silhouette                              │
│  - Right: Calendar                                 │
└─────────────────────────────────────────────────────┘
```

### Mobile Flow
- Grid: Vertical scroll van cards (1 kolom)
- Detail: Full screen drawer (slide in from right)
- Navigation: Swipe left/right voor prev/next Cast Member

## 📋 Implementation Steps

### Phase 1: Setup & Backup (30 min)
- [x] Create feature branch `feature-cast-grid`
- [ ] Rename current Cast.html → Cast-old.html
- [ ] Rename current Cast.js → Cast-old.js
- [ ] Create VERSION_CHANGELOG.md entry

### Phase 2: Cast Member Card Component (1h)
- [ ] Create `components/actorCard.js`
  - Polaroid styling met DaisyUI card
  - Hover states (scale + shadow)
  - Badge voor role (hoofdrol/bijrol/figurant)
  - Click handler → open detail
  - Skeleton loading state
  
### Phase 3: Grid Screen (1.5h)
- [ ] Create `Cast-grid.html`
  - Top navigation bar
  - Filter/Sort controls
  - Grid container (CSS Grid auto-fill)
  - FAB voor add Cast Member
  - Empty state (zoals timeline)
  
- [ ] Create `Cast-grid.js`
  - Load Cast from Supabase
  - Render grid
  - Filter logic (all/hoofdrol/bijrol/figurant)
  - Sort logic (name/scenes/recent)
  - Search implementation
  - Click → navigate to detail

### Phase 4: Detail Screen Integration (2h)
- [ ] Extract detail logic from Cast-old.js
  - Create `Cast-detail.js`
  - Refactor state management
  - Add prev/next navigation
  - Keep all existing functionality
  
- [ ] Create navigation system
  - URL params: `Cast-grid.html?Cast Member=123`
  - Back button → return to grid
  - Keyboard shortcuts (←/→ voor prev/next)
  - Breadcrumb trail

### Phase 5: Mobile Responsive (1.5h)
- [ ] Grid responsive breakpoints
  - Desktop: 4 columns
  - Tablet: 3 columns  
  - Mobile: 1-2 columns
  
- [ ] Detail screen mobile
  - Full screen drawer (DaisyUI drawer)
  - Swipe gestures voor prev/next
  - Bottom navigation
  
- [ ] Touch optimizations
  - Larger touch targets
  - Smooth transitions
  - Loading states

### Phase 6: Quick Add Feature (1h)
- [ ] FAB button (like timeline)
- [ ] Quick add modal/drawer
  - Name input (required)
  - Role dropdown
  - Photo upload (optional)
- [ ] Create → immediate insert in grid
- [ ] Animation (new card fades in)

### Phase 7: Polish & Testing (1.5h)
- [ ] Animations & transitions
  - Grid load stagger
  - Card hover effects
  - Detail slide transitions
  
- [ ] Empty states
  - No Cast yet
  - No search results
  - Loading skeletons
  
- [ ] Keyboard navigation
  - Tab through cards
  - Enter to open
  - ESC to close detail
  
- [ ] Testing
  - Desktop browsers
  - iPad
  - Mobile (iPhone/Android)

### Phase 8: Documentation & Merge (30min)
- [ ] Update VERSION_GUIDE.md
- [ ] Create CAST_GRID_FEATURES.md
- [ ] Bump version to v0.2.0
- [ ] Git commit + tag
- [ ] Merge to main

## 🔧 Technical Details

### CSS Grid Layout
```css
.cast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

@media (max-width: 640px) {
  .cast-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}
```

### Cast Member Card HTML (DaisyUI)
```html
<div class="card card-compact bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer">
  <figure class="aspect-[3/4] bg-base-300">
    <img src="Cast Member-photo.jpg" alt="Cast Member Name" class="object-cover">
  </figure>
  <div class="card-body">
    <h3 class="card-title text-sm">John Doe</h3>
    <div class="flex gap-1">
      <span class="badge badge-primary badge-sm">Hoofdrol</span>
      <span class="badge badge-ghost badge-sm">12 scenes</span>
    </div>
  </div>
</div>
```

### Navigation State
```javascript
// URL pattern: Cast-grid.html?project=123&Cast Member=456&filter=hoofdrol&sort=name

class NavigationManager {
  // Parse URL params
  getCurrentActor() { /* from ?Cast Member= */ }
  getFilter() { /* from ?filter= */ }
  getSort() { /* from ?sort= */ }
  
  // Navigate
  openDetail(actorId) {
    window.location.href = `Cast-grid.html?project=${pid}&Cast Member=${actorId}`;
  }
  
  closeDetail() {
    window.location.href = `Cast-grid.html?project=${pid}`;
  }
  
  nextActor() {
    // Get next ID from filtered list
  }
  
  prevActor() {
    // Get prev ID from filtered list
  }
}
```

## 📊 Database Schema (No Changes Needed)
Existing `Cast` table already has all required fields:
- `id`, `project_id`, `name`, `photo_url`, `role`
- Relations to `scene_cast_members` for scene count

## 🎯 Success Criteria

### Functional
- ✅ Grid shows all Cast as polaroid cards
- ✅ Filter works (all/hoofdrol/bijrol/figurant)
- ✅ Sort works (name/scenes/recent)
- ✅ Search filters by name
- ✅ Click card → detail screen
- ✅ Detail has prev/next navigation
- ✅ Quick add creates new Cast Member
- ✅ Mobile responsive

### UX
- ✅ Feels intuïtief (like Odoo detail navigation)
- ✅ Fast loading (skeletons for loading states)
- ✅ Smooth animations
- ✅ Clear visual hierarchy
- ✅ Touch-friendly op iPad/mobile

### Technical
- ✅ No breaking changes to existing Cast functionality
- ✅ Clean separation grid ↔ detail
- ✅ Reusable components
- ✅ DaisyUI components throughout
- ✅ Version bumped to v0.2.0

## 🚀 Estimated Timeline
**Total: ~9 hours**
- Phase 1-2: 1.5h (Setup + Card Component)
- Phase 3-4: 3.5h (Grid + Detail Integration)
- Phase 5-6: 2.5h (Mobile + Quick Add)
- Phase 7-8: 2h (Polish + Docs)

## 📚 External Packages Research

### Evaluated Options
1. **Isotope** - Masonry grid layout
   - ❌ Too heavy, jQuery dependency
   
2. **Muuri** - Grid with drag & drop
   - ❌ Overkill for our needs
   
3. **CSS Grid** - Native browser feature
   - ✅ **CHOSEN** - Fast, no dependencies, perfect control
   
4. **List.js** - Filter/sort library
   - ❌ Vanilla JS is simpler for our use case
   
5. **DaisyUI Filter Component**
   - ✅ **USING** - Native DaisyUI, perfect fit

### Decision: Pure DaisyUI + Native CSS Grid
**Rationale:**
- DaisyUI provides all UI components we need
- CSS Grid auto-fill handles responsive layout perfectly
- No external dependencies = faster load
- Full control over styling and behavior
- Matches existing codebase patterns

## 🎨 Design Inspiration
- **Polaroid style**: Subtle shadow, white border, photo on top
- **Grid spacing**: Generous gaps for breathing room
- **Hover effect**: Subtle lift (scale 1.05) + stronger shadow
- **Color system**: Use DaisyUI semantic colors (primary for main role badge)
- **Typography**: Card titles should be readable but compact

## 🔄 Rollback Plan
If implementation fails or breaks existing functionality:
1. Delete new files (Cast-grid.html, Cast-grid.js, etc.)
2. Rename Cast-old.html → Cast.html
3. Rename Cast-old.js → Cast.js
4. Reset version to v0.1.0
5. Delete feature branch

---

**Status:** Ready for implementation  
**Started:** Not yet  
**Estimated Completion:** TBD  
**Actual Completion:** TBD
