# TASK.md - Bouslov.com Globe Landing Page

## Overview
Transform bouslov.com from basic leaderboard into a stunning site with an unauthenticated globe landing page, with all actual content (leaderboard, profiles) behind Google OAuth.

## Current State
- Next.js 15 + shadcn/ui + Supabase + NextAuth (Google OAuth)
- Basic leaderboard functionality working
- Dark mode implemented (#09090b background)
- Auth working for 4 Bouslov emails only

## Requirements

### 1. Globe Landing Page (Unauthenticated)
Create a visually stunning landing page featuring:

**3D Globe:**
- Use Three.js / react-three-fiber / react-globe.gl
- Slowly rotating Earth with subtle glow effect
- Dark/space aesthetic matching site theme
- Smooth, performant animation

**Interactive Elements:**
- 4 glowing dots on the globe representing each family member's location
- On hover: dot expands, shows name + mini avatar/icon
- Optional: connection lines between dots (we're family, connected worldwide)

**Layout:**
- Globe centered, takes up hero section
- Minimal text: "BOUSLOV" title, maybe a subtle tagline
- "Sign In" button (Google OAuth) - sleek, not prominent
- Dark background (#09090b) with subtle star field or gradient

**Vibe:**
- Linear.app / Vercel aesthetic
- NO emojis anywhere - use Lucide icons if needed
- Sleek, modern, premium feel
- "This family is serious about competition" energy

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
