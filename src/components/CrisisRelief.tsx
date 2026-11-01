import { useEffect, useMemo, useRef, useState } from 'react'
import { BreathRing } from './BreathRing'
import { playBell } from '../lib/bell'
import { createRng, pick } from '../lib/rng'

const DURATION_SEC = 100

// A fixed 5-4-3-2-1 grounding sequence. No setup, no choices — just relief.
// Each step has a couple of phrasing variants so repeat visits (this is the
// one screen people may return to under stress, sometimes often) don't read
// completely identically every time — picked once per mount, stable for the
// whole exercise.
const PROMPT_VARIANTS: string[][] = [
  ["You're safe right now. Let's slow down together.", "You're safe right now. Let's just slow down."],
  [
    'Breathe in for four… hold… out for six. A few more of those, at your own pace.',
    'In for four… a brief hold… out for six. A few more, whenever you\'re ready.',
  ],
  ['Notice 5 things you can see around you.', 'Notice 5 things you can see — anywhere your eyes land.'],
  [
    'Notice 4 things you can feel — your feet on the floor, the air on your skin.',
    'Notice 4 things you can feel — the floor under your feet, the air on your skin.',
  ],
  ['Notice 3 things you can hear, near or far.', 'Notice 3 things you can hear, close by or far off.'],
  [
    'Notice 2 things you can smell, or like the smell of, right now.',
    'Notice 2 things you can smell, or that you like the smell of.',
  ],
  [
    'Notice 1 thing you appreciate about yourself in this moment.',
    'Notice 1 thing you appreciate about yourself, right now.',
  ],
  ["Keep breathing slowly. You're doing fine.", "Keep breathing slowly — you're doing fine."],
]

export function CrisisRelief({ onExit }: { onExit: () => void }) {
  const [remaining, setRemaining] = useState(DURATION_SEC)
  const [promptIndex, setPromptIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const startedRef = useRef(false)

  const prompts = useMemo(() => {
    const rand = createRng(Date.now())
    return PROMPT_VARIANTS.map((variants) => pick(rand, variants))
  }, [])

  const promptInterval = Math.max(8, Math.floor(DURATION_SEC / prompts.length))

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      playBell()
    }
  }, [])

  useEffect(() => {
    if (finished) return
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick)
          playBell()
          setFinished(true)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [finished])

  useEffect(() => {
    const elapsed = DURATION_SEC - remaining
    setPromptIndex(Math.min(prompts.length - 1, Math.floor(elapsed / promptInterval)))
  }, [remaining, promptInterval, prompts.length])

  if (finished) {
    return (
      <div className="min-h-full bg-ember-tint/40">
        <div className="max-w-md mx-auto pt-20 px-6 text-center fade-in">
          <p className="font-display text-xl italic mb-2">That's it.</p>
          <p className="text-sm text-ink-soft mb-8">You can stay here a little longer, or go whenever you're ready.</p>
          <button onClick={onExit} className="text-xs font-medium text-ember hover:text-ink">
            Back
          </button>
        </div>
      </div>
    )
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="min-h-full bg-ember-tint/40">
      <div className="max-w-lg mx-auto pt-12 px-6 text-center fade-in">
        <BreathRing size={220} tone="ember">
          <p className="font-mono text-2xl tabular-nums text-ink-soft">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        </BreathRing>
        <p className="font-display text-xl leading-relaxed min-h-[8rem] mt-10">{prompts[promptIndex]}</p>
        <button
          onClick={onExit}
          className="mt-6 text-xs font-medium text-ink-faint hover:text-ink"
        >
          I'm done
        </button>
      </div>
    </div>
  )
}
