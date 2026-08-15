import { supabase } from './supabaseClient'

export interface Group {
  id: string
  name: string
  description: string
  inviteCode: string
  memberCount: number
  createdAt: string
}

interface MyGroupRow {
  group_id: string
  name: string
  description: string
  invite_code: string
  member_count: number
  created_at: string
}

export async function loadMyGroups(): Promise<Group[]> {
  const { data, error } = await supabase.rpc('get_my_groups')
  if (error) throw error
  return ((data ?? []) as MyGroupRow[]).map((row) => ({
    id: row.group_id,
    name: row.name,
    description: row.description,
    inviteCode: row.invite_code,
    memberCount: row.member_count,
    createdAt: row.created_at,
  }))
}

export async function createGroup(name: string, description: string): Promise<Group> {
  const { data, error } = await supabase.rpc('create_group', { p_name: name, p_description: description })
  if (error) throw error
  const row = (data as { id: string; name: string; description: string; invite_code: string }[])[0]
  return { id: row.id, name: row.name, description: row.description, inviteCode: row.invite_code, memberCount: 1, createdAt: new Date().toISOString() }
}

export interface JoinedGroup {
  id: string
  name: string
  description: string
}

export async function joinGroupByCode(code: string): Promise<JoinedGroup> {
  const { data, error } = await supabase.rpc('join_group_by_code', { p_invite_code: code })
  if (error) throw error
  const row = (data as { id: string; name: string; description: string }[])[0]
  return { id: row.id, name: row.name, description: row.description }
}

export interface GroupLeaderboardEntry {
  handle: string
  displayName: string
  avatarUrl?: string
  totalXp: number
  sessionCount: number
  streak: number
  isMe: boolean
}

interface GroupLeaderboardRow {
  handle: string
  display_name: string
  avatar_url: string | null
  total_xp: number
  session_count: number
  streak: number
  is_me: boolean
}

export async function loadGroupLeaderboard(groupId: string): Promise<GroupLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_group_leaderboard', { p_group_id: groupId })
  if (error) throw error
  return ((data ?? []) as GroupLeaderboardRow[]).map((row) => ({
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    totalXp: row.total_xp,
    sessionCount: row.session_count,
    streak: row.streak,
    isMe: row.is_me,
  }))
}

/** Shareable join link — opening it while signed in auto-joins the group (handled in App.tsx boot). */
export function groupInviteUrl(code: string): string {
  return `${window.location.origin}/?join=${code}`
}
