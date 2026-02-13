import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WishlistsClient } from './wishlists-client'

export const revalidate = 60

export default async function WishlistsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <WishlistsClient
      userEmail={session.user?.email || ''}
      userName={session.user?.name || ''}
    />
  )
}
