import { Leaderboard } from '@/components/leaderboard'
import { getTopScoresByCategory, getRecentActivity } from '@/lib/supabase'

export const revalidate = 60

export default async function HomePage() {
  let scoresByCategory = {}
  let recentActivity: any[] = []

  try {
    scoresByCategory = await getTopScoresByCategory()
    recentActivity = await getRecentActivity(10)
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error)
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
          Bouslov Bros
        </h1>
        <p className="text-lg text-zinc-400 max-w-md mx-auto">
          Family competition tracker
        </p>
      </div>

      {/* Leaderboard */}
      <Leaderboard 
        initialScores={scoresByCategory} 
        recentActivity={recentActivity} 
      />
    </div>
  )
}
