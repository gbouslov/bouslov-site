import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy, Calendar, TrendingUp, Award } from 'lucide-react'
import { getUserByEmail, getUserScores } from '@/lib/supabase'
import { CATEGORIES, MEDALS } from '@/lib/constants'
import { EMAIL_TO_NAME, ALLOWED_EMAILS } from '@/lib/auth'
import { formatDistanceToNow, format } from 'date-fns'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const email = decodeURIComponent(id)

  // Validate email is in allowlist
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

  // Calculate personal bests per category
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

  // Count total submissions
  const totalSubmissions = scores.length
  const categoriesPlayed = Object.keys(personalBests).length

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">{email}</p>
              {user?.created_at && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Member since {format(new Date(user.created_at), 'MMMM yyyy')}
                </p>
              )}
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-yellow-500">{totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Scores</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-500">{categoriesPlayed}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Bests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Personal Bests
          </CardTitle>
          <CardDescription>Top scores in each category</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(personalBests).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No scores recorded yet. Start competing!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map(category => {
                const best = personalBests[category.slug]
                if (!best) return null

                return (
                  <Card key={category.slug} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{category.icon}</span>
                        <Badge variant="outline">{category.name}</Badge>
                      </div>
                      <p className="text-3xl font-bold font-mono">
                        {best.score}
                        <span className="text-sm text-muted-foreground ml-1">
                          {category.unit}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(best.created_at), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score History
          </CardTitle>
          <CardDescription>All recorded scores</CardDescription>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No scores recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {scores.slice(0, 20).map(score => (
                <div 
                  key={score.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-2xl">{score.category?.icon || '🏆'}</span>
                  <div className="flex-1">
                    <p className="font-medium">{score.category?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(score.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono">
                      {score.score}
                      <span className="text-sm text-muted-foreground ml-1">
                        {score.category?.unit}
                      </span>
                    </p>
                    {score.proof_url && (
                      <a 
                        href={score.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View Proof
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {scores.length > 20 && (
                <p className="text-sm text-muted-foreground text-center py-2">
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
