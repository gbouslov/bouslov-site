import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  TrendingUp,
  Trophy,
  Keyboard,
  Zap,
  Brain,
  Target,
  Crosshair,
  Clock,
  Globe,
  Map,
  Puzzle,
} from 'lucide-react'
import { getScoreHistory, getCategories, FAMILY, type Category, type Score } from '@/lib/supabase'
import { ALLOWED_EMAILS, authOptions } from '@/lib/auth'
import { formatDistanceToNow, format } from 'date-fns'

const ICON_MAP: Record<string, React.ReactNode> = {
  Keyboard: <Keyboard className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Crosshair: <Crosshair className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Map: <Map className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Puzzle: <Puzzle className="h-4 w-4" />,
}

function getIcon(iconName: string): React.ReactNode {
  return ICON_MAP[iconName] || <Trophy className="h-4 w-4" />
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

  const familyMember = FAMILY.find(f => f.email === email.toLowerCase())
  const displayName = familyMember?.name || 'Unknown'

  let categories: Category[] = []
  let allScores: Score[] = []

  try {
    categories = await getCategories()

    // Fetch all scores for this user across all categories
    const scorePromises = categories.map(cat => getScoreHistory(email, cat.slug))
    const results = await Promise.all(scorePromises)
    allScores = results.flat()
  } catch (error) {
    console.error('Failed to fetch profile data:', error)
  }

  // Calculate personal bests per category
  const personalBests: Record<string, { score: Score; category: Category }> = {}
  for (const score of allScores) {
    const category = categories.find(c => c.id === score.category_id)
    if (!category) continue

    if (!personalBests[category.slug]) {
      personalBests[category.slug] = { score, category }
    } else {
      const current = personalBests[category.slug].score.value
      if (category.higher_is_better ? score.value > current : score.value < current) {
        personalBests[category.slug] = { score, category }
      }
    }
  }

  const totalSubmissions = allScores.length
  const categoriesPlayed = Object.keys(personalBests).length

  // Sort all scores by date for history
  const sortedScores = [...allScores].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-3xl bg-zinc-800 text-zinc-300">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-zinc-100">{displayName}</h1>
              <p className="text-zinc-500 text-sm">{email}</p>
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
            <p className="text-zinc-500 text-center py-12 text-sm">No scores recorded yet</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.values(personalBests).map(({ score, category }) => (
                <div
                  key={category.slug}
                  className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-zinc-400">{getIcon(category.icon)}</span>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                      {category.name}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold font-mono text-zinc-100">
                    {score.value}
                    <span className="text-sm text-zinc-500 ml-1">{category.unit}</span>
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
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
          {sortedScores.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-sm">No scores recorded yet</p>
          ) : (
            <div className="space-y-2">
              {sortedScores.slice(0, 20).map(score => {
                const category = categories.find(c => c.id === score.category_id)
                return (
                  <div
                    key={score.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <span className="text-zinc-500">
                      {category ? getIcon(category.icon) : <Trophy className="h-4 w-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 text-sm">{category?.name}</p>
                      <p className="text-xs text-zinc-600">
                        {format(new Date(score.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-zinc-100">
                        {score.value}
                        <span className="text-xs text-zinc-500 ml-1">{category?.unit}</span>
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
                )
              })}
              {sortedScores.length > 20 && (
                <p className="text-sm text-zinc-600 text-center py-2">
                  Showing 20 of {sortedScores.length} scores
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
