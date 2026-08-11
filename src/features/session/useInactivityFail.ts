import { useEffect, useRef, useState } from 'react'

interface UseInactivityFailResult {
  silentSeconds: number
}

/**
 * "Dangerous mode": fails the session if `activitySignal` (the live content
 * or transcript string) hasn't changed for `thresholdSeconds`. Polls so the
 * UI can react to rising silence (pause cue, warning pulse) before the
 * actual cutoff.
 */
export function useInactivityFail(
  active: boolean,
  thresholdSeconds: number,
  activitySignal: string,
  onTimeout: () => void,
): UseInactivityFailResult {
  const [silentSeconds, setSilentSeconds] = useState(0)
  const lastActivityRef = useRef(Date.now())
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    lastActivityRef.current = Date.now()
  }, [activitySignal])

  useEffect(() => {
    if (!active) return
    lastActivityRef.current = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastActivityRef.current) / 1000
      setSilentSeconds(elapsed)
      if (elapsed >= thresholdSeconds) {
        onTimeoutRef.current()
      }
    }, 200)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, thresholdSeconds])

  return { silentSeconds }
}
