import { Leaderboard } from '@/components/leaderboard'
import { getTopScoresByCategory, getRecentActivity } from '@/lib/supabase'

export const revalidate = 60 // Revalidate every minute

export default async function HomePage() {
  let scoresByCategory = {}
  let recentActivity: any[] = []

  try {
    scoresByCategory = await getTopScoresByCategory()
    recentActivity = await getRecentActivity(10)
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error)
    // Continue with empty data - component will show "no scores" message
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
          Bouslov Bros
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The ultimate family competition. Track your skills, compete for glory, 
          and prove once and for all who&apos;s the best Bouslov.
        </p>
        <div className="flex flex-wrap gap-2 justify-center text-2xl">
          <span>⌨️</span>
          <span>♟️</span>
          <span>⚡</span>
          <span>🧠</span>
          <span>🎯</span>
        </div>
      </div>

      {/* Leaderboard */}
      <Leaderboard 
        initialScores={scoresByCategory} 
        recentActivity={recentActivity} 
      />
    </div>
  )
}
