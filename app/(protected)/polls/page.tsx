import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PollsClient } from './polls-client'

export const revalidate = 60

export default async function PollsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <PollsClient
      userEmail={session.user?.email || ''}
      userName={session.user?.name || ''}
    />
  )
}
