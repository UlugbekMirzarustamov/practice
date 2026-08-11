import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { supabase } from '../../lib/supabaseClient'

interface AdminRow {
  user_id: string
  handle: string
  display_name: string
  is_admin: boolean
  suspended: boolean
  member_since: string
  total_xp: number
  level: number
  streak: number
  session_count: number
  last_active: string | null
}

export function AdminPage() {
  const [rows, setRows] = useState<AdminRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const { data, error } = await supabase.rpc('get_admin_overview')
    if (error) setError(error.message)
    else setRows((data ?? []) as AdminRow[])
  }

  useEffect(() => {
    load()
  }, [])

  const toggleSuspend = async (row: AdminRow) => {
    const { error } = await supabase.from('profiles').update({ suspended: !row.suspended }).eq('id', row.user_id)
    if (error) setError(error.message)
    else load()
  }

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
      <div className="page-inner" style={{ maxWidth: 860 }}>
        <h1 className="setup-title">Admin</h1>
        <p className="lede">
          Every user and their stats, straight from the server-computed tables. Full account deletion happens in the
          Supabase Dashboard (Authentication → Users) since that requires the service role key, which never touches
          this app.
        </p>

        {error && <p className="auth-message auth-error">{error}</p>}

        {!rows ? (
          <p className="lede">Loading...</p>
        ) : (
          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <span>Handle</span>
              <span>Level</span>
              <span>XP</span>
              <span>Streak</span>
              <span>Sessions</span>
              <span>Last active</span>
              <span>Status</span>
              <span></span>
            </div>
            {rows.map((row) => (
              <div key={row.user_id} className="admin-row">
                <span>
                  {row.display_name} <span className="option-hint" style={{ margin: 0 }}>@{row.handle}</span>
                </span>
                <span className="tabular">{row.level}</span>
                <span className="tabular">{row.total_xp}</span>
                <span className="tabular">{row.streak}</span>
                <span className="tabular">{row.session_count}</span>
                <span className="tabular">{row.last_active ? new Date(row.last_active).toLocaleDateString() : 'Never'}</span>
                <span>
                  {row.is_admin && <span className="mode-badge">Admin</span>}
                  {row.suspended && <span className="mode-badge danger-badge">Suspended</span>}
                </span>
                <span>
                  {!row.is_admin && (
                    <button type="button" className="text-link give-up" onClick={() => toggleSuspend(row)}>
                      {row.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
