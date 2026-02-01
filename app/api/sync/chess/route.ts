import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, ALLOWED_EMAILS } from '@/lib/auth'
import { submitScore, FAMILY, getCategoryBySlug } from '@/lib/supabase'
import { CHESS_USERNAMES } from '@/lib/constants'

interface ChessStats {
  chess_bullet?: { last?: { rating: number } }
  chess_blitz?: { last?: { rating: number } }
  chess_rapid?: { last?: { rating: number } }
  chess_daily?: { last?: { rating: number } }
  puzzle_rush?: { best?: { score: number } }
}

async function fetchChessStats(username: string): Promise<ChessStats | null> {
  try {
    const res = await fetch(`https://api.chess.com/pub/player/${username}/stats`, {
      headers: {
        'User-Agent': 'bouslov-site/1.0',
      },
      next: { revalidate: 0 }, // Don't cache for sync
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

// Mapping from chess.com stat keys to our category slugs
const CHESS_CATEGORIES = [
  { statKey: 'chess_bullet', slug: 'chess_bullet', ratingPath: 'last.rating' },
  { statKey: 'chess_blitz', slug: 'chess_blitz', ratingPath: 'last.rating' },
  { statKey: 'chess_rapid', slug: 'chess_rapid', ratingPath: 'last.rating' },
  { statKey: 'chess_daily', slug: 'chess_daily', ratingPath: 'last.rating' },
  { statKey: 'puzzle_rush', slug: 'chess_puzzle_rush', ratingPath: 'best.score' },
]

function getRating(stats: ChessStats, statKey: string, ratingPath: string): number | null {
  const statData = stats[statKey as keyof ChessStats]
  if (!statData) return null

  const pathParts = ratingPath.split('.')
  let value: unknown = statData
  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part]
    } else {
      return null
    }
  }

  return typeof value === 'number' ? value : null
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const email = session.user.email.toLowerCase()

    if (!ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const results: {
      user: string
      synced: { category: string; rating: number }[]
      errors: string[]
    }[] = []

    // Sync chess ratings for all family members
    for (const member of FAMILY) {
      const username = CHESS_USERNAMES[member.email]
      if (!username) {
        results.push({
          user: member.name,
          synced: [],
          errors: [`No chess.com username configured for ${member.name}`],
        })
        continue
      }

      const stats = await fetchChessStats(username)
      if (!stats) {
        results.push({
          user: member.name,
          synced: [],
          errors: [`Failed to fetch stats for ${username}`],
        })
        continue
      }

      const synced: { category: string; rating: number }[] = []
      const errors: string[] = []

      for (const { statKey, slug, ratingPath } of CHESS_CATEGORIES) {
        const rating = getRating(stats, statKey, ratingPath)
        if (rating === null) continue

        try {
          const category = await getCategoryBySlug(slug)
          if (!category) {
            errors.push(`Category not found: ${slug}`)
            continue
          }

          await submitScore(
            member.email,
            member.name,
            slug,
            rating,
            `https://www.chess.com/member/${username}`,
            'api'
          )

          synced.push({ category: category.name, rating })
        } catch (error) {
          errors.push(`Failed to save ${slug}: ${error}`)
        }
      }

      results.push({
        user: member.name,
        synced,
        errors,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Chess ratings synced',
      results,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Chess sync error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support GET for easy testing
export async function GET() {
  return POST()
}
