# Scene ↔ Actor Many-to-Many Relationship - Implementation Summary

## ✅ Completed Implementation (December 22, 2025)

### 1. Database Layer

**Migration Files Created:**
- `supabase/migrations/20251222000002_add_scene_actors.sql`
- `frontend/docs/migration-add-scene-actors.sql`

**Database Schema:**
```sql
CREATE TABLE scene_actors (
    id UUID PRIMARY KEY,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
    
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
    
    CONSTRAINT unique_scene_actor UNIQUE (scene_id, actor_id)
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

Comprehensive API for managing scene-actor relationships:

```javascript
// Query methods
SceneActorService.getByScene(sceneId)      // Get actors in a scene
SceneActorService.getByActor(actorId)      // Get scenes for an actor
SceneActorService.getById(sceneActorId)    // Get specific relationship
SceneActorService.exists(sceneId, actorId) // Check if link exists

// CRUD methods
SceneActorService.create(data)             // Link actor to scene
SceneActorService.createBulk(sceneId, actorIds) // Bulk add
SceneActorService.update(id, updates)      // Update continuity data
SceneActorService.delete(id)               // Remove link

// Image management (prepared for Supabase Storage)
SceneActorService.addImage(id, category, url)      // Add photo
SceneActorService.removeImage(id, category, index) // Remove photo

// Statistics
SceneActorService.getSceneCount(actorId)   // Count scenes per actor
SceneActorService.getActorCount(sceneId)   // Count actors per scene
```

**Updated Existing Services:**

- **`supabaseClient.js`**: Updated `getScene()` to include scene_actors with nested actor data via JOIN
- **`actorService.js`**: Updated `getById()` to include scene_actors with nested scene data via JOIN

---

### 3. UI Components

**New Component: `actorCardRenderer.js`**

Reusable actor card component (parallel to existing scene cards):

```javascript
renderActorCard(actor, options)  // Compact actor card with avatar
renderActorBadge(actor)          // Minimal inline badge
buildActorDisplayName(actor)     // Formatted name
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
- List of actors assigned to scene
- Compact actor cards with avatars
- Continuity badges (👔 costume, 💄 makeup, 💇 hair, 🎭 props)
- Add actor button → modal with searchable actor list
- Remove actor button → confirmation dialog
- Edit continuity button (placeholder for task #9)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ [Scene Info] [Cast] ← Tabs              │
├─────────────────────────────────────────┤
│ Cast Members              [+ Add Actor] │
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
│ No actors assigned to this scene yet.   │
│ Click "Add Actor" to assign cast.       │
└─────────────────────────────────────────┘
```

---

### 5. Actor Management Screen Integration

**Scenes Section** in `actors.html` (right column):

**Features:**
- Automatic loading when actor is selected
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

**From Scene → Actors:**
```javascript
// In Scene Edit Screen
const scene = await SceneService.getById(sceneId);
scene.scene_actors.forEach(sa => {
    const actor = sa.actor;  // Nested via JOIN
    // Render actor card
});
```

**From Actor → Scenes:**
```javascript
// In Actor Management Screen
const actor = await ActorService.getById(actorId);
actor.scene_actors.forEach(sa => {
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
UPDATE scene_actors 
SET approval_status = 'approved',
    approved_by = user_id,
    approved_at = NOW()
WHERE id = scene_actor_id;
```

**Bulk Operations Ready:**
```javascript
// Add multiple actors at once
await SceneActorService.createBulk(sceneId, [actor1Id, actor2Id, actor3Id]);
```

---

## 📋 Not Yet Implemented (Future Work)

### Task #9: Edit Scene Actor Continuity Modal

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
- [ ] Test CASCADE delete (delete scene/actor, verify links removed)

### Service Layer
- [ ] Create scene_actor link
- [ ] Query by scene
- [ ] Query by actor
- [ ] Update continuity notes
- [ ] Delete link
- [ ] Test image array operations

### Scene Edit Screen
- [ ] Open scene with no actors → see empty state
- [ ] Click "Add Actor" → see modal with actors
- [ ] Add actor → see it appear in list
- [ ] Remove actor → confirm dialog → see it disappear
- [ ] Reload scene → verify actors persist

### Actor Management Screen
- [ ] Select actor with no scenes → see empty state
- [ ] Select actor with scenes → see scene cards
- [ ] Verify continuity badges appear
- [ ] Test scrolling with many scenes

---

## 📁 Files Created/Modified

### Created
1. `supabase/migrations/20251222000002_add_scene_actors.sql`
2. `frontend/docs/migration-add-scene-actors.sql`
3. `frontend/js/services/sceneActorService.js`
4. `frontend/js/components/actorCardRenderer.js`

### Modified
1. `frontend/js/api/supabaseClient.js` - Added scene_actors JOIN to getScene()
2. `frontend/js/services/actorService.js` - Added scene_actors JOIN to getById()
3. `frontend/js/sceneEditScreen.js` - Implemented Cast tab with full CRUD
4. `frontend/actors.html` - Added Scenes section to right column
5. `frontend/js/actors.js` - Added scene loading and rendering

---

## 🚀 Next Steps

1. **Run Database Migration:**
   ```bash
   # Option 1: Supabase Dashboard
   # Go to SQL Editor and paste migration-add-scene-actors.sql
   
   # Option 2: Supabase CLI
   supabase db push
   ```

2. **Test Basic Flow:**
   - Open a scene in calendar/timeline
   - Switch to Cast tab
   - Add an actor
   - Verify it appears in actor's Scenes list

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
| Dynamic imports in actors.js | Avoid loading scene modules upfront | Better performance |
| Continuity badges | Visual feedback | Quick overview of photos |

---

## 🎨 UI/UX Patterns Established

1. **Empty States**: Clear messaging + actionable CTA
2. **Loading States**: Spinner with min-height to prevent layout shift
3. **Confirmation Dialogs**: Always confirm destructive actions
4. **Inline Actions**: Edit/delete buttons on cards
5. **Search**: Filter large lists (actors modal)
6. **Badges**: Visual indicators for metadata
7. **Nested Data**: JOINs in database, not N+1 queries

---

**Implementation complete through Task #8. Task #9 (continuity modal) is documented but not yet implemented.**
