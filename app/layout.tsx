import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bouslov Bros',
  description: 'Family competition leaderboard',
  openGraph: {
    title: 'Bouslov Bros',
    description: 'Family competition leaderboard',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#09090b] min-h-screen`}>
        <Providers>
          <div className="min-h-screen">
            <Nav />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
