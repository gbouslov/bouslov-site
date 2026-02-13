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
export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string
  unit: string
  higher_is_better: boolean
  api_source: string | null
  external_url: string | null
  created_at: string
}

export interface Score {
  id: string
  user_email: string
  user_name: string
  category_id: string
  value: number
  proof_url: string | null
  source: string
  created_at: string
  // Joined fields
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

// Family members
export const FAMILY = [
  { email: 'gbouslov@gmail.com', name: 'Gabe', chessUsername: 'gbouslov' },
  { email: 'dbouslov@gmail.com', name: 'David', chessUsername: 'dbouslov' },
  { email: 'jbouslov@gmail.com', name: 'Jonathan', chessUsername: 'jbouslov' },
  { email: 'bouslovd@gmail.com', name: 'Daniel', chessUsername: 'bouslovd' },
  { email: 'bouslovb@gmail.com', name: 'Dad', chessUsername: 'bouslovb' },
  { email: 'lbouslov@gmail.com', name: 'Mom', chessUsername: '' },
]

// Helper functions
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getScoresByCategory(categoryId: string): Promise<Score[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('*, category:categories(*)')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getBestScoresByCategory(categoryId: string, higherIsBetter: boolean): Promise<Score[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('*, category:categories(*)')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get best score per user
  const bestByUser: Record<string, Score> = {}
  for (const score of data || []) {
    if (!bestByUser[score.user_email]) {
      bestByUser[score.user_email] = score
    } else {
      const current = bestByUser[score.user_email].value
      if (higherIsBetter ? score.value > current : score.value < current) {
        bestByUser[score.user_email] = score
      }
    }
  }

  // Sort by value
  return Object.values(bestByUser).sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  )
}

export async function getAllBestScores(): Promise<Record<string, Score[]>> {
  const categories = await getCategories()
  const result: Record<string, Score[]> = {}

  for (const category of categories) {
    result[category.slug] = await getBestScoresByCategory(category.id, category.higher_is_better)
  }

  return result
}

export async function getScoreHistory(userEmail: string, categorySlug: string): Promise<Score[]> {
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return []

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_email', userEmail)
    .eq('category_id', category.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function submitScore(
  userEmail: string,
  userName: string,
  categorySlug: string,
  value: number,
  proofUrl?: string,
  source: string = 'manual'
): Promise<Score> {
  const category = await getCategoryBySlug(categorySlug)
  if (!category) throw new Error(`Category not found: ${categorySlug}`)

  const { data, error } = await supabase
    .from('scores')
    .insert({
      user_email: userEmail,
      user_name: userName,
      category_id: category.id,
      value,
      proof_url: proofUrl || null,
      source,
    })
    .select('*, category:categories(*)')
    .single()

  if (error) throw error
  return data
}

export async function getRecentScores(limit = 10): Promise<Score[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
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

// Poll types
export interface Poll {
  id: string
  user_email: string
  user_name: string
  question: string
  options: string[]
  is_closed: boolean
  created_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_email: string
  user_name: string
  option_index: number
  created_at: string
}

// Wishlist types
export type WishlistOccasion = 'birthday' | 'holiday' | 'general'

export interface WishlistItem {
  id: string
  user_email: string
  user_name: string
  title: string
  link: string | null
  price: string | null
  notes: string | null
  priority: number
  occasion: WishlistOccasion
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
  updated_at: string
}

// Recommendation types
export type RecommendationCategory =
  | 'restaurant' | 'show' | 'movie' | 'music'
  | 'book' | 'game' | 'podcast' | 'other'

export interface Recommendation {
  id: string
  user_email: string
  user_name: string
  title: string
  category: RecommendationCategory
  rating: number
  notes: string | null
  link: string | null
  created_at: string
  updated_at: string
}

export interface RecommendationComment {
  id: string
  recommendation_id: string
  user_email: string
  user_name: string
  content: string
  rating: number | null
  created_at: string
}

// Poll functions
export async function getAllPolls(): Promise<Poll[]> {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPollVotes(pollId: string): Promise<PollVote[]> {
  const { data, error } = await supabase
    .from('poll_votes')
    .select('*')
    .eq('poll_id', pollId)

  if (error) throw error
  return data || []
}

export async function getAllPollVotes(): Promise<PollVote[]> {
  const { data, error } = await supabase
    .from('poll_votes')
    .select('*')

  if (error) throw error
  return data || []
}

export async function createPoll(poll: {
  user_email: string
  user_name: string
  question: string
  options: string[]
}): Promise<Poll> {
  const { data, error } = await supabase
    .from('polls')
    .insert(poll)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function closePoll(id: string, userEmail: string): Promise<Poll> {
  const { data, error } = await supabase
    .from('polls')
    .update({ is_closed: true })
    .eq('id', id)
    .eq('user_email', userEmail)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePoll(id: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail)

  if (error) throw error
}

export async function castVote(vote: {
  poll_id: string
  user_email: string
  user_name: string
  option_index: number
}): Promise<PollVote> {
  const { data, error } = await supabase
    .from('poll_votes')
    .insert(vote)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeVote(pollId: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('poll_votes')
    .delete()
    .eq('poll_id', pollId)
    .eq('user_email', userEmail)

  if (error) throw error
}

// Wishlist functions
export async function getAllWishlistItems(): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createWishlistItem(item: {
  user_email: string
  user_name: string
  title: string
  link?: string
  price?: string
  notes?: string
  priority?: number
  occasion?: WishlistOccasion
}): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      user_email: item.user_email,
      user_name: item.user_name,
      title: item.title,
      link: item.link || null,
      price: item.price || null,
      notes: item.notes || null,
      priority: item.priority || 2,
      occasion: item.occasion || 'general',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWishlistItem(
  id: string,
  userEmail: string,
  updates: Partial<Pick<WishlistItem, 'title' | 'link' | 'price' | 'notes' | 'priority' | 'occasion'>>
): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_email', userEmail)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWishlistItem(id: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail)

  if (error) throw error
}

export async function claimWishlistItem(id: string, claimerEmail: string): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .update({ claimed_by: claimerEmail, claimed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unclaimWishlistItem(id: string, claimerEmail: string): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .update({ claimed_by: null, claimed_at: null })
    .eq('id', id)
    .eq('claimed_by', claimerEmail)
    .select()
    .single()

  if (error) throw error
  return data
}

// Recommendation functions
export async function getAllRecommendations(): Promise<Recommendation[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getRecommendationById(id: string): Promise<Recommendation | null> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createRecommendation(rec: {
  user_email: string
  user_name: string
  title: string
  category: RecommendationCategory
  rating: number
  notes?: string
  link?: string
}): Promise<Recommendation> {
  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      user_email: rec.user_email,
      user_name: rec.user_name,
      title: rec.title,
      category: rec.category,
      rating: rec.rating,
      notes: rec.notes || null,
      link: rec.link || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRecommendation(
  id: string,
  userEmail: string,
  updates: Partial<Pick<Recommendation, 'title' | 'category' | 'rating' | 'notes' | 'link'>>
): Promise<Recommendation> {
  const { data, error } = await supabase
    .from('recommendations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_email', userEmail)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRecommendation(id: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('recommendations')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail)

  if (error) throw error
}

export async function getRecommendationComments(recId: string): Promise<RecommendationComment[]> {
  const { data, error } = await supabase
    .from('recommendation_comments')
    .select('*')
    .eq('recommendation_id', recId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createRecommendationComment(comment: {
  recommendation_id: string
  user_email: string
  user_name: string
  content: string
  rating?: number
}): Promise<RecommendationComment> {
  const { data, error } = await supabase
    .from('recommendation_comments')
    .insert({
      recommendation_id: comment.recommendation_id,
      user_email: comment.user_email,
      user_name: comment.user_name,
      content: comment.content,
      rating: comment.rating || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRecommendationComment(id: string, userEmail: string): Promise<void> {
  const { error } = await supabase
    .from('recommendation_comments')
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
