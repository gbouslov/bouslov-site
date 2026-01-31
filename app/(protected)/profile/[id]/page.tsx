import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, Trophy, Keyboard, Crown, Zap, Brain, Target, Crosshair } from 'lucide-react'
import { getUserByEmail, getUserScores } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/constants'
import { EMAIL_TO_NAME, ALLOWED_EMAILS, authOptions } from '@/lib/auth'
import { formatDistanceToNow, format } from 'date-fns'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  wpm: <Keyboard className="h-4 w-4" />,
  chess: <Crown className="h-4 w-4" />,
  reaction: <Zap className="h-4 w-4" />,
  memory: <Brain className="h-4 w-4" />,
  accuracy: <Target className="h-4 w-4" />,
  aim: <Crosshair className="h-4 w-4" />,
}

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const email = decodeURIComponent(id)

  if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
    notFound()
  }

  let user = null
  let scores: any[] = []

  try {
    user = await getUserByEmail(email)
    if (user) {
      scores = await getUserScores(user.id)
    }
  } catch (error) {
    console.error('Failed to fetch profile data:', error)
  }

  const displayName = user?.name || EMAIL_TO_NAME[email.toLowerCase()] || 'Unknown'

  const personalBests: Record<string, any> = {}
  for (const score of scores) {
    const catSlug = score.category?.slug
    if (!catSlug) continue

    const isHigherBetter = score.category?.score_type === 'higher_better'

    if (!personalBests[catSlug]) {
      personalBests[catSlug] = score
    } else {
      const current = personalBests[catSlug].score
      if (isHigherBetter ? score.score > current : score.score < current) {
        personalBests[catSlug] = score
      }
    }
  }

  const totalSubmissions = scores.length
  const categoriesPlayed = Object.keys(personalBests).length

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-3xl bg-zinc-800 text-zinc-300">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-zinc-100">{displayName}</h1>
              <p className="text-zinc-500 text-sm">{email}</p>
              {user?.created_at && (
                <p className="text-sm text-zinc-600 mt-1 flex items-center gap-1 justify-center md:justify-start">
                  <Calendar className="h-3 w-3" />
                  Joined {format(new Date(user.created_at), 'MMMM yyyy')}
                </p>
              )}
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-zinc-100 font-mono">{totalSubmissions}</p>
                <p className="text-xs text-zinc-500">Scores</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-zinc-100 font-mono">{categoriesPlayed}</p>
                <p className="text-xs text-zinc-500">Categories</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Trophy className="h-5 w-5 text-amber-400" />
            Personal Bests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(personalBests).length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-sm">
              No scores recorded yet
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map(category => {
                const best = personalBests[category.slug]
                if (!best) return null

                return (
                  <div
                    key={category.slug}
                    className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-zinc-400">{CATEGORY_ICONS[category.slug]}</span>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        {category.name}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold font-mono text-zinc-100">
                      {best.score}
                      <span className="text-sm text-zinc-500 ml-1">
                        {category.unit}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {formatDistanceToNow(new Date(best.created_at), { addSuffix: true })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-sm">
              No scores recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {scores.slice(0, 20).map(score => (
                <div
                  key={score.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <span className="text-zinc-500">
                    {CATEGORY_ICONS[score.category?.slug || ''] || <Trophy className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-200 text-sm">{score.category?.name}</p>
                    <p className="text-xs text-zinc-600">
                      {format(new Date(score.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-zinc-100">
                      {score.score}
                      <span className="text-xs text-zinc-500 ml-1">
                        {score.category?.unit}
                      </span>
                    </p>
                    {score.proof_url && (
                      <a
                        href={score.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        proof
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {scores.length > 20 && (
                <p className="text-sm text-zinc-600 text-center py-2">
                  Showing 20 of {scores.length} scores
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
