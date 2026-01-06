# Scene ↔ Cast Member Many-to-Many Relationship - Implementation Summary

## ✅ Completed Implementation (December 22, 2025)

### 1. Database Layer

**Migration Files Created:**
- `supabase/migrations/20251222000002_add_scene_cast_members.sql`
- `frontend/docs/migration-add-Scene-cast members.sql`

**Database Schema:**
```sql
CREATE TABLE scene_cast_members (
    id UUID PRIMARY KEY,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    cast_member_id UUID REFERENCES Cast(id) ON DELETE CASCADE,
    
    -- Continuity data (expandable)
    costume_notes TEXT,
    costume_images TEXT[],
    makeup_notes TEXT,
    makeup_images TEXT[],
    hair_notes TEXT,
    hair_images TEXT[],
    props_notes TEXT,
    props_images TEXT[],
    continuity_notes TEXT,
    
    -- Future: approval workflow
    approval_status TEXT DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    last_modified TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_scene_actor UNIQUE (scene_id, cast_member_id)
);
```

**Key Features:**
- ✅ Many-to-many junction table
- ✅ UNIQUE constraint prevents duplicates
- ✅ ON DELETE CASCADE maintains referential integrity
- ✅ Prepared for photo storage (TEXT[] arrays)
- ✅ Prepared for approval workflow (fields ready, not active)

---

### 2. Service Layer

**New Service: `SceneActorService.js`**

Comprehensive API for managing Scene-cast member relationships:

```javascript
// Query methods
SceneActorService.getByScene(sceneId)      // Get Cast in a scene
SceneActorService.getByActor(actorId)      // Get scenes for an Cast Member
SceneActorService.getById(sceneActorId)    // Get specific relationship
SceneActorService.exists(sceneId, actorId) // Check if link exists

// CRUD methods
SceneActorService.create(data)             // Link Cast Member to scene
SceneActorService.createBulk(sceneId, actorIds) // Bulk add
SceneActorService.update(id, updates)      // Update continuity data
SceneActorService.delete(id)               // Remove link

// Image management (prepared for Supabase Storage)
SceneActorService.addImage(id, category, url)      // Add photo
SceneActorService.removeImage(id, category, index) // Remove photo

// Statistics
SceneActorService.getSceneCount(actorId)   // Count scenes per Cast Member
SceneActorService.getActorCount(sceneId)   // Count Cast per scene
```

**Updated Existing Services:**

- **`supabaseClient.js`**: Updated `getScene()` to include scene_cast_members with nested Cast Member data via JOIN
- **`actorService.js`**: Updated `getById()` to include scene_cast_members with nested scene data via JOIN

---

### 3. UI Components

**New Component: `actorCardRenderer.js`**

Reusable Cast Member card component (parallel to existing scene cards):

```javascript
renderActorCard(Cast Member, options)  // Compact Cast Member card with avatar
renderActorBadge(Cast Member)          // Minimal inline badge
buildActorDisplayName(Cast Member)     // Formatted name
```

Features:
- Responsive avatar (photo or initials)
- Character name display
- Scene count badge
- Selectable mode (with checkboxes)
- Click handlers
- Consistent styling with scene cards

---

### 4. Scene Edit Screen Integration

**Cast Tab Implementation** in `sceneEditScreen.js`:

