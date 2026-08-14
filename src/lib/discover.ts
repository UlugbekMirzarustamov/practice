import { supabase } from './supabaseClient'
import type { Mode } from '../types/session'
import type { IeltsPart } from '../data/ielts'

export interface DiscoverEntry {
  id: string
  mode: Mode
  topic: string
  excerpt: string
  durationMinutes: number
  ieltsPart?: IeltsPart
  createdAt: string
  verifiedUnaided: boolean
  authorHandle: string
  authorDisplayName: string
  authorAvatarUrl?: string
  likeCount: number
  savedByMe: boolean
}

interface DiscoverRow {
  id: string
  mode: Mode
  topic: string
  excerpt: string
  duration_minutes: number
  ielts_part: IeltsPart | null
  created_at: string
  verified_unaided: boolean
  author_handle: string
  author_display_name: string
  author_avatar_url: string | null
  like_count: number
  saved_by_me: boolean
}

function rowToEntry(row: DiscoverRow): DiscoverEntry {
  return {
    id: row.id,
    mode: row.mode,
    topic: row.topic,
    excerpt: row.excerpt,
    durationMinutes: row.duration_minutes,
    ieltsPart: row.ielts_part ?? undefined,
    createdAt: row.created_at,
    verifiedUnaided: row.verified_unaided,
    authorHandle: row.author_handle,
    authorDisplayName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url ?? undefined,
    likeCount: row.like_count,
    savedByMe: row.saved_by_me,
  }
}

export const DISCOVER_PAGE_SIZE = 20

/** Published sessions across all users (or one author via `authorHandle`), newest first. */
export async function loadDiscoverFeed(opts: { before?: string; authorHandle?: string } = {}): Promise<DiscoverEntry[]> {
  const { data, error } = await supabase.rpc('get_discover_feed', {
    p_limit: DISCOVER_PAGE_SIZE,
    p_before: opts.before ?? null,
    p_author_handle: opts.authorHandle ?? null,
  })
  if (error) throw error
  return ((data ?? []) as DiscoverRow[]).map(rowToEntry)
}

export interface UserSearchResult {
  userId: string
  handle: string
  displayName: string
  avatarUrl?: string
  level: number
}

interface UserSearchRow {
  user_id: string
  handle: string
  display_name: string
  avatar_url: string | null
  level: number
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const { data, error } = await supabase.rpc('search_users', { p_query: trimmed })
  if (error) throw error
  return ((data ?? []) as UserSearchRow[]).map((row) => ({
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    level: row.level,
  }))
}

export interface PublicProfile {
  userId: string
  handle: string
  displayName: string
  bio: string
  avatarUrl?: string
  memberSince: string
  totalXp: number
  level: number
  streak: number
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

interface PublicProfileRow {
  user_id: string
  handle: string
  display_name: string
  bio: string
  avatar_url: string | null
  member_since: string
  total_xp: number
  level: number
  streak: number
  follower_count: number
  following_count: number
  is_following: boolean
}

/** Null when the handle doesn't exist (or belongs to a suspended account). */
export async function loadPublicProfile(handle: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc('get_public_profile', { p_handle: handle })
  if (error) throw error
  const row = ((data ?? []) as PublicProfileRow[])[0]
  if (!row) return null
  return {
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url ?? undefined,
    memberSince: row.member_since,
    totalXp: row.total_xp,
    level: row.level,
    streak: row.streak,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    isFollowing: row.is_following,
  }
}

export async function followUser(targetUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
  if (error) throw error
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId)
  if (error) throw error
}

export interface SavedEntry extends DiscoverEntry {
  savedAt: string
}

interface SavedRow extends DiscoverRow {
  saved_at: string
}

/** The current user's bookmarked sessions, most recently saved first. */
export async function loadSavedSessions(): Promise<SavedEntry[]> {
  const { data, error } = await supabase.rpc('get_saved_sessions', { p_limit: 50 })
  if (error) throw error
  return ((data ?? []) as SavedRow[]).map((row) => ({ ...rowToEntry(row), savedAt: row.saved_at }))
}

export interface TrendingTopic {
  topic: string
  attempts: number
}

interface TrendingTopicRow {
  topic: string
  attempts: number
}

/** Topics with the most attempts across all users in the last 7 days, top few only. */
export async function loadTrendingTopics(limit = 8): Promise<TrendingTopic[]> {
  const { data, error } = await supabase.rpc('get_trending_topics', { p_limit: limit })
  if (error) throw error
  return ((data ?? []) as TrendingTopicRow[]).map((row) => ({ topic: row.topic, attempts: Number(row.attempts) }))
}
