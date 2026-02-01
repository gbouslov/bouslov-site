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

export interface Travel {
  id: string
  user_email: string
  country_code: string
  country_name: string
  visited_at: string
  notes: string | null
}

export interface StateVisited {
  id: string
  user_email: string
  state_code: string
  state_name: string
  visited_at: string
}

export type PinType = 'bucket_list' | 'trip_planned' | 'been_there' | 'home_base'

export interface PinLink {
  title: string
  url: string
}

export interface PinImage {
  url: string
  caption?: string
}

export interface Pin {
  id: string
  user_email: string
  user_name: string
  lat: number
  lng: number
  location_name: string | null
  pin_type: PinType
  title: string
  description: string | null
  links: PinLink[]
  images: PinImage[]
  trip_date: string | null
  created_at: string
  updated_at: string
}

export interface PinComment {
  id: string
  pin_id: string
  user_email: string
  user_name: string
  content: string
  created_at: string
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

// Travel functions
export async function getAllTravels(): Promise<Travel[]> {
  const { data, error } = await supabase
    .from('travels')
    .select('*')
    .order('country_name')

  if (error) throw error
  return data || []
}

export async function getTravelsByUser(email: string): Promise<Travel[]> {
  const { data, error } = await supabase
    .from('travels')
    .select('*')
    .eq('user_email', email)
    .order('country_name')

  if (error) throw error
  return data || []
}

export async function addTravel(travel: {
  user_email: string
  country_code: string
  country_name: string
  notes?: string
}): Promise<Travel> {
  const { data, error } = await supabase
    .from('travels')
    .insert({
      user_email: travel.user_email,
      country_code: travel.country_code,
      country_name: travel.country_name,
      notes: travel.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeTravel(id: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('travels')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail)

  if (error) throw error
}

export async function getTravelCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('travels')
    .select('user_email')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const travel of data || []) {
    counts[travel.user_email] = (counts[travel.user_email] || 0) + 1
  }
  return counts
}

// States functions
export async function getAllStates(): Promise<StateVisited[]> {
  const { data, error } = await supabase
    .from('states_visited')
    .select('*')
    .order('state_name')

  if (error) throw error
  return data || []
}

export async function getStatesByUser(email: string): Promise<StateVisited[]> {
  const { data, error } = await supabase
    .from('states_visited')
    .select('*')
    .eq('user_email', email)
    .order('state_name')

  if (error) throw error
  return data || []
}

export async function addState(state: {
  user_email: string
  state_code: string
  state_name: string
}): Promise<StateVisited> {
  const { data, error } = await supabase
    .from('states_visited')
    .insert({
      user_email: state.user_email,
      state_code: state.state_code,
      state_name: state.state_name,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getStateCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('states_visited')
    .select('user_email')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const state of data || []) {
    counts[state.user_email] = (counts[state.user_email] || 0) + 1
  }
  return counts
}

// Pin functions
export async function getAllPins(): Promise<Pin[]> {
  const { data, error } = await supabase
    .from('pins')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPinById(id: string): Promise<Pin | null> {
  const { data, error } = await supabase
    .from('pins')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createPin(pin: {
  user_email: string
  user_name: string
  lat: number
  lng: number
  location_name?: string
  pin_type: PinType
  title: string
  description?: string
  links?: PinLink[]
  images?: PinImage[]
  trip_date?: string
}): Promise<Pin> {
  const { data, error } = await supabase
    .from('pins')
    .insert({
      user_email: pin.user_email,
      user_name: pin.user_name,
      lat: pin.lat,
      lng: pin.lng,
      location_name: pin.location_name || null,
      pin_type: pin.pin_type,
      title: pin.title,
      description: pin.description || null,
      links: pin.links || [],
      images: pin.images || [],
      trip_date: pin.trip_date || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePin(
  id: string,
  userEmail: string,
  updates: Partial<Omit<Pin, 'id' | 'user_email' | 'user_name' | 'created_at'>>
): Promise<Pin> {
  const { data, error } = await supabase
    .from('pins')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_email', userEmail)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePin(id: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('pins')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail)

  if (error) throw error
}

// Pin comments functions
export async function getCommentsByPinId(pinId: string): Promise<PinComment[]> {
  const { data, error } = await supabase
    .from('pin_comments')
    .select('*')
    .eq('pin_id', pinId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createComment(comment: {
  pin_id: string
  user_email: string
  user_name: string
  content: string
}): Promise<PinComment> {
  const { data, error } = await supabase
    .from('pin_comments')
    .insert(comment)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(id: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('pin_comments')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail)

  if (error) throw error
}

// Image upload to Supabase storage
export async function uploadPinImage(
  file: File,
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  
  const { error } = await supabase.storage
    .from('pin-images')
    .upload(fileName, file)

  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('pin-images')
    .getPublicUrl(fileName)
  
  return publicUrl
}