**Features:**
- List of Cast assigned to scene
- Compact Cast Member cards with avatars
- Continuity badges (👔 costume, 💄 makeup, 💇 hair, 🎭 props)
- Add Cast Member button → modal with searchable Cast Member list
- Remove Cast Member button → confirmation dialog
- Edit continuity button (placeholder for task #9)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ [Scene Info] [Cast] ← Tabs              │
├─────────────────────────────────────────┤
│ Cast Members              [+ Add Cast Member] │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 👤 Emma De Caluwe                   │  │
│ │    as Sophie Maes                   │  │
│ │                   👔2 💄1  [✏️] [❌] │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 👤 Thomas Vandenberghe              │  │
│ │    as Marc Dubois                   │  │
│ │                        [✏️] [❌]     │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────────────┐
│ No Cast assigned to this scene yet.   │
│ Click "Add Cast Member" to assign cast.       │
└─────────────────────────────────────────┘
```

---

### 5. Cast Member Management Screen Integration

**Scenes Section** in `Cast.html` (right column):

**Features:**
- Automatic loading when Cast Member is selected
- Scene cards rendered with full context (location, time, etc.)
- Continuity badges per scene
- Scrollable list (max height with overflow)
- Loading states
- Empty states

**Visual Design:**
```
Right Column: Scenes
┌─────────────────────────────────────────┐
│ Scenes                                   │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [1] INT. COFFEE SHOP - DAY      ☀️  │ │
│ │ 👔1                                  │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ [3] EXT. PARK - DAY              ☀️  │ │
│ │ 💇2 🎭1                              │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ [12A] INT/EXT. CAR - NIGHT     🌙  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🎯 Architecture Highlights

### Bidirectional Relationship Management

**From Scene → Cast:**
```javascript
// In Scene Edit Screen
const scene = await SceneService.getById(sceneId);
scene.scene_cast_members.forEach(sa => {
    const Cast Member = sa.Cast Member;  // Nested via JOIN
    // Render Cast Member card
});
```

**From Cast Member → Scenes:**
```javascript
// In Cast Member Management Screen
const Cast Member = await ActorService.getById(actorId);
Cast Member.scene_cast_members.forEach(sa => {
    const scene = sa.scene;  // Nested via JOIN
    // Render scene card
});
```

### Future-Proof Design

**Photo Upload Ready:**
```javascript
// Current: Manual URL input
await SceneActorService.addImage(sceneActorId, 'costume', 'https://...');

// Future: Supabase Storage integration
const { data } = await supabase.storage
    .from('continuity-photos')
    .upload(path, file);
const url = supabase.storage.from('continuity-photos').getPublicUrl(data.path);
await SceneActorService.addImage(sceneActorId, 'costume', url);
```

**Approval Workflow Ready:**
```sql
-- Fields already exist in database
UPDATE scene_cast_members 
SET approval_status = 'approved',
    approved_by = user_id,
    approved_at = NOW()
WHERE id = scene_cast_member_id;
```

**Bulk Operations Ready:**
```javascript
// Add multiple Cast at once
await SceneActorService.createBulk(sceneId, [actor1Id, actor2Id, actor3Id]);
```

---

## 📋 Not Yet Implemented (Future Work)

### Task #9: Edit Scene Cast Member Continuity Modal

**Placeholder:** Currently shows "Edit continuity feature coming in next implementation step"

**Planned Implementation:**
- Modal with tabs (Costume, Makeup, Hair, Props)
- Photo grid with upload functionality
- Notes textarea per category
- Supabase Storage integration
- Real-time preview

**UI Mockup:**
```
┌─────────────────────────────────────────┐
│ Edit Continuity: Emma in Scene 12A      │
│                                          │
│ [Tab: Costume] [Makeup] [Hair] [Props]  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 📸 Upload Photos                    │  │
│ │ [+] Add photo                       │  │
│ │                                      │  │
│ │ ┌────┐ ┌────┐ ┌────┐               │  │
│ │ │📷 1│ │📷 2│ │📷 3│               │  │
│ │ └────┘ └────┘ └────┘               │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 📝 Notes                                 │
│ ┌────────────────────────────────────┐  │
│ │ Blue dress with silver buttons...   │  │
│ └────────────────────────────────────┘  │
│                                          │
│              [Save] [Cancel]             │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Database
- [ ] Run migration in Supabase
- [ ] Verify UNIQUE constraint works (try adding duplicate)
- [ ] Test CASCADE delete (delete scene/Cast Member, verify links removed)

### Service Layer
- [ ] Create scene_actor link
- [ ] Query by scene
- [ ] Query by Cast Member
- [ ] Update continuity notes
- [ ] Delete link
- [ ] Test image array operations

### Scene Edit Screen
- [ ] Open scene with no Cast → see empty state
- [ ] Click "Add Cast Member" → see modal with Cast
- [ ] Add Cast Member → see it appear in list
- [ ] Remove Cast Member → confirm dialog → see it disappear
- [ ] Reload scene → verify Cast persist

### Cast Member Management Screen
- [ ] Select Cast Member with no scenes → see empty state
- [ ] Select Cast Member with scenes → see scene cards
- [ ] Verify continuity badges appear
- [ ] Test scrolling with many scenes

---

## 📁 Files Created/Modified

### Created
1. `supabase/migrations/20251222000002_add_scene_cast_members.sql`
2. `frontend/docs/migration-add-Scene-cast members.sql`
3. `frontend/js/services/sceneActorService.js`
4. `frontend/js/components/actorCardRenderer.js`

### Modified
1. `frontend/js/api/supabaseClient.js` - Added scene_cast_members JOIN to getScene()
2. `frontend/js/services/actorService.js` - Added scene_cast_members JOIN to getById()
3. `frontend/js/sceneEditScreen.js` - Implemented Cast tab with full CRUD
4. `frontend/Cast.html` - Added Scenes section to right column
5. `frontend/js/Cast.js` - Added scene loading and rendering

---

## 🚀 Next Steps

1. **Run Database Migration:**
   ```bash
   # Option 1: Supabase Dashboard
   # Go to SQL Editor and paste migration-add-Scene-cast members.sql
   
   # Option 2: Supabase CLI
   supabase db push
   ```

2. **Test Basic Flow:**
   - Open a scene in calendar/timeline
   - Switch to Cast tab
   - Add an Cast Member
   - Verify it appears in Cast Member's Scenes list

3. **Implement Continuity Modal (Task #9):**
   - Create modal component
   - Add photo upload to Supabase Storage
   - Implement save/update logic

4. **Polish:**
   - Add loading states
   - Improve error handling
   - Add success/error toasts
   - Add keyboard shortcuts

---

## 💡 Design Decisions Log

| Decision | Rationale | Future Impact |
|----------|-----------|---------------|
| Junction table instead of arrays | Allows metadata per relationship | No migration needed for expansion |
| TEXT[] for images | Simple for MVP | Migratable to separate table if needed |
| UNIQUE constraint | Database-level duplicate prevention | Prevents data inconsistency |
| Approval fields (inactive) | Future workflow prep | No schema change needed later |
| Reusable ActorCard component | DRY principle, consistency | Easy to add to other screens |
| Dynamic imports in Cast.js | Avoid loading scene modules upfront | Better performance |
| Continuity badges | Visual feedback | Quick overview of photos |

---

## 🎨 UI/UX Patterns Established

1. **Empty States**: Clear messaging + actionable CTA
2. **Loading States**: Spinner with min-height to prevent layout shift
3. **Confirmation Dialogs**: Always confirm destructive actions
4. **Inline Actions**: Edit/delete buttons on cards
5. **Search**: Filter large lists (Cast modal)
6. **Badges**: Visual indicators for metadata
7. **Nested Data**: JOINs in database, not N+1 queries

---

**Implementation complete through Task #8. Task #9 (continuity modal) is documented but not yet implemented.**
