import { useEffect, useRef, useState } from 'react'
import { getSpeechRecognitionConstructor, type SpeechRecognitionLike } from '../lib/speech'

// Talk through a goal instead of typing it. Runs entirely through the
// browser's own on-device/OS speech recognition — nothing is uploaded,
// which keeps it consistent with the rest of this local-first app.
export function VoiceInputButton({
  onTranscript,
  label = 'Speak',
}: {
  onTranscript: (text: string) => void
  label?: string
}) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const Constructor = getSpeechRecognitionConstructor()

  useEffect(() => {
    if (!Constructor) return
    const recognition = new Constructor()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'
    recognition.onresult = (event) => {
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript
      }
      if (finalText.trim()) onTranscriptRef.current(finalText.trim())
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = (event) => {
      setListening(false)
      if (event.error !== 'no-speech' && event.error !== 'aborted') setError(true)
    }
    recognitionRef.current = recognition
    return () => recognition.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No browser support (e.g. Firefox desktop) — fail quietly rather than
  // showing a button that can't work.
  if (!Constructor) return null

  function toggle() {
    if (!recognitionRef.current) return
    setError(false)
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch {
        // Already running — ignore.
      }
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        className={`text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
          listening ? 'text-ember' : 'text-ink-faint hover:text-ink-soft'
        }`}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${listening ? 'bg-ember animate-pulse' : 'bg-ink-faint'}`}
          aria-hidden
        />
        {listening ? 'Listening… tap to stop' : label}
      </button>
      {error && (
        <span role="status" aria-live="polite" className="text-xs text-ember">
          Mic unavailable
        </span>
      )}
    </span>
  )
}
