# TASK: Globe Pins Feature

## Overview
Add interactive pins to the globe on bouslov.com. Each brother can drop pins with rich content (links, images, text) for places they've been or want to visit.

## User Stories
1. As a Bouslov, I can click on the globe to add a pin at any location
2. As a Bouslov, I can add title, description, links, and images to my pin
3. As a Bouslov, I can see all pins from all brothers on the globe
4. As a Bouslov, I can click a pin to see its full details
5. As a Bouslov, I can filter pins by brother or pin type
6. As a Bouslov, I can edit/delete my own pins

## Pin Types
- 🎯 **Bucket List** - Places we want to visit
- ✈️ **Trip Planned** - Upcoming confirmed trips
- 📍 **Been There** - Places we've visited
- 🏠 **Home Base** - Where we live/lived

## Design Requirements

### Globe Integration
- Pins render as 3D markers on the existing react-globe.gl
- Different colors/icons per pin type
- Pulse animation for upcoming trips
- Cluster nearby pins when zoomed out
- Smooth camera animation when clicking a pin

### Pin Marker Visual
```
     ╭─────────╮
     │  ICON   │  ← Pin type icon (emoji or Lucide)
     ╰────┬────╯
          │
          ▼       ← Spike pointing to location
```
- Glow effect matching pin type color
- Hover shows preview tooltip (title + who added it)
- Click opens detail panel

### Pin Detail Panel (Slide-in from right)
```
┌─────────────────────────────────┐
│ ✕                    [Edit] 🗑️  │
├─────────────────────────────────┤
│ 🎯 Bucket List                  │
│                                 │
│ TOKYO, JAPAN                    │
│ Added by Gabe • Jan 31, 2026    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │    [Image carousel]         │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ "Want to visit during cherry   │
│ blossom season. Heard the      │
│ ramen is incredible."          │
│                                 │
│ 🔗 Links                        │
│ • Tokyo travel guide →         │
│ • Flight deals →               │
│                                 │
│ 💬 Comments (3)                 │
│ ├─ David: "I'm down for 2027"  │
│ └─ Jonathan: "🔥"              │
│                                 │
│ [Add comment...]               │
└─────────────────────────────────┘
```

### Add Pin Modal
- Click anywhere on globe → "Add pin here?"
- Or search for location by name
- Form fields:
  - Pin type (dropdown)
  - Title (required)
  - Description (textarea, markdown support)
  - Links (add multiple)
  - Images (upload to Supabase storage)
  - Date (optional - for planned trips)

### Color Scheme (match existing dark theme)
- Bucket List: `#8B5CF6` (purple)
- Trip Planned: `#F59E0B` (amber)  
- Been There: `#10B981` (green)
- Home Base: `#3B82F6` (blue)

## Technical Spec

### Database Schema (Supabase)
```sql
-- Pins table
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- email from NextAuth
  user_name TEXT NOT NULL, -- display name
  
  -- Location
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  location_name TEXT, -- "Tokyo, Japan"
  
  -- Content
  pin_type TEXT NOT NULL CHECK (pin_type IN ('bucket_list', 'trip_planned', 'been_there', 'home_base')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Rich content (JSONB)
  links JSONB DEFAULT '[]', -- [{title: string, url: string}]
  images JSONB DEFAULT '[]', -- [{url: string, caption?: string}]
  
  -- Optional date for trips
  trip_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE pin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Pins are viewable by authenticated users" ON pins
  FOR SELECT USING (true);

-- Only owner can update/delete
CREATE POLICY "Users can insert their own pins" ON pins
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can update their own pins" ON pins
  FOR UPDATE USING (user_id = current_user_email());
  
CREATE POLICY "Users can delete their own pins" ON pins
  FOR DELETE USING (user_id = current_user_email());

-- Same for comments
CREATE POLICY "Comments are viewable by all" ON pin_comments
  FOR SELECT USING (true);
  
CREATE POLICY "Users can add comments" ON pin_comments
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can delete their own comments" ON pin_comments
  FOR DELETE USING (user_id = current_user_email());
```

### API Routes
```
GET    /api/pins          - List all pins
POST   /api/pins          - Create pin
GET    /api/pins/[id]     - Get pin details
PUT    /api/pins/[id]     - Update pin (owner only)
DELETE /api/pins/[id]     - Delete pin (owner only)

POST   /api/pins/[id]/comments    - Add comment
DELETE /api/pins/[id]/comments/[commentId] - Delete comment
```

### Components to Build
```
components/
├── globe/
│   ├── GlobeWithPins.tsx      # Main globe with pin layer
│   ├── PinMarker.tsx          # 3D pin marker component
│   └── PinCluster.tsx         # Clustered pins view
├── pins/
│   ├── PinDetailPanel.tsx     # Slide-in detail view
│   ├── AddPinModal.tsx        # Create/edit pin form
│   ├── PinTypeSelector.tsx    # Pin type dropdown with colors
│   ├── ImageUploader.tsx      # Multi-image upload
│   ├── LinkEditor.tsx         # Add/remove links
│   └── CommentSection.tsx     # Comments list + add
└── ui/
    └── ... (existing shadcn components)
```

### Dependencies to Add
```bash
pnpm add @supabase/storage-js  # For image uploads
pnpm add react-dropzone        # Drag & drop images
pnpm add supercluster          # Pin clustering
```

## Implementation Order
1. Database: Create tables and RLS policies in Supabase
2. API: Build CRUD endpoints for pins
3. Globe: Add pin marker layer to existing globe
4. UI: Pin detail panel (view mode)
5. UI: Add pin modal (create mode)
6. UI: Edit/delete functionality
7. Feature: Image upload to Supabase storage
8. Feature: Comments
9. Feature: Pin clustering
10. Polish: Animations, transitions, mobile responsive

## Success Criteria
- [ ] Pins visible on globe with correct positioning
- [ ] Click pin → detail panel slides in
- [ ] Can add new pin by clicking globe
- [ ] Can upload images
- [ ] Can add links
- [ ] Comments working
- [ ] Mobile responsive
- [ ] Animations feel smooth
- [ ] Matches existing dark theme aesthetic

## Reference
- Existing globe: `components/globe/` in bouslov-site
- Design system: shadcn/ui with dark theme (#09090b background)
- Auth: NextAuth with Google OAuth (Bouslov emails only)
- DB: Supabase project `oswcicwdjkthjextalyh`
