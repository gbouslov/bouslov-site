# Design Polish Task - Leaderboard Visual Hierarchy

## Context
The leaderboard functionality is complete. Now we need a design polish pass to improve visual hierarchy, scannability, and overall aesthetic.

**Current state:** Functional but visually flat - monotone zinc grey everywhere, hard to scan quickly.

## Design Goals

### 1. Color-Coded Category Groups
Assign distinct accent colors to category types:
- **Chess** (all 5 variants): Gold/amber (`amber-500`, `amber-400`)
- **Cognitive tests** (Memory, Reaction Time, Aim): Blue (`blue-500`, `blue-400`)  
- **Travel** (Countries, US States): Green (`emerald-500`, `emerald-400`)
- **Typing** (Speed, Accuracy): Purple (`violet-500`, `violet-400`)
- **Puzzle Rush**: Could be orange or part of Chess group

### 2. Visual Hierarchy Improvements
- **Section headers** ("Overall Standings", "Categories") need thicker accent lines underneath
- **Category group labels** - Add small subheaders like "Chess Ratings", "Cognitive Tests", "Travel", "Typing" to group related cards
- **Card grouping** - Visually cluster the 5 chess variants together, etc.

### 3. Card Improvements
- **Leader highlight** - Cards with a leader get a subtle left border in the category's accent color
- **Score prominence** - Make the actual scores bigger/bolder (the "52 count" is buried)
- **Empty state differentiation** - "No scores yet" cards should be more obviously muted/greyed out (lower opacity, dashed border?)

### 4. Standings Polish
- **1st/2nd/3rd** - Gold/silver/bronze tints on top 3 positions
- **Progress bars** - Should use accent colors based on relative position

### 5. Interactions
- **Hover states** - Cards should have hover states with category accent colors
- **Transitions** - Smooth color transitions on hover

## Constraints
- Keep dark theme (#09090b background, zinc-800/900 cards)
- NO emojis - use Lucide icons only
- Keep existing functionality intact
- Maintain the current grid layout structure

## Files to Modify
- `components/leaderboard.tsx` - Main component
- `lib/constants.ts` - May need category color mappings
- Possibly `tailwind.config.ts` if custom colors needed

## References
Current screenshot shows the monotone issue clearly - everything blends together.

---

**IMPORTANT:** First ideate and present your design plan with specific color choices, component changes, and visual examples (described). Do not implement until the plan is reviewed.
