import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Github, Crown, Globe, Keyboard, Brain, BookOpen, Gamepad2, Code } from 'lucide-react'

export default async function QuicklinksPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const devLinks = [
    {
      name: 'GitHub Repo',
      url: 'https://github.com/gbouslov/bouslov-site',
      description: 'Source code for this site',
      icon: Github,
    },
    {
      name: 'Chessvia',
      url: 'https://chessvia.ai',
      description: 'Chess coaching platform',
      icon: Crown,
    },
  ]

  const gameLinks = [
    {
      name: 'GeoGuessr',
      url: 'https://www.geoguessr.com',
      description: 'Explore the world through Street View',
      icon: Globe,
    },
    {
      name: 'Chess.com Bughouse',
      url: 'https://www.chess.com/play/online/doubles-bughouse',
      description: 'Play doubles bughouse together',
      icon: Crown,
    },
    {
      name: 'MonkeyType',
      url: 'https://monkeytype.com',
      description: 'Typing speed test',
      icon: Keyboard,
    },
    {
      name: 'HumanBenchmark',
      url: 'https://humanbenchmark.com',
      description: 'Reaction time, memory, and more',
      icon: Brain,
    },
    {
      name: 'The Wiki Game',
      url: 'https://www.thewikigame.com',
      description: 'Navigate Wikipedia from start to finish',
      icon: BookOpen,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          Quicklinks
        </h1>
        <p className="text-zinc-400">
          Resources and games for the family
        </p>
      </div>

      {/* Dev / Resources */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Code className="h-5 w-5 text-blue-400" />
            Dev / Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {devLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                    <Icon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-100 flex items-center gap-2">
                      {link.name}
                      <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-zinc-400" />
                    </p>
                    <p className="text-sm text-zinc-500 truncate">{link.description}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Games */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Gamepad2 className="h-5 w-5 text-green-400" />
            Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {gameLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                    <Icon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-100 flex items-center gap-2">
                      {link.name}
                      <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-zinc-400" />
                    </p>
                    <p className="text-sm text-zinc-500 truncate">{link.description}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
