import { supabase } from './supabaseClient'

export type NotificationType = 'follow' | 'like' | 'comment'

export interface AppNotification {
  id: string
  type: NotificationType
  createdAt: string
  read: boolean
  actorHandle: string
  actorDisplayName: string
  actorAvatarUrl?: string
  sessionId?: string
  sessionTopic?: string
}

interface NotificationRow {
  id: string
  type: NotificationType
  created_at: string
  read: boolean
  actor_handle: string
  actor_display_name: string
  actor_avatar_url: string | null
  session_id: string | null
  session_topic: string | null
}

function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    createdAt: row.created_at,
    read: row.read,
    actorHandle: row.actor_handle,
    actorDisplayName: row.actor_display_name,
    actorAvatarUrl: row.actor_avatar_url ?? undefined,
    sessionId: row.session_id ?? undefined,
    sessionTopic: row.session_topic ?? undefined,
  }
}

export async function loadNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase.rpc('get_notifications', { p_limit: 30 })
  if (error) throw error
  return ((data ?? []) as NotificationRow[]).map(rowToNotification)
}

export async function loadUnreadNotificationCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count')
  if (error) throw error
  return (data as number) ?? 0
}

export async function markNotificationsRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read')
  if (error) throw error
}
