import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Only these emails can log in
export const ALLOWED_EMAILS = [
  'gbouslov@gmail.com',
  'dbouslov@gmail.com',
  'jbouslov@gmail.com',
  'bouslovd@gmail.com',
  'bouslovb@gmail.com',
  'lbouslov@gmail.com',
]

// Email to display name mapping
export const EMAIL_TO_NAME: Record<string, string> = {
  'gbouslov@gmail.com': 'Gabe',
  'dbouslov@gmail.com': 'David',
  'jbouslov@gmail.com': 'Jonathan',
  'bouslovd@gmail.com': 'Daniel',
  'bouslovb@gmail.com': 'Dad',
  'lbouslov@gmail.com': 'Mom',
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow specific emails
      if (!user.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        return false
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Add user ID to session
        (session.user as any).id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
