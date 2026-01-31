import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllTravels, getTravelCounts } from '@/lib/supabase'
import { TravelClient } from './travel-client'

export const revalidate = 60

export default async function TravelPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  let travels: any[] = []
  let counts: Record<string, number> = {}

  try {
    travels = await getAllTravels()
    counts = await getTravelCounts()
  } catch (error) {
    console.error('Failed to fetch travel data:', error)
  }

  return (
    <TravelClient
      initialTravels={travels}
      initialCounts={counts}
      userEmail={session.user?.email || ''}
    />
  )
}
