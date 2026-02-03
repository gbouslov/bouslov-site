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
import { RANK_LABELS, RANK_COLORS, RANK_BG, CATEGORY_GROUPS, CATEGORY_TO_GROUP, getCategoryGroup } from '@/lib/constants'
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
            data-testid="sync-chess-button"
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
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Trophy className="h-5 w-5 text-amber-400" />
              Overall Standings
            </CardTitle>
            <div className="h-0.5 w-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            Points = Sum of category placements (1st=4pts, 2nd=3pts, 3rd=2pts, 4th=1pt)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {overallRankings.map((player, index) => (
              <div
                key={player.email}
                className={`relative p-4 rounded-lg border transition-all duration-200 ${
                  index === 0
                    ? 'border-amber-400/40 bg-gradient-to-br from-amber-400/10 to-amber-600/5 hover:border-amber-400/60 hover:from-amber-400/15'
                    : index === 1
                    ? 'border-zinc-400/40 bg-gradient-to-br from-zinc-400/10 to-zinc-500/5 hover:border-zinc-400/60 hover:from-zinc-400/15'
                    : index === 2
                    ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-700/5 hover:border-orange-500/60 hover:from-orange-500/15'
                    : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/50'
                }`}
              >
                {/* Rank badge for top 3 */}
                {index < 3 && (
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-400 text-zinc-900'
                      : index === 1
                      ? 'bg-zinc-400 text-zinc-900'
                      : 'bg-orange-500 text-zinc-900'
                  }`}>
                    {index + 1}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Avatar className={`h-10 w-10 ring-2 ${
                    index === 0
                      ? 'ring-amber-400/50'
                      : index === 1
                      ? 'ring-zinc-400/50'
                      : index === 2
                      ? 'ring-orange-500/50'
                      : 'ring-zinc-700/50'
                  }`}>
                    <AvatarFallback className={`text-zinc-100 font-medium ${
                      index === 0
                        ? 'bg-amber-400/20'
                        : index === 1
                        ? 'bg-zinc-400/20'
                        : index === 2
                        ? 'bg-orange-500/20'
                        : 'bg-zinc-800'
                    }`}>
                      {player.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      index === 0
                        ? 'text-amber-100'
                        : index === 1
                        ? 'text-zinc-100'
                        : index === 2
                        ? 'text-orange-100'
                        : 'text-zinc-300'
                    }`}>{player.name}</h3>
                    <p className={`text-lg font-mono font-semibold ${
                      index === 0
                        ? 'text-amber-400'
                        : index === 1
                        ? 'text-zinc-300'
                        : index === 2
                        ? 'text-orange-400'
                        : 'text-zinc-500'
                    }`}>{player.points} <span className="text-xs font-normal opacity-70">pts</span></p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : index === 1
                        ? 'bg-gradient-to-r from-zinc-400 to-zinc-500'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-400 to-orange-600'
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
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Categories
            </CardTitle>
            <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Group categories by their group */}
          {(Object.keys(CATEGORY_GROUPS) as Array<keyof typeof CATEGORY_GROUPS>).map(groupKey => {
            const group = CATEGORY_GROUPS[groupKey]
            const groupCategories = categories.filter(c => CATEGORY_TO_GROUP[c.slug] === groupKey)

            if (groupCategories.length === 0) return null

            return (
              <div key={groupKey} className="space-y-3">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-1 rounded-full ${
                    groupKey === 'chess' ? 'bg-amber-400' :
                    groupKey === 'cognitive' ? 'bg-blue-400' :
                    groupKey === 'travel' ? 'bg-emerald-400' :
                    'bg-violet-400'
                  }`} />
                  <h3 className={`text-sm font-medium ${
                    groupKey === 'chess' ? 'text-amber-400' :
                    groupKey === 'cognitive' ? 'text-blue-400' :
                    groupKey === 'travel' ? 'text-emerald-400' :
                    'text-violet-400'
                  }`}>{group.name}</h3>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Group cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupCategories.map(category => {
                    const scores = scoresByCategory[category.slug] || []
                    const leader = scores[0]
                    const isInternal = category.external_url?.startsWith('/')
                    const catGroup = getCategoryGroup(category.slug)

                    const accentClasses = {
                      chess: {
                        border: leader ? 'border-l-amber-400' : '',
                        hover: 'hover:border-amber-500/40',
                        icon: 'bg-amber-500/10 text-amber-400',
                        score: 'text-amber-300',
                      },
                      cognitive: {
                        border: leader ? 'border-l-blue-400' : '',
                        hover: 'hover:border-blue-500/40',
                        icon: 'bg-blue-500/10 text-blue-400',
                        score: 'text-blue-300',
                      },
                      travel: {
                        border: leader ? 'border-l-emerald-400' : '',
                        hover: 'hover:border-emerald-500/40',
                        icon: 'bg-emerald-500/10 text-emerald-400',
                        score: 'text-emerald-300',
                      },
                      typing: {
                        border: leader ? 'border-l-violet-400' : '',
                        hover: 'hover:border-violet-500/40',
                        icon: 'bg-violet-500/10 text-violet-400',
                        score: 'text-violet-300',
                      },
                    }[groupKey]

                    return (
                      <div
                        key={category.id}
                        className={`group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                          leader
                            ? `border-zinc-800 border-l-2 ${accentClasses.border} bg-zinc-900/30 hover:bg-zinc-800/50 ${accentClasses.hover}`
                            : 'border-zinc-800 border-dashed bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-800/30 opacity-70'
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${accentClasses.icon}`}>
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
                            <Avatar className="h-6 w-6 ring-1 ring-zinc-700">
                              <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                                {leader.user_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-zinc-300">{leader.user_name}</span>
                            <span className={`ml-auto font-mono text-base font-semibold ${accentClasses.score}`}>
                              {leader.value}
                              <span className="text-zinc-500 ml-0.5 text-xs font-normal">{category.unit}</span>
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-600 italic">No scores yet</p>
                        )}

                        {category.external_url && (
                          <div className={`mt-3 pt-3 border-t ${leader ? 'border-zinc-800' : 'border-zinc-800/50'}`}>
                            {isInternal ? (
                              <Link
                                href={category.external_url}
                                className={`text-xs flex items-center gap-1 transition-colors ${
                                  groupKey === 'chess' ? 'text-amber-400 hover:text-amber-300' :
                                  groupKey === 'cognitive' ? 'text-blue-400 hover:text-blue-300' :
                                  groupKey === 'travel' ? 'text-emerald-400 hover:text-emerald-300' :
                                  'text-violet-400 hover:text-violet-300'
                                }`}
                                onClick={e => e.stopPropagation()}
                              >
                                View <Globe className="h-3 w-3" />
                              </Link>
                            ) : (
                              <a
                                href={category.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs flex items-center gap-1 transition-colors ${
                                  groupKey === 'chess' ? 'text-amber-400 hover:text-amber-300' :
                                  groupKey === 'cognitive' ? 'text-blue-400 hover:text-blue-300' :
                                  groupKey === 'travel' ? 'text-emerald-400 hover:text-emerald-300' :
                                  'text-violet-400 hover:text-violet-300'
                                }`}
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
              </div>
            )
          })}
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
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Clock className="h-5 w-5 text-zinc-400" />
              Recent Activity
            </CardTitle>
            <div className="h-0.5 w-16 bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map(score => {
                const groupKey = score.category?.slug ? CATEGORY_TO_GROUP[score.category.slug] : null
                const borderColor = groupKey === 'chess' ? 'border-l-amber-400/60' :
                                   groupKey === 'cognitive' ? 'border-l-blue-400/60' :
                                   groupKey === 'travel' ? 'border-l-emerald-400/60' :
                                   groupKey === 'typing' ? 'border-l-violet-400/60' :
                                   'border-l-zinc-600'
                const iconColor = groupKey === 'chess' ? 'text-amber-400' :
                                 groupKey === 'cognitive' ? 'text-blue-400' :
                                 groupKey === 'travel' ? 'text-emerald-400' :
                                 groupKey === 'typing' ? 'text-violet-400' :
                                 'text-zinc-400'

                return (
                  <div
                    key={score.id}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border-l-2 ${borderColor} hover:bg-zinc-800/30 transition-colors`}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                        {score.user_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-zinc-200 text-sm">{score.user_name}</span>
                    <span className="font-mono text-sm bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded font-semibold">
                      {score.value} <span className="text-zinc-500 font-normal">{score.category?.unit}</span>
                    </span>
                    <span className={`text-sm flex items-center gap-1.5 ${iconColor}`}>
                      {score.category && getIcon(score.category.icon)}
                      <span className="text-zinc-400">{score.category?.name}</span>
                    </span>
                    <span className="text-zinc-600 ml-auto text-xs">
                      {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                    </span>
                  </div>
                )
              })}
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

  const groupKey = CATEGORY_TO_GROUP[category.slug]
  const headerBorderClass = groupKey === 'chess' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                            groupKey === 'cognitive' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                            groupKey === 'travel' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                            groupKey === 'typing' ? 'bg-gradient-to-r from-violet-400 to-violet-600' :
                            'bg-gradient-to-r from-zinc-400 to-zinc-600'

  return (
    <Dialog open={!!category} onOpenChange={() => onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <div className={`p-2 rounded-lg ${
              groupKey === 'chess' ? 'bg-amber-500/10 text-amber-400' :
              groupKey === 'cognitive' ? 'bg-blue-500/10 text-blue-400' :
              groupKey === 'travel' ? 'bg-emerald-500/10 text-emerald-400' :
              groupKey === 'typing' ? 'bg-violet-500/10 text-violet-400' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {getIcon(category.icon)}
            </div>
            {category.name}
          </DialogTitle>
          <div className={`h-0.5 w-12 rounded-full mt-2 ${headerBorderClass}`} />
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">{category.description}</p>

          {scores.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-zinc-500 text-sm">No scores yet</p>
              <p className="text-zinc-600 text-xs mt-1">Be the first to compete!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    index === 0
                      ? groupKey === 'chess' ? 'border-amber-400/30 bg-amber-400/5' :
                        groupKey === 'cognitive' ? 'border-blue-400/30 bg-blue-400/5' :
                        groupKey === 'travel' ? 'border-emerald-400/30 bg-emerald-400/5' :
                        groupKey === 'typing' ? 'border-violet-400/30 bg-violet-400/5' :
                        'border-zinc-700 bg-zinc-800/30'
                      : RANK_BG[index] || 'border-zinc-800/50 bg-transparent'
                  }`}
                >
                  <span
                    className={`text-sm font-mono w-8 font-semibold ${
                      index === 0
                        ? groupKey === 'chess' ? 'text-amber-400' :
                          groupKey === 'cognitive' ? 'text-blue-400' :
                          groupKey === 'travel' ? 'text-emerald-400' :
                          groupKey === 'typing' ? 'text-violet-400' :
                          'text-zinc-300'
                        : RANK_COLORS[index] || 'text-zinc-600'
                    }`}
                  >
                    {RANK_LABELS[index] || `#${index + 1}`}
                  </span>
                  <Avatar className={`h-8 w-8 ${index === 0 ? 'ring-2' : ''} ${
                    index === 0
                      ? groupKey === 'chess' ? 'ring-amber-400/50' :
                        groupKey === 'cognitive' ? 'ring-blue-400/50' :
                        groupKey === 'travel' ? 'ring-emerald-400/50' :
                        groupKey === 'typing' ? 'ring-violet-400/50' :
                        'ring-zinc-600/50'
                      : ''
                  }`}>
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
                    <p className={`font-mono font-semibold ${
                      index === 0
                        ? groupKey === 'chess' ? 'text-amber-300' :
                          groupKey === 'cognitive' ? 'text-blue-300' :
                          groupKey === 'travel' ? 'text-emerald-300' :
                          groupKey === 'typing' ? 'text-violet-300' :
                          'text-zinc-100'
                        : 'text-zinc-100'
                    }`}>
                      {score.value}
                      <span className="text-xs text-zinc-500 ml-1 font-normal">{category.unit}</span>
                    </p>
                    {score.proof_url && (
                      <a
                        href={score.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs transition-colors ${
                          groupKey === 'chess' ? 'text-amber-400 hover:text-amber-300' :
                          groupKey === 'cognitive' ? 'text-blue-400 hover:text-blue-300' :
                          groupKey === 'travel' ? 'text-emerald-400 hover:text-emerald-300' :
                          groupKey === 'typing' ? 'text-violet-400 hover:text-violet-300' :
                          'text-zinc-400 hover:text-zinc-300'
                        }`}
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
                  className={`inline-flex items-center gap-2 text-sm transition-colors ${
                    groupKey === 'chess' ? 'text-amber-400 hover:text-amber-300' :
                    groupKey === 'cognitive' ? 'text-blue-400 hover:text-blue-300' :
                    groupKey === 'travel' ? 'text-emerald-400 hover:text-emerald-300' :
                    groupKey === 'typing' ? 'text-violet-400 hover:text-violet-300' :
                    'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  View Map <Globe className="h-4 w-4" />
                </Link>
              ) : (
                <a
                  href={category.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-sm transition-colors ${
                    groupKey === 'chess' ? 'text-amber-400 hover:text-amber-300' :
                    groupKey === 'cognitive' ? 'text-blue-400 hover:text-blue-300' :
                    groupKey === 'travel' ? 'text-emerald-400 hover:text-emerald-300' :
                    groupKey === 'typing' ? 'text-violet-400 hover:text-violet-300' :
                    'text-zinc-400 hover:text-zinc-300'
                  }`}
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

  // Get accent colors based on selected category
  const groupKey = selectedCategory ? CATEGORY_TO_GROUP[selectedCategory] : null
  const buttonClass = groupKey === 'chess' ? 'bg-amber-500 hover:bg-amber-600' :
                      groupKey === 'cognitive' ? 'bg-blue-500 hover:bg-blue-600' :
                      groupKey === 'travel' ? 'bg-emerald-500 hover:bg-emerald-600' :
                      groupKey === 'typing' ? 'bg-violet-500 hover:bg-violet-600' :
                      'bg-zinc-600 hover:bg-zinc-500'
  const accentBorder = groupKey === 'chess' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                       groupKey === 'cognitive' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                       groupKey === 'travel' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                       groupKey === 'typing' ? 'bg-gradient-to-r from-violet-400 to-violet-600' :
                       'bg-gradient-to-r from-zinc-400 to-zinc-600'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"
          data-testid="log-score-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Score
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-zinc-100">Log a Score</DialogTitle>
            <div className={`h-0.5 w-12 rounded-full transition-all duration-300 ${accentBorder}`} />
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-zinc-300">
              Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 transition-all ${
                groupKey === 'chess' ? 'focus:border-amber-500/50' :
                groupKey === 'cognitive' ? 'focus:border-blue-500/50' :
                groupKey === 'travel' ? 'focus:border-emerald-500/50' :
                groupKey === 'typing' ? 'focus:border-violet-500/50' :
                'focus:border-zinc-500'
              }`}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {manualCategories.map(cat => {
                  const catGroup = CATEGORY_TO_GROUP[cat.slug]
                  return (
                    <SelectItem
                      key={cat.id}
                      value={cat.slug}
                      className={`text-zinc-100 focus:bg-zinc-700 ${
                        catGroup === 'chess' ? 'focus:text-amber-400' :
                        catGroup === 'cognitive' ? 'focus:text-blue-400' :
                        catGroup === 'travel' ? 'focus:text-emerald-400' :
                        catGroup === 'typing' ? 'focus:text-violet-400' :
                        ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          catGroup === 'chess' ? 'bg-amber-400' :
                          catGroup === 'cognitive' ? 'bg-blue-400' :
                          catGroup === 'travel' ? 'bg-emerald-400' :
                          catGroup === 'typing' ? 'bg-violet-400' :
                          'bg-zinc-400'
                        }`} />
                        {cat.name}
                      </span>
                    </SelectItem>
                  )
                })}
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
              className={`bg-zinc-800 border-zinc-700 text-zinc-100 transition-all ${
                groupKey === 'chess' ? 'focus:border-amber-500/50' :
                groupKey === 'cognitive' ? 'focus:border-blue-500/50' :
                groupKey === 'travel' ? 'focus:border-emerald-500/50' :
                groupKey === 'typing' ? 'focus:border-violet-500/50' :
                ''
              }`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof" className="text-zinc-300">
              Proof URL <span className="text-zinc-500">(optional)</span>
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
            className={`w-full text-white transition-all ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
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
