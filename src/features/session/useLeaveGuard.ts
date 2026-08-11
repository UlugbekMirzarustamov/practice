import { useEffect, useRef } from 'react'

/**
 * While `active`, calls `onLeave` the moment the tab is hidden (switched away,
 * minimized, screen locked). Also warns on beforeunload so an accidental close
 * doesn't happen silently, but since nothing is persisted until a session
 * completes naturally, a real close/reload already discards the session on its own.
 */
export function useLeaveGuard(active: boolean, onLeave: () => void): void {
  const onLeaveRef = useRef(onLeave)
  onLeaveRef.current = onLeave

  useEffect(() => {
    if (!active) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onLeaveRef.current()
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [active])
}
