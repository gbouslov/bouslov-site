# 🏆 Bouslov Bros - Family Competition Leaderboard

A competitive leaderboard for the Bouslov family to track and compare skills across various categories.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e)

## ✨ Features

- **🏅 Overall Rankings** - See who's the best Bouslov overall
- **📊 Category Leaderboards** - Compete in typing, chess, reaction time, memory, and more
- **📝 Score Logging** - Record your scores with optional proof screenshots
- **👤 Profile Pages** - View personal bests and score history
- **🔒 Family Only** - Google OAuth with email allowlist

## 🎮 Categories

| Category | Test Site | Unit | Goal |
|----------|-----------|------|------|
| ⌨️ Typing Speed | [monkeytype.com](https://monkeytype.com) | WPM | Higher |
| ♟️ Chess | [chess.com](https://chess.com) | ELO | Higher |
| ⚡ Reaction Time | [humanbenchmark.com](https://humanbenchmark.com/tests/reactiontime) | ms | Lower |
| 🧠 Memory | [humanbenchmark.com](https://humanbenchmark.com/tests/memory) | level | Higher |
| 🎯 Typing Accuracy | [keybr.com](https://keybr.com) | % | Higher |
| 🎯 Aim Trainer | [humanbenchmark.com](https://humanbenchmark.com/tests/aim) | ms | Lower |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- Google Cloud Console access (for OAuth)

### 1. Clone and Install

```bash
cd ~/Code/bouslov-site
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings > API**

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services > Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://bouslov.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🚢 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create bouslov-site --private --source=. --push
```

### 2. Deploy

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables (same as `.env.local`)
4. Deploy!

### 3. Configure Domain

1. In Vercel project settings, go to **Domains**
2. Add `bouslov.com`
3. Update DNS at your registrar:
   - A record: `76.76.19.61`
   - CNAME: `cname.vercel-dns.com`
4. Update `NEXTAUTH_URL` in Vercel env vars to `https://bouslov.com`
5. Add production callback URL in Google Cloud Console

## 📁 Project Structure

```
bouslov-site/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │   └── scores/route.ts              # Score submission API
│   ├── login/page.tsx                   # Login page
│   ├── submit/page.tsx                  # Score entry page
│   ├── profile/[id]/page.tsx            # User profile page
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Home/leaderboard
├── components/
│   ├── ui/                              # shadcn/ui components
│   ├── leaderboard.tsx                  # Main leaderboard display
│   ├── score-form.tsx                   # Score submission form
│   ├── nav.tsx                          # Navigation bar
│   └── providers.tsx                    # Context providers
├── lib/
│   ├── auth.ts                          # NextAuth config
│   ├── supabase.ts                      # Supabase client & helpers
│   ├── constants.ts                     # Categories & constants
│   └── utils.ts                         # Utility functions
├── supabase/
│   └── schema.sql                       # Database schema
└── .env.example                         # Environment template
```

## 🔒 Security

- **Email Allowlist**: Only these emails can sign in:
  - gbouslov@gmail.com
  - dbouslov@gmail.com
  - jbouslov@gmail.com
  - bouslovd@gmail.com
- **Rate Limiting**: 5 minute cooldown per category
- **Score Validation**: Sanity checks on submitted values
- **RLS Enabled**: Row-level security on all tables

## 🛠️ Development

```bash
# Run dev server
npm run dev

# Type check
npm run build

# Lint
npm run lint
```

## 📝 Adding New Categories

1. Add to `lib/constants.ts`:
```typescript
{
  slug: 'new-category',
  name: 'New Category',
  external_url: 'https://example.com',
  score_type: 'higher_better', // or 'lower_better'
  unit: 'pts',
  icon: '🆕',
  description: 'Description here',
}
```

2. Run SQL in Supabase:
```sql
INSERT INTO categories (slug, name, external_url, score_type, unit, icon)
VALUES ('new-category', 'New Category', 'https://example.com', 'higher_better', 'pts', '🆕');
```

## 🎨 Customization

- Colors: Edit `app/globals.css` CSS variables
- Components: All shadcn/ui components in `components/ui/`
- Categories: Modify `lib/constants.ts`

## 📄 License

Private family project. All rights reserved.

---

Built with ❤️ for the Bouslov family
