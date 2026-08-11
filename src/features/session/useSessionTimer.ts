import { useEffect, useRef, useState } from 'react'

interface UseSessionTimerResult {
  secondsLeft: number
  progress: number // 0 -> 1 as time elapses
  formatted: string
}

export function useSessionTimer(
  durationMinutes: number,
  onComplete: () => void,
  initialSecondsLeft?: number,
): UseSessionTimerResult {
  const totalSeconds = durationMinutes * 60
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft ?? totalSeconds)

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const startSeconds = initialSecondsLeft ?? totalSeconds
    const endAt = Date.now() + startSeconds * 1000

    const tick = () => {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onCompleteRef.current()
      }
    }

    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const progress = 1 - secondsLeft / totalSeconds

  return { secondsLeft, progress, formatted }
}
