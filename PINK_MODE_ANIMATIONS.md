# Pink Mode: Calendar Drag & Drop Animations

## Overview

This feature adds smooth "suck in" and "grow out" animations when dragging and dropping scenes on the calendar. The animations make the drag-and-drop interaction feel more fluid and intuitive.

## Animation Behavior

### Dragging from Unscheduled List
1. **Drag Start**: Scene card gets a slight opacity reduction
2. **During Drag**: Cursor position is tracked
3. **On Drop**: Scene "grows" from the cursor position into its final calendar position
   - Single-day scenes: Simple grow animation
   - Multi-day scenes: Enhanced grow with rotation effect

### Moving Calendar Events
1. **Drag Start**: Original calendar event is detected, creates a "shrink" clone that collapses toward the cursor
2. **During Drag**: Cursor position is continuously tracked
3. **On Drop**: Scene "grows" from cursor to its new position
   - Respects non-shooting days and split groups
   - Animates to final position(s) if scene needs to be split

## Technical Implementation

### Files
- **`frontend/css/calendar-animations.css`**: CSS animations and keyframes
- **`frontend/js/utils/calendarAnimations.js`**: Animation controller class
- **`frontend/js/calendar-toastui.js`**: Integration with calendar drag-and-drop

### Key Features
- Uses cubic-bezier easing for smooth, bouncy animations
- Handles multi-day scenes with special effects
- Tracks cursor position for accurate animation origins
- Clones elements for animations without disrupting actual DOM
- Temporary element visibility management for seamless transitions

### Animation Timing
- Shrink animation: 400ms
- Grow animation (single-day): 500ms
- Grow animation (multi-day): 600ms with rotation
- Highlight effect: 1000ms fade-out

## Customization

To adjust animation timing or easing:
1. Edit `calendar-animations.css`
2. Modify the `cubic-bezier` values or animation durations
3. Adjust keyframe percentages for different animation curves

## Future Enhancements
- Add trail effects during drag
- Implement haptic feedback on supported devices
- Add sound effects (optional)
- Particle effects on drop
