import { useEffect } from 'react'

// A short reference for people who've never done goal visualization before —
// why it's worth doing, how the app's four tabs fit together, and a few
// pointers for a first session. Opened from the header, and shown once
// automatically on first use (see App.tsx / store.guideSeen).
export function Guide({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 bg-dusk/40 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain bg-paper border border-ink/15 rounded-xl shadow-lg p-6 sm:p-8"
      >
        <div className="flex justify-between items-start mb-5">
          <p className="text-xs font-medium text-ink-faint">Guide</p>
          <button onClick={onClose} className="text-xs font-medium text-ink-faint hover:text-ink">
            Close
          </button>
        </div>

        <h2 id="guide-heading" className="font-display text-2xl italic mb-5">
          New to visualization?
        </h2>

        <section className="mb-6">
          <h3 className="text-sm font-medium text-patina mb-2">Why this works</h3>
          <p className="text-sm text-ink-soft leading-relaxed">
            Mentally rehearsing a goal — not just the outcome, but who you are once it's true — primes you to notice
            opportunities and act like that person sooner. It's a practice, not a trick, which is why it rewards
            showing up regularly more than any single long session.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-medium text-patina mb-2">How the app works</h3>
          <ul className="space-y-3 text-sm text-ink-soft leading-relaxed">
            <li>
              <strong className="text-ink">Map</strong> — add goals and write who you are once each one is true.
              Connect goals that depend on each other.
            </li>
            <li>
              <strong className="text-ink">Visualize</strong> — a short guided session: a quick mood check-in, then
              prompts timed to a breathing ring and a closing bell.
            </li>
            <li>
              <strong className="text-ink">Schedule</strong> — put a future session on your actual calendar,
              exported as a file your calendar app understands.
            </li>
            <li>
              <strong className="text-ink">Journal</strong> — whatever came up during a session, saved so you can
              look back on it.
            </li>
          </ul>
        </section>

        <section className="mb-2">
          <h3 className="text-sm font-medium text-patina mb-2">For your first session</h3>
          <ul className="space-y-2 text-sm text-ink-soft leading-relaxed list-disc pl-4">
            <li>
              You don't need to "see" vivid images — try I just know things or breath &amp; body if pictures don't
              come easily.
            </li>
            <li>Find two quiet minutes before you worry about doing it right.</li>
            <li>
              Starting with a goal that's small and close — not the biggest one on your map — makes it easier to
              feel real, and that's the part that matters most.
            </li>
            <li>When the screen dims, that's your cue to close your eyes — the bell will bring you back.</li>
            <li>You can talk instead of typing anywhere you see a Speak button.</li>
          </ul>
        </section>

        <button
          onClick={onClose}
          className="w-full bg-patina text-paper text-sm py-2.5 rounded-lg mt-6 hover:bg-patina-deep transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
