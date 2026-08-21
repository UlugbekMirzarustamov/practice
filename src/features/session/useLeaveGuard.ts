import { useEffect, useRef, useState } from 'react'

interface UseLeaveGuardResult {
  /** Seconds left in the grace period, or null when the tab isn't hidden. */
  secondsRemaining: number | null
}

const GRACE_SECONDS = 10
const CRITICAL_SECONDS = 3

/**
 * While `active`, starts a 10-second grace-period countdown the moment the tab
 * is hidden (switched away, minimized, screen locked) instead of failing
 * immediately. Returning to the tab before it runs out cancels the countdown.
 * If time runs out, `onTimeout` fires once. The document title blinks a
 * countdown too, so the warning is visible even while another tab has focus.
 */
export function useLeaveGuard(active: boolean, onTimeout: () => void): UseLeaveGuardResult {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!active) return

    let intervalId: number | undefined
    let originalTitle: string | null = null
    let blinkOn = true

    const restoreTitle = () => {
      if (originalTitle !== null) {
        document.title = originalTitle
        originalTitle = null
      }
    }

    const stopCountdown = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
        intervalId = undefined
      }
      setSecondsRemaining(null)
      restoreTitle()
    }

    const startCountdown = () => {
      if (intervalId !== undefined) return
      originalTitle = document.title
      const hiddenAt = Date.now()

      intervalId = window.setInterval(() => {
        const elapsed = (Date.now() - hiddenAt) / 1000
        const remaining = Math.max(0, GRACE_SECONDS - elapsed)
        setSecondsRemaining(remaining)

        if (remaining <= 0) {
          window.clearInterval(intervalId)
          intervalId = undefined
          restoreTitle()
          onTimeoutRef.current()
          return
        }

        blinkOn = !blinkOn
        const secondsInt = Math.ceil(remaining)
        if (remaining <= CRITICAL_SECONDS) {
          document.title = blinkOn ? `\u{1F534} COME BACK: ${secondsInt}s` : `⚪ COME BACK: ${secondsInt}s`
        } else {
          document.title = `\u{1F7E0} ${secondsInt}s left...`
        }
      }, 400)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) startCountdown()
      else stopCountdown()
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
      stopCountdown()
    }
  }, [active])

  return { secondsRemaining }
}
