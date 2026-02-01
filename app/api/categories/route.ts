import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategories, getAllBestScores } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const [categories, bestScores] = await Promise.all([
      getCategories(),
      getAllBestScores(),
    ])

    // Add leader info to each category
    const categoriesWithLeaders = categories.map(cat => {
      const scores = bestScores[cat.slug] || []
      const leader = scores[0]
      return {
        ...cat,
        leader: leader ? {
          user_name: leader.user_name,
          user_email: leader.user_email,
          value: leader.value,
        } : null,
        participantCount: scores.length,
      }
    })

    return NextResponse.json(categoriesWithLeaders)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
