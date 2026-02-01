'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Trophy,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
  ExternalLink,
  Keyboard,
  Target,
  Brain,
  Crosshair,
  Zap,
  Globe,
  Map,
  Calendar,
  Puzzle,
} from 'lucide-react'
import { RANK_LABELS, RANK_COLORS, RANK_BG } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import type { Category, Score } from '@/lib/supabase'

// Icon mapping
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

interface LeaderboardProps {
  categories: Category[]
  scoresByCategory: Record<string, Score[]>
  recentActivity: Score[]
  travelScores: {
    countries: { email: string; name: string; count: number }[]
    states: { email: string; name: string; count: number }[]
  }
}

export function Leaderboard({
  categories,
  scoresByCategory,
  recentActivity,
  travelScores,
}: LeaderboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)

  // Calculate overall rankings from all categories
  const overallRankings = calculateOverallRankings(scoresByCategory, travelScores, categories)

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync/chess', { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      }
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync Chess
          </Button>
          <LogScoreModal
            categories={categories}
            open={logModalOpen}
            onOpenChange={setLogModalOpen}
          />
        </div>
      </div>

      {/* Overall Rankings */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Trophy className="h-5 w-5 text-amber-400" />
            Overall Standings
          </CardTitle>
          <p className="text-sm text-zinc-500">
            Points = Sum of category placements (1st=4pts, 2nd=3pts, 3rd=2pts, 4th=1pt)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {overallRankings.map((player, index) => (
              <div
                key={player.email}
                className={`relative p-4 rounded-lg border transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/50 ${
                  index === 0
                    ? 'border-amber-400/30 bg-amber-400/5'
                    : index === 1
                    ? 'border-zinc-500/30 bg-zinc-500/5'
                    : index === 2
                    ? 'border-orange-600/30 bg-orange-600/5'
                    : 'border-zinc-800 bg-zinc-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`text-sm font-mono font-medium ${
                      RANK_COLORS[index] || 'text-zinc-500'
                    }`}
                  >
                    {RANK_LABELS[index] || `#${index + 1}`}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300">
                      {player.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-zinc-100 truncate">{player.name}</h3>
                    <p className="text-sm text-zinc-500 font-mono">{player.points} pts</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      index === 0
                        ? 'bg-amber-400'
                        : index === 1
                        ? 'bg-zinc-400'
                        : index === 2
                        ? 'bg-orange-600'
                        : 'bg-zinc-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (player.points / (overallRankings[0]?.points || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Grid */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map(category => {
              const scores = scoresByCategory[category.slug] || []
              const leader = scores[0]
              const isInternal = category.external_url?.startsWith('/')

              return (
                <div
                  key={category.id}
                  className="group relative p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                        {getIcon(category.icon)}
                      </div>
                      <div>
                        <h3 className="font-medium text-zinc-100 text-sm">{category.name}</h3>
                        <p className="text-xs text-zinc-500">{category.description}</p>
                      </div>
                    </div>
                  </div>

                  {leader ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                          {leader.user_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-zinc-300">{leader.user_name}</span>
                      <span className="ml-auto font-mono text-sm text-zinc-100">
                        {leader.value}
                        <span className="text-zinc-500 ml-0.5 text-xs">{category.unit}</span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600">No scores yet</p>
                  )}

                  {category.external_url && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      {isInternal ? (
                        <Link
                          href={category.external_url}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          View <Globe className="h-3 w-3" />
                        </Link>
                      ) : (
                        <a
                          href={category.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          Take Test <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Detail Modal */}
      <CategoryDetailModal
        category={selectedCategory}
        scores={selectedCategory ? scoresByCategory[selectedCategory.slug] || [] : []}
        onClose={() => setSelectedCategory(null)}
      />

      {/* Recent Activity */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Clock className="h-5 w-5 text-zinc-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(score => (
                <div
                  key={score.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/30 transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                      {score.user_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-zinc-200 text-sm">{score.user_name}</span>
                  <span className="font-mono text-sm bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                    {score.value} {score.category?.unit}
                  </span>
                  <span className="text-zinc-400 text-sm flex items-center gap-1.5">
                    {score.category && getIcon(score.category.icon)}
                    {score.category?.name}
                  </span>
                  <span className="text-zinc-600 ml-auto text-xs">
                    {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CategoryDetailModal({
  category,
  scores,
  onClose,
}: {
  category: Category | null
  scores: Score[]
  onClose: () => void
}) {
  if (!category) return null

  return (
    <Dialog open={!!category} onOpenChange={() => onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            {getIcon(category.icon)}
            {category.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">{category.description}</p>

          {scores.length === 0 ? (
            <p className="text-zinc-500 text-center py-8 text-sm">No scores yet</p>
          ) : (
            <div className="space-y-2">
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    RANK_BG[index] || 'border-zinc-800/50 bg-transparent'
                  }`}
                >
                  <span
                    className={`text-sm font-mono w-8 ${RANK_COLORS[index] || 'text-zinc-600'}`}
                  >
                    {RANK_LABELS[index] || `#${index + 1}`}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-sm">
                      {score.user_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-200 text-sm">{score.user_name}</p>
                    <p className="text-xs text-zinc-600">
                      {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-zinc-100">
                      {score.value}
                      <span className="text-xs text-zinc-500 ml-1">{category.unit}</span>
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
            </div>
          )}

          {category.external_url && (
            <div className="pt-4 border-t border-zinc-800">
              {category.external_url.startsWith('/') ? (
                <Link
                  href={category.external_url}
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  View Map <Globe className="h-4 w-4" />
                </Link>
              ) : (
                <a
                  href={category.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  Take Test <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LogScoreModal({
  categories,
  open,
  onOpenChange,
}: {
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [value, setValue] = useState<string>('')
  const [proofUrl, setProofUrl] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter out API-synced and travel categories
  const manualCategories = categories.filter(
    c => !c.api_source && !c.slug.includes('countries') && !c.slug.includes('states')
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_slug: selectedCategory,
          value: parseFloat(value),
          proof_url: proofUrl || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to submit score')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit score')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Score
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Log a Score</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-zinc-300">
              Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {manualCategories.map(cat => (
                  <SelectItem
                    key={cat.id}
                    value={cat.slug}
                    className="text-zinc-100 focus:bg-zinc-700"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className="text-zinc-300">
              Score
            </Label>
            <Input
              id="value"
              type="number"
              step="any"
              placeholder="Enter your score"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof" className="text-zinc-300">
              Proof URL (optional)
            </Label>
            <Input
              id="proof"
              type="url"
              placeholder="https://..."
              value={proofUrl}
              onChange={e => setProofUrl(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={submitting || !selectedCategory || !value}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? 'Submitting...' : 'Submit Score'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function calculateOverallRankings(
  scoresByCategory: Record<string, Score[]>,
  travelScores: {
    countries: { email: string; name: string; count: number }[]
    states: { email: string; name: string; count: number }[]
  },
  categories: Category[]
) {
  const pointsByPlayer: Record<
    string,
    {
      name: string
      email: string
      points: number
    }
  > = {}

  // Initialize all family members
  const familyEmails = [
    { email: 'gbouslov@gmail.com', name: 'Gabe' },
    { email: 'dbouslov@gmail.com', name: 'David' },
    { email: 'jbouslov@gmail.com', name: 'Jonathan' },
    { email: 'bouslovd@gmail.com', name: 'Daniel' },
    { email: 'bouslovb@gmail.com', name: 'Dad' },
  ]

  familyEmails.forEach(({ email, name }) => {
    pointsByPlayer[email] = { name, email, points: 0 }
  })

  // Calculate points from database scores
  for (const scores of Object.values(scoresByCategory)) {
    scores.forEach((score, index) => {
      const email = score.user_email
      if (pointsByPlayer[email]) {
        pointsByPlayer[email].points += Math.max(4 - index, 0)
        if (score.user_name) {
          pointsByPlayer[email].name = score.user_name
        }
      }
    })
  }

  // Add points from travel (countries)
  travelScores.countries.forEach((entry, index) => {
    if (pointsByPlayer[entry.email]) {
      pointsByPlayer[entry.email].points += Math.max(4 - index, 0)
    }
  })

  // Add points from travel (states)
  travelScores.states.forEach((entry, index) => {
    if (pointsByPlayer[entry.email]) {
      pointsByPlayer[entry.email].points += Math.max(4 - index, 0)
    }
  })

  return Object.values(pointsByPlayer).sort((a, b) => b.points - a.points)
}
