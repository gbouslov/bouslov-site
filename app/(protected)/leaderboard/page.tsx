import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Leaderboard } from '@/components/leaderboard'
import { getTopScoresByCategory, getRecentActivity } from '@/lib/supabase'

export const revalidate = 60

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

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
