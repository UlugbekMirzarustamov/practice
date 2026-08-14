import { useEffect, useRef, useState } from 'react'

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | undefined {
  if (typeof window === 'undefined') return undefined
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor())
}

interface UseSpeechRecognitionResult {
  transcript: string
  listening: boolean
  /** True once the browser has delivered at least one live recognition result. */
  hasRecognized: boolean
}

/**
 * Runs continuous speech-to-text while `active` is true. Chrome stops
 * recognition after a silence gap, so onend restarts it as long as the
 * session is still active; the caller never sees that hiccup.
 */
export function useSpeechRecognition(active: boolean): UseSpeechRecognitionResult {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [hasRecognized, setHasRecognized] = useState(false)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    if (!active) return
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    setHasRecognized(false)
    let stopped = false
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(finalTranscriptRef.current + interim)
      setHasRecognized(true)
    }

    recognition.onerror = () => {
      // no-speech / network hiccups are recovered by the onend restart below
    }

    recognition.onend = () => {
      setListening(false)
      if (!stopped) {
        try {
          recognition.start()
          setListening(true)
        } catch {
          // already starting; ignore
        }
      }
    }

    recognition.start()
    setListening(true)

    return () => {
      stopped = true
      recognition.onend = null
      recognition.stop()
      setListening(false)
    }
  }, [active])

  return { transcript, listening, hasRecognized }
}
