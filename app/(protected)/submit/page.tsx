import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ScoreForm } from '@/components/score-form'
import { getCategories } from '@/lib/supabase'

export default async function SubmitPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const categories = await getCategories()

  return (
    <div className="py-8">
      <ScoreForm categories={categories} />
    </div>
  )
}
