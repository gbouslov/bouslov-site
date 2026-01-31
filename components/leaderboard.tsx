'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ExternalLink, Trophy, Clock, TrendingUp, Crown, Keyboard, Target, Brain, Crosshair, Zap } from 'lucide-react'
import { CATEGORIES, RANK_LABELS, RANK_COLORS, RANK_BG } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  wpm: <Keyboard className="h-4 w-4" />,
  chess: <Crown className="h-4 w-4" />,
  reaction: <Zap className="h-4 w-4" />,
  memory: <Brain className="h-4 w-4" />,
  accuracy: <Target className="h-4 w-4" />,
  aim: <Crosshair className="h-4 w-4" />,
}

interface Score {
  id: string
  score: number
  created_at: string
  proof_url?: string
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  category?: {
    slug: string
    name: string
    unit: string
    score_type: string
  }
}

interface LeaderboardProps {
  initialScores?: Record<string, Score[]>
  recentActivity?: Score[]
}

export function Leaderboard({ initialScores = {}, recentActivity = [] }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState('wpm')
  
  const overallRankings = calculateOverallRankings(initialScores)

  return (
    <div className="space-y-8">
      {/* Overall Rankings */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Trophy className="h-5 w-5 text-amber-400" />
            Overall Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {overallRankings.map((player, index) => (
              <Link 
                key={player.email} 
                href={`/profile/${encodeURIComponent(player.email)}`}
                className="block group"
              >
                <div className={`relative p-4 rounded-lg border transition-all duration-200 group-hover:border-zinc-600 group-hover:bg-zinc-800/50 ${
                  index === 0 ? 'border-amber-400/30 bg-amber-400/5' :
                  index === 1 ? 'border-zinc-500/30 bg-zinc-500/5' :
                  index === 2 ? 'border-orange-600/30 bg-orange-600/5' : 
                  'border-zinc-800 bg-zinc-900/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-mono font-medium ${RANK_COLORS[index as keyof typeof RANK_COLORS] || 'text-zinc-500'}`}>
                      {RANK_LABELS[index]}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback className="bg-zinc-800 text-zinc-300">
                        {player.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-zinc-100 truncate">{player.name}</h3>
                      <p className="text-sm text-zinc-500 font-mono">{player.points} pts</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Leaderboards */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6 bg-zinc-800/50 p-1">
              {CATEGORIES.map(cat => (
                <TabsTrigger 
                  key={cat.slug} 
                  value={cat.slug} 
                  className="text-xs data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
                >
                  <span className="flex items-center gap-1.5">
                    {CATEGORY_ICONS[cat.slug]}
                    <span className="hidden sm:inline">{cat.name.split(' ')[0]}</span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(category => (
              <TabsContent key={category.slug} value={category.slug}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                      {CATEGORY_ICONS[category.slug]}
                      {category.name}
                    </h3>
                    <p className="text-sm text-zinc-500">{category.description}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
                  >
                    <a href={category.external_url} target="_blank" rel="noopener noreferrer">
                      Take Test <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {(initialScores[category.slug] || []).length === 0 ? (
                    <p className="text-zinc-500 text-center py-12 text-sm">
                      No scores yet
                    </p>
                  ) : (
                    (initialScores[category.slug] || []).map((score, index) => (
                      <div 
                        key={score.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-colors hover:bg-zinc-800/30 ${
                          RANK_BG[index as keyof typeof RANK_BG] || 'border-zinc-800/50 bg-transparent'
                        }`}
                      >
                        <span className={`text-sm font-mono w-8 ${RANK_COLORS[index as keyof typeof RANK_COLORS] || 'text-zinc-600'}`}>
                          {RANK_LABELS[index] || `#${index + 1}`}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={score.user?.avatar_url} />
                          <AvatarFallback className="bg-zinc-800 text-zinc-400 text-sm">
                            {score.user?.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-200 text-sm">{score.user?.name}</p>
                          <p className="text-xs text-zinc-600">
                            {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-zinc-100">
                            {score.score}
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
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

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
            <p className="text-zinc-500 text-center py-12 text-sm">
              No activity yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(score => (
                <div key={score.id} className="flex items-center gap-3 py-2 text-sm">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={score.user?.avatar_url} />
                    <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                      {score.user?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-zinc-200">{score.user?.name}</span>
                  <span className="text-zinc-600">·</span>
                  <Badge variant="secondary" className="font-mono bg-zinc-800 text-zinc-300 border-0">
                    {score.score} {score.category?.unit}
                  </Badge>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    {CATEGORY_ICONS[score.category?.slug || '']}
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

function calculateOverallRankings(scoresByCategory: Record<string, Score[]>) {
  const pointsByPlayer: Record<string, { 
    name: string
    email: string
    avatar: string
    points: number 
  }> = {}

  const allowedEmails = [
    { email: 'gbouslov@gmail.com', name: 'Gabe' },
    { email: 'dbouslov@gmail.com', name: 'Daniel' },
    { email: 'jbouslov@gmail.com', name: 'Jonathan' },
    { email: 'bouslovd@gmail.com', name: 'Daniel' },
  ]

  allowedEmails.forEach(({ email, name }) => {
    pointsByPlayer[email] = { name, email, avatar: '', points: 0 }
  })

  for (const scores of Object.values(scoresByCategory)) {
    scores.forEach((score, index) => {
      const email = score.user?.email
      if (email && pointsByPlayer[email]) {
        pointsByPlayer[email].points += Math.max(4 - index, 0)
        pointsByPlayer[email].avatar = score.user?.avatar_url || ''
        if (score.user?.name) {
          pointsByPlayer[email].name = score.user.name
        }
      }
    })
  }

  return Object.values(pointsByPlayer).sort((a, b) => b.points - a.points)
}
