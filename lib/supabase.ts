import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a mock client for build time when env vars aren't available
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build
    console.warn('Supabase credentials not found. Using mock client.')
    return {
      from: () => ({
        select: () => ({ data: [], error: null, order: () => ({ data: [], error: null, limit: () => ({ data: [], error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        upsert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        eq: () => ({ single: () => ({ data: null, error: null }) }),
      }),
    } as unknown as SupabaseClient
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

// Types for our database
export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  slug: string
  name: string
  external_url: string
  score_type: 'higher_better' | 'lower_better'
  unit: string
  icon: string
}

export interface Score {
  id: string
  user_id: string
  category_id: string
  score: number
  proof_url: string | null
  created_at: string
  // Joined fields
  user?: User
  category?: Category
}

// Helper functions
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data || []
}

export async function getLeaderboard(categorySlug?: string) {
  let query = supabase
    .from('scores')
    .select(`
      *,
      user:users(*),
      category:categories(*)
    `)
    .order('created_at', { ascending: false })

  if (categorySlug) {
    query = query.eq('category.slug', categorySlug)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getUserScores(userId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function submitScore(
  userId: string,
  categoryId: string,
  score: number,
  proofUrl?: string
) {
  const { data, error } = await supabase
    .from('scores')
    .insert({
      user_id: userId,
      category_id: categoryId,
      score,
      proof_url: proofUrl || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTopScoresByCategory() {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      user:users(*),
      category:categories(*)
    `)

  if (error) throw error
  
  // Group by category and find best score per user per category
  const grouped: Record<string, Score[]> = {}
  
  for (const score of data || []) {
    const catSlug = score.category?.slug
    if (!catSlug) continue
    
    if (!grouped[catSlug]) {
      grouped[catSlug] = []
    }
    grouped[catSlug].push(score)
  }

  // For each category, get best score per user
  const result: Record<string, Score[]> = {}
  
  for (const [slug, scores] of Object.entries(grouped)) {
    const isHigherBetter = scores[0]?.category?.score_type === 'higher_better'
    const bestByUser: Record<string, Score> = {}
    
    for (const score of scores) {
      const userId = score.user_id
      if (!bestByUser[userId]) {
        bestByUser[userId] = score
      } else {
        const current = bestByUser[userId].score
        if (isHigherBetter ? score.score > current : score.score < current) {
          bestByUser[userId] = score
        }
      }
    }
    
    result[slug] = Object.values(bestByUser).sort((a, b) => 
      isHigherBetter ? b.score - a.score : a.score - b.score
    )
  }

  return result
}

export async function getRecentActivity(limit = 10) {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      user:users(*),
      category:categories(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertUser(user: Partial<User> & { email: string }) {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'email' })
    .select()
    .single()

  if (error) throw error
  return data
}
