import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bouslov',
  description: 'Family competition leaderboard',
  openGraph: {
    title: 'Bouslov',
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
          {children}
        </Providers>
      </body>
    </html>
  )
}
