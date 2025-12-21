# Actors & Characters Management

## Overview

The Actors management system is a core feature of the Continuity Manager app designed specifically for tracking makeup, wardrobe, and physical continuity across non-chronological film and TV production schedules.

## Purpose

In film and television production, scenes are rarely shot in chronological order. This creates significant challenges for maintaining continuity, especially regarding:

- **Makeup consistency** - Ensuring actors look the same across scenes shot weeks apart
- **Wardrobe tracking** - Managing costume changes and ensuring correct outfits for each scene
- **Hair & styling** - Tracking hairstyle, facial hair, and grooming across the production
- **Physical characteristics** - Documenting scars, tattoos, aging effects, and other features
- **Accessories & props** - Tracking jewelry, watches, and character-specific items

The Actors screen provides a centralized hub for managing all cast members and their continuity requirements.

## Features

### Actor Management (CRUD)

- **Create** - Add new actors with comprehensive details
- **Read** - Browse actors in card view with search and filtering
- **Update** - Edit actor information and physical characteristics
- **Delete** - Remove actors from the project

### Visual Character Preview

The "Create-a-Sim" style interface provides:
- **Character silhouette** - Default visual representation
- **Profile photos** - Replace silhouette with actual actor photos
- **Quick visual identification** - Easy browsing through cast

### Physical Characteristics Tracking

Comprehensive fields for documenting:
- **Basic info**: Actor name, character name, contact details
- **Physical traits**: Height, hair color, hair style, eye color, skin tone, body type
- **Distinguishing features**: Scars, tattoos, piercings, etc. (comma-separated list)
- **Notes**: General production notes about the actor or character

### Search & Filter

- **Search**: Real-time search across actor names, character names, and notes
- **Filters**:
  - All Actors
  - Recently Modified
  - A-Z by Actor Name
  - A-Z by Character Name

### Continuity Timeline (Future Feature)

The database is prepared for detailed continuity tracking per scene:
- **Scene-specific continuity** - Link actors to specific scenes
- **Wardrobe documentation** - Photos and descriptions
- **Makeup documentation** - Photos and descriptions
- **Hair documentation** - Photos and descriptions
- **Facial hair tracking** - Especially important for male actors
- **Accessories & props** - Scene-specific items
- **Story timeline dates** - Track character appearance across story time

## Database Schema

### `actors` Table

```sql
- id (UUID, Primary Key)
- project_id (UUID, Foreign Key -> projects)
- actor_name (TEXT) - Real actor name
- character_name (TEXT) - Character name in the production
- email (TEXT) - Contact email
- phone (TEXT) - Contact phone
- height (TEXT) - Height description
- hair_color (TEXT) - Hair color
- hair_style (TEXT) - Hair style description
- eye_color (TEXT) - Eye color
- skin_tone (TEXT) - Skin tone
- body_type (TEXT) - Body type/build
- distinguishing_features (TEXT[]) - Array of features
- profile_image_url (TEXT) - Profile photo URL
- reference_images (TEXT[]) - Array of reference photo URLs
- notes (TEXT) - General notes
- created_at (TIMESTAMP)
- last_modified (TIMESTAMP)
```

### `actor_continuity` Table

```sql
- id (UUID, Primary Key)
- actor_id (UUID, Foreign Key -> actors)
- scene_id (UUID, Foreign Key -> scenes, Optional)
- continuity_date (DATE) - Story timeline date
- wardrobe_description (TEXT)
- wardrobe_photos (TEXT[])
- makeup_description (TEXT)
- makeup_photos (TEXT[])
- hair_description (TEXT)
- hair_photos (TEXT[])
- facial_hair_description (TEXT)
- facial_hair_photos (TEXT[])
- accessories_description (TEXT)
- accessories_photos (TEXT[])
- props_description (TEXT)
- props_photos (TEXT[])
- notes (TEXT)
- created_at (TIMESTAMP)
- last_modified (TIMESTAMP)
```

## Navigation

The Actors screen integrates with the existing navigation:

- **From Projects** → Timeline, Calendar, or Actors
- **From Actors** → Timeline, Calendar, or Projects

## Industry Best Practices

This implementation follows best practices from the Belgian, European, and Hollywood film industries:

### Belgian/European Production

- **Contact information** - Essential for smaller productions with direct actor communication
- **Multilingual support** - Character names may differ from actor names in dubbed versions
- **Flexible scheduling** - Belgian productions often have smaller budgets requiring efficient continuity tracking

### Hollywood Standards

