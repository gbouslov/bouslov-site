import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Leaderboard } from '@/components/leaderboard'
import {
  getCategories,
  getAllBestScores,
  getRecentScores,
  getAllTravels,
  getAllStates,
  FAMILY,
} from '@/lib/supabase'

export const revalidate = 60

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let scoresByCategory: Record<string, Awaited<ReturnType<typeof getRecentScores>>> = {}
  let recentActivity: Awaited<ReturnType<typeof getRecentScores>> = []
  let travelScores = {
    countries: [] as { email: string; name: string; count: number }[],
    states: [] as { email: string; name: string; count: number }[],
  }

  try {
    // Fetch all data in parallel
    const [
      categoriesData,
      bestScoresData,
      recentScoresData,
      travelsData,
      statesData,
    ] = await Promise.all([
      getCategories(),
      getAllBestScores(),
      getRecentScores(15),
      getAllTravels(),
      getAllStates(),
    ])

    categories = categoriesData
    scoresByCategory = bestScoresData
    recentActivity = recentScoresData

    // Calculate travel counts per user
    const countryCounts: Record<string, number> = {}
    for (const travel of travelsData) {
      countryCounts[travel.user_email] = (countryCounts[travel.user_email] || 0) + 1
    }

    const stateCounts: Record<string, number> = {}
    for (const state of statesData) {
      stateCounts[state.user_email] = (stateCounts[state.user_email] || 0) + 1
    }

    // Convert to sorted arrays for ranking
    travelScores.countries = FAMILY
      .filter(f => countryCounts[f.email] > 0)
      .map(f => ({
        email: f.email,
        name: f.name,
        count: countryCounts[f.email] || 0,
      }))
      .sort((a, b) => b.count - a.count)

    travelScores.states = FAMILY
      .filter(f => stateCounts[f.email] > 0)
      .map(f => ({
        email: f.email,
        name: f.name,
        count: stateCounts[f.email] || 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Create synthetic scores for travel categories so they show in the grid
    const countriesCategory = categories.find(c => c.slug === 'countries_visited')
    const statesCategory = categories.find(c => c.slug === 'us_states')

    if (countriesCategory) {
      scoresByCategory['countries_visited'] = travelScores.countries.map(entry => ({
        id: `countries-${entry.email}`,
        user_email: entry.email,
        user_name: entry.name,
        category_id: countriesCategory.id,
        value: entry.count,
        proof_url: null,
        source: 'travel',
        created_at: new Date().toISOString(),
        category: countriesCategory,
      }))
    }

    if (statesCategory) {
      scoresByCategory['us_states'] = travelScores.states.map(entry => ({
        id: `states-${entry.email}`,
        user_email: entry.email,
        user_name: entry.name,
        category_id: statesCategory.id,
        value: entry.count,
        proof_url: null,
        source: 'travel',
        created_at: new Date().toISOString(),
        category: statesCategory,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error)
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          Leaderboard
        </h1>
        <p className="text-zinc-400">Track the competition</p>
      </div>

      <Leaderboard
        categories={categories}
        scoresByCategory={scoresByCategory}
        recentActivity={recentActivity}
        travelScores={travelScores}
      />
    </div>
  )
}
