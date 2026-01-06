# Release v0.2.5.01

**Release Date:** January 6, 2026  
**Type:** Hotfix

## Summary

Quick hotfix to resolve cast grid filtering issue and improve badge color consistency on timeline cards.

## Bug Fixes

- **Cast Grid Filter**: Fixed filter functionality to properly check `assignment_type` on character assignments instead of the non-existent `role_type` field. The filter now correctly shows actors/stunt performers/voice-over artists when filtered.

- **Timeline Badge Colors**: 
  - Script Day (SD) badges now use secondary color (`badge-secondary`) for better visual distinction from cast badges
  - Cast member badges now consistently use primary color (`badge-primary`) on all timeline cards
  - Removed conditional styling that caused inconsistent badge colors

## Technical Changes

- Added `.env` file support for storing Supabase credentials
- Updated `upload-assets.ps1` to automatically load credentials from `.env` file
- Cast grid filter now iterates through `character_assignments` array to match assignment types
- Badge styling simplified for consistency

## Documentation

- Users can now store `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env` file (already in `.gitignore`)
- No more manual credential entry when uploading assets