- **Detailed physical documentation** - Professional makeup and wardrobe departments require extensive documentation
- **Photo references** - Industry standard for continuity supervisors
- **Scene-by-scene tracking** - Essential for large productions with complex shooting schedules
- **Distinguishing features** - Critical for VFX, prosthetics, and special makeup

### Universal Practices

- **Non-chronological shooting** - Universal challenge addressed by this system
- **Multiple costume changes** - Common in all professional productions
- **Aging effects** - Films spanning time periods require careful documentation
- **Stunts & doubles** - Physical characteristics help match stunt performers

## Demo Data

The system includes Belgian/European-themed demo actors:

1. **Emma De Caluwe** as Sophie Maes - Lead actress with minimal makeup requirements
2. **Thomas Vandenberghe** as Marc Dubois - Supporting role with beard continuity
3. **Marie Dubois** as Claire Laurent - Character with aging makeup requirements
4. **Lucas Peeters** as Jonas Willems - Young actor with multiple costume changes

## Future Enhancements

Planned features for continuity tracking:

1. **Photo Upload** - Direct image uploads to cloud storage
2. **Scene Linking** - Link actors to specific scenes directly from the actors screen
3. **Continuity Reports** - Generate PDF reports for makeup/wardrobe departments
4. **Daily Call Sheets** - Automatically show which actors need which looks for scheduled scenes
5. **Change Tracking** - Timeline of appearance changes throughout the story
6. **Reference Board** - Visual board showing all actors and their current continuity status
7. **Aging Timeline** - Special tools for films with time jumps
8. **Stunt Matching** - Tools to document physical characteristics for stunt coordinator

## File Structure

```
frontend/
├── actors.html                          # Main actors screen
├── css/
│   └── actors.css                       # Actors-specific styling
├── js/
│   ├── actors.js                        # Main application logic
│   └── services/
│       └── actorService.js              # Business logic layer
└── docs/
    ├── migration-add-actors.sql         # Database migration
    └── ACTORS_DOCUMENTATION.md          # This file
```

## Usage Guide

### Adding an Actor

1. Click "Add Actor" button
2. Fill in required fields (Actor Name, Character Name)
3. Add optional physical characteristics
4. Add profile image URL (or leave blank for silhouette)
5. Add any distinguishing features (comma-separated)
6. Add production notes
7. Click "Save Actor"

### Searching Actors

- Type in search box to filter by actor name, character name, or notes
- Results update in real-time

### Viewing Actor Details

- Click on any actor card to open detailed view
- See all physical characteristics
- View continuity timeline (when entries exist)
- Quick access to edit button

### Editing an Actor

- Click "Edit" button on actor card or in detail modal
- Make changes to any fields
- Click "Save Actor"

### Deleting an Actor

- Click delete (trash) button on actor card
- Confirm deletion
- Actor and all associated continuity data will be permanently removed

## Technical Implementation

### Service Layer Pattern

- `ActorService` provides clean API for all database operations
- Separates business logic from UI code
- Reusable across different screens

### Visual Design

- **DaisyUI components** - Professional, accessible UI
- **Responsive grid** - Adapts to screen size (1-4 columns)
- **Character silhouette** - SVG-based placeholder for actors without photos
- **Hover effects** - Interactive card animations
- **Badge system** - Quick-view physical characteristics

### Performance

- **Optimized queries** - Indexed database columns for fast searching
- **Client-side filtering** - Instant search results
- **Lazy loading ready** - Architecture supports pagination for large casts

## Integration Points

The Actors system is designed to integrate with:

- **Scenes** - Link actors to specific scenes they appear in
- **Calendar** - Show which actors are needed on which shooting days
- **Timeline** - Display actors alongside scenes in story order
- **Call Sheets** (future) - Generate daily actor requirements
- **Continuity Photos** (future) - Photo management system

## Migration Instructions

To add the actors feature to an existing Continuity Manager installation:

1. Run the migration SQL in Supabase:
   ```bash
   # Copy contents of migration-add-actors.sql
   # Paste into Supabase SQL Editor
   # Execute
   ```

2. Add navigation links to existing screens (timeline.html, calendar.html)

3. Test with demo data:
   ```javascript
   await ActorService.createDemoActors(projectId);
   ```

## Conclusion

The Actors management system provides a solid foundation for professional continuity tracking in film and television production. Its design accommodates the specific needs of Belgian, European, and Hollywood productions while remaining flexible enough to adapt to any workflow.

The "Create-a-Sim" style visual approach makes it engaging and intuitive, while the comprehensive data model ensures all necessary information is captured for effective continuity management.
