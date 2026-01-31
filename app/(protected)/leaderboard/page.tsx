import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Leaderboard } from '@/components/leaderboard'
import { getTopScoresByCategory, getRecentActivity, getAllTravels, getAllStates } from '@/lib/supabase'

export const revalidate = 60

// Allowed family members
const FAMILY = [
  { email: 'gbouslov@gmail.com', name: 'Gabe' },
  { email: 'dbouslov@gmail.com', name: 'David' },
  { email: 'jbouslov@gmail.com', name: 'Jonathan' },
  { email: 'bouslovd@gmail.com', name: 'Daniel' },
]

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  let scoresByCategory: Record<string, any[]> = {}
  let recentActivity: any[] = []

  try {
    scoresByCategory = await getTopScoresByCategory()
    recentActivity = await getRecentActivity(10)

    // Fetch travel data and create synthetic scores
    const travels = await getAllTravels()
    const states = await getAllStates()

    // Count countries per user
    const countryCounts: Record<string, number> = {}
    for (const travel of travels) {
      countryCounts[travel.user_email] = (countryCounts[travel.user_email] || 0) + 1
    }

    // Count states per user
    const stateCounts: Record<string, number> = {}
    for (const state of states) {
      stateCounts[state.user_email] = (stateCounts[state.user_email] || 0) + 1
    }

    // Create synthetic scores for countries
    const countryScores = FAMILY
      .filter(f => countryCounts[f.email] > 0)
      .map(f => ({
        id: `countries-${f.email}`,
        score: countryCounts[f.email] || 0,
        created_at: new Date().toISOString(),
        user: {
          id: f.email,
          name: f.name,
          email: f.email,
          avatar_url: null,
        },
        category: {
          slug: 'countries',
          name: 'Countries',
          unit: '',
          score_type: 'higher_better',
        },
      }))
      .sort((a, b) => b.score - a.score)

    // Create synthetic scores for states
    const stateScores = FAMILY
      .filter(f => stateCounts[f.email] > 0)
      .map(f => ({
        id: `states-${f.email}`,
        score: stateCounts[f.email] || 0,
        created_at: new Date().toISOString(),
        user: {
          id: f.email,
          name: f.name,
          email: f.email,
          avatar_url: null,
        },
        category: {
          slug: 'states',
          name: 'US States',
          unit: '',
          score_type: 'higher_better',
        },
      }))
      .sort((a, b) => b.score - a.score)

    scoresByCategory['countries'] = countryScores
    scoresByCategory['states'] = stateScores
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error)
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          Leaderboard
        </h1>
        <p className="text-zinc-400">
          Track the competition
        </p>
      </div>

      <Leaderboard
        initialScores={scoresByCategory}
        recentActivity={recentActivity}
      />
    </div>
  )
}
