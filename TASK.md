# TASK.md - Bouslov.com Globe Landing Page (v2 - Real Earth)

## Overview
Replace the current procedural dark sphere with a REAL Earth globe with day/night cycle, like Apple's globe.

## Current State
- Globe landing page exists but uses procedural dark sphere (boring)
- Need actual Earth textures with day/night terminator
- Auth gating already working

## Requirements

### 1. Real Earth Globe with Day/Night
Use `react-globe.gl` with the day-night-cycle shader approach:

**Implementation (from react-globe.gl example):**
```bash
npm install react-globe.gl solar-calculator three
```

**Key features needed:**
- Real Earth day texture: `//cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg`
- Real Earth night texture: `//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg`  
- Night sky background: `//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png`
- Custom shader that blends day/night based on sun position
- Solar calculator for realistic sun position
- Smooth day/night terminator (shadow line)
- Slowly rotating

**Reference implementation:**
https://github.com/vasturiano/react-globe.gl/blob/master/example/day-night-cycle/index.html

The shader uses:
- `dayTexture` and `nightTexture` uniforms
- `sunPosition` calculated from solar-calculator
- `smoothstep` blend between day/night at terminator

**Interactive Elements:**
- 4 glowing dots for family members (keep existing)
- On hover: show name tooltip
- Keep connection lines if they exist

**Layout:**
- Globe centered, full hero
- "BOUSLOV" title + "Connected worldwide" tagline
- "Sign In" button
- Dark background with star field

**Vibe:**
- Apple-style realistic Earth
- Premium, sleek
- NO emojis

### 2. Auth Gating
- `/` (root) = Globe landing page (public, no auth required)
- `/leaderboard`, `/profile/*`, etc. = Protected, redirect to sign-in if not authenticated
- After sign-in → redirect to `/leaderboard`
- Only these emails allowed:
  - gbouslov@gmail.com (Gabe)
  - dbouslov@gmail.com (David)
  - jbouslov@gmail.com (Jonathan)
  - bouslovd@gmail.com (Daniel)

### 3. Design System (Strict)
- Background: #09090b (near-black)
- No emojis - EVER
- Icons: Lucide React only
- Typography: Clean, modern sans-serif (Inter or similar)
- Animations: Subtle, smooth, 60fps
- Mobile responsive

## Technical Notes
- Globe libraries to consider: `react-globe.gl`, `@react-three/fiber` + `@react-three/drei`
- Keep bundle size reasonable - lazy load the globe component
- Test performance on mobile
- Supabase project: `oswcicwdjkthjextalyh`

## Family Members (CORRECT NAMES)
| Name | Email | Notes |
|------|-------|-------|
| Gabe | gbouslov@gmail.com | Oldest, entrepreneur |
| David | dbouslov@gmail.com | M2 med student |
| Jonathan | jbouslov@gmail.com | 16yo, twin |
| Daniel | bouslovd@gmail.com | 16yo, twin |

**NOT Jake. NOT Dad. Just the 4 brothers.**

## Success Criteria
1. Landing page loads fast, globe animates smoothly
2. Unauthenticated users see only the globe page
3. Sign-in redirects to leaderboard
4. Non-Bouslov emails rejected gracefully
5. Mobile looks good (globe scales down nicely)
6. No emojis anywhere in the entire site
7. Feels premium, not hobby-project

## Out of Scope (for now)
- Real-time location tracking
- Actual geographic accuracy of dots
- Profile photos (just use initials or icons)
