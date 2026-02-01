# TASK: Fix Travel Highlighting + Add Favicon

## COMPLETED

### 1. Countries Not Highlighting - FIXED
**Root cause:** The GeoJSON from `datasets/geo-countries` uses different property names than expected:
- Country code: `ISO3166-1-Alpha-2` (not `ISO_A2`)
- Country name: `name` (not `ADMIN`)

**Fix:** Updated `components/travel-globe.tsx` to use correct property names.

### 2. Favicon - ADDED
Created a modern "B" monogram favicon with blue gradient (#3b82f6 → #1d4ed8):
- `public/favicon.ico` - 32x32 ICO
- `public/favicon-16x16.png` - 16x16 PNG
- `public/favicon-32x32.png` - 32x32 PNG
- `public/icon-192.png` - 192x192 PWA icon
- `app/icon.svg` - SVG for modern browsers
- `app/apple-icon.png` - 180x180 Apple touch icon

Updated `app/layout.tsx` with proper icon metadata.

## Deployed
- Production: https://bouslov.com
