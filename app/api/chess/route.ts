import { NextResponse } from 'next/server'

// Username mapping: email -> chess.com username
const USERNAME_MAP: Record<string, string> = {
  'gbouslov@gmail.com': 'gbouslov',
  'dbouslov@gmail.com': 'dbouslov',
  'jbouslov@gmail.com': 'jbouslov',
  'bouslovd@gmail.com': 'bouslovd',
  'bouslovb@gmail.com': 'bouslovb',
}

const FAMILY = [
  { email: 'gbouslov@gmail.com', name: 'Gabe' },
  { email: 'dbouslov@gmail.com', name: 'David' },
  { email: 'jbouslov@gmail.com', name: 'Jonathan' },
  { email: 'bouslovd@gmail.com', name: 'Daniel' },
  { email: 'bouslovb@gmail.com', name: 'Dad' },
]

interface ChessStats {
  chess_bullet?: { last?: { rating: number } }
  chess_blitz?: { last?: { rating: number } }
  chess_rapid?: { last?: { rating: number } }
  chess_daily?: { last?: { rating: number } }
  puzzle_rush?: { best?: { score: number } }
}

interface ChessRatings {
  bullet: number | null
  blitz: number | null
  rapid: number | null
  daily: number | null
  puzzleRush: number | null
}

interface UserChessData {
  email: string
  name: string
  username: string
  ratings: ChessRatings
}

async function fetchChessStats(username: string): Promise<ChessStats | null> {
  try {
    const res = await fetch(`https://api.chess.com/pub/player/${username}/stats`, {
      headers: {
        'User-Agent': 'bouslov-site/1.0',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!res.ok) {
      console.error(`Failed to fetch chess stats for ${username}: ${res.status}`)
      return null
    }

    return await res.json()
  } catch (error) {
    console.error(`Error fetching chess stats for ${username}:`, error)
    return null
  }
}

function extractRatings(stats: ChessStats | null): ChessRatings {
  return {
    bullet: stats?.chess_bullet?.last?.rating ?? null,
    blitz: stats?.chess_blitz?.last?.rating ?? null,
    rapid: stats?.chess_rapid?.last?.rating ?? null,
    daily: stats?.chess_daily?.last?.rating ?? null,
    puzzleRush: stats?.puzzle_rush?.best?.score ?? null,
  }
}

export async function GET() {
  const results: UserChessData[] = []

  // Fetch all users in parallel
  const fetchPromises = FAMILY.map(async (user) => {
    const username = USERNAME_MAP[user.email]
    if (!username) return null

    const stats = await fetchChessStats(username)
    const ratings = extractRatings(stats)

    return {
      email: user.email,
      name: user.name,
      username,
      ratings,
    }
  })

  const allResults = await Promise.all(fetchPromises)

  for (const result of allResults) {
    if (result) {
      results.push(result)
    }
  }

  // Group by rating type for leaderboard format
  const leaderboards: Record<string, { email: string; name: string; rating: number }[]> = {
    bullet: [],
    blitz: [],
    rapid: [],
    daily: [],
    puzzleRush: [],
  }

  for (const user of results) {
    if (user.ratings.bullet !== null) {
      leaderboards.bullet.push({ email: user.email, name: user.name, rating: user.ratings.bullet })
    }
    if (user.ratings.blitz !== null) {
      leaderboards.blitz.push({ email: user.email, name: user.name, rating: user.ratings.blitz })
    }
    if (user.ratings.rapid !== null) {
      leaderboards.rapid.push({ email: user.email, name: user.name, rating: user.ratings.rapid })
    }
    if (user.ratings.daily !== null) {
      leaderboards.daily.push({ email: user.email, name: user.name, rating: user.ratings.daily })
    }
    if (user.ratings.puzzleRush !== null) {
      leaderboards.puzzleRush.push({ email: user.email, name: user.name, rating: user.ratings.puzzleRush })
    }
  }

  // Sort each leaderboard by rating (higher is better)
  for (const key of Object.keys(leaderboards)) {
    leaderboards[key].sort((a, b) => b.rating - a.rating)
  }

  return NextResponse.json({
    users: results,
    leaderboards,
    fetchedAt: new Date().toISOString(),
  })
}
