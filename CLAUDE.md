# bouslov.com - Family Competition Leaderboard

## Project Overview
A private family competition site for the Bouslov brothers to track and compete across various skill challenges.

## The Family
- **Gabe** (gbouslov@gmail.com) - Creator, oldest brother
- **David** (dbouslov@gmail.com) - Med student (M2, surgery rotation)
- **Jonathan** (jbouslov@gmail.com) - 16yo twin
- **Daniel** (bouslovd@gmail.com) - 16yo twin

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **Auth:** NextAuth.js with Google OAuth (email allowlist)
- **Database:** Supabase (project: oswcicwdjkthjextalyh)
- **Hosting:** Vercel
- **Domain:** bouslov.com

## Design Requirements (IMPORTANT)
- **Light and dark mode** - Managed via next-themes, defaultTheme="dark". Use semantic CSS variable classes (bg-background, text-foreground, border-border, bg-muted, etc.) instead of hardcoded zinc colors. Landing page is always dark.
- **NO EMOJIS** - Use Lucide icons if needed
- **Sleek, modern aesthetic** - Think Linear, Vercel, Raycast
- **Not cringey** - No "Supreme Champion" titles, no playful copy
- **Minimal** - Clean typography, good whitespace, subtle animations

## Current Goals
1. Build a stunning globe landing page (Three.js/React Three Fiber)
2. "Access" button leads to sign-in
3. Gate ALL content behind auth - non-Bouslovs see nothing
4. Categories link to external sites (MonkeyType, Chess.com, HumanBenchmark)
5. Users manually log scores after competing

## Competition Categories
| Category | External Site | Score Type |
|----------|--------------|------------|
| Typing Speed | monkeytype.com | Higher = better (WPM) |
| Chess Rating | chess.com | Higher = better (ELO) |
| Reaction Time | humanbenchmark.com | Lower = better (ms) |
| Memory | humanbenchmark.com | Higher = better (level) |
| Typing Accuracy | keybr.com | Higher = better (%) |
| Aim Trainer | humanbenchmark.com | Lower = better (ms) |

## Auth Allowlist
ONLY these emails can access:
- gbouslov@gmail.com
- dbouslov@gmail.com
- jbouslov@gmail.com
- bouslovd@gmail.com

## File Structure
```
app/
├── page.tsx           # Landing page (globe, access button)
├── dashboard/         # Main app (gated)
│   ├── page.tsx       # Leaderboard
│   └── submit/        # Score submission
├── login/page.tsx     # Sign in
├── api/auth/          # NextAuth
└── api/scores/        # Score CRUD
```

## Development Rules
- Use `pnpm` for package management
- Dark mode is forced via `dark` class on html
- All new components should use shadcn patterns
- Test locally before pushing
- Vercel auto-deploys on push to main

## Environment Variables (Vercel)
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
