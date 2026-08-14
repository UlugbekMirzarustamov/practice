import { useEffect, useRef } from 'react'

interface UseSpeakingTimingResult {
  getSilenceSeconds: () => number
}

/**
 * Tracks cumulative silence during a speaking session: polls every 500ms and,
 * whenever the transcript hasn't changed for more than 1.5s, counts that
 * tick's elapsed time as silence. Feeds the post-session feedback report's
 * speaking-time-vs-silence-time breakdown and its WPM figure.
 */
export function useSpeakingTiming(active: boolean, transcript: string): UseSpeakingTimingResult {
  const lastChangeRef = useRef(Date.now())
  const totalSilenceRef = useRef(0)
  const lastTickRef = useRef(Date.now())
  const transcriptRef = useRef(transcript)

  useEffect(() => {
    if (transcript !== transcriptRef.current) {
      transcriptRef.current = transcript
      lastChangeRef.current = Date.now()
    }
  }, [transcript])

  useEffect(() => {
    if (!active) return
    const now = Date.now()
    lastTickRef.current = now
    lastChangeRef.current = now
    totalSilenceRef.current = 0

    const interval = setInterval(() => {
      const tickNow = Date.now()
      const dt = (tickNow - lastTickRef.current) / 1000
      lastTickRef.current = tickNow
      const idleFor = (tickNow - lastChangeRef.current) / 1000
      if (idleFor > 1.5) totalSilenceRef.current += dt
    }, 500)

    return () => clearInterval(interval)
  }, [active])

  return { getSilenceSeconds: () => totalSilenceRef.current }
}
