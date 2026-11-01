import { useEffect, useMemo, useRef, useState } from 'react'
import { BreathRing } from './BreathRing'
import { playBell } from '../lib/bell'
import { generatePrompts, MOOD_OPTIONS } from '../lib/prompts'
import { computeStreak } from '../lib/streak'
import { useStore } from '../store'
import type { Mood, PromptStyle } from '../types'
import { VoiceInputButton } from './VoiceInputButton'

type Step = 'pick-goal' | 'mood' | 'running' | 'journal' | 'done'

const DURATIONS = [
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
]

const pillBase = 'text-sm px-3 py-1.5 rounded-full border transition-colors'
const pillActive = 'bg-patina text-paper border-patina'
const pillInactive = 'border-ink/15 text-ink-soft hover:border-ink/30'

export function Session({
  initialGoalId,
  onGoalConsumed,
}: {
  initialGoalId: string | null
  onGoalConsumed: () => void
}) {
  const goals = useStore((s) => s.goals)
  const sessions = useStore((s) => s.sessions)
  const addSession = useStore((s) => s.addSession)
  const completeSession = useStore((s) => s.completeSession)
  const addJournalEntry = useStore((s) => s.addJournalEntry)
  const lastSessionSettings = useStore((s) => s.lastSessionSettings)
  const setLastSessionSettings = useStore((s) => s.setLastSessionSettings)
  const profiles = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const activeProfileName = profiles.find((p) => p.id === activeProfileId)?.name ?? null

  const [step, setStep] = useState<Step>(initialGoalId ? 'mood' : 'pick-goal')
  const [goalId, setGoalId] = useState<string | null>(initialGoalId)
  const [mood, setMood] = useState<Mood>('neutral')
  const [style, setStyle] = useState<PromptStyle>(lastSessionSettings.promptStyle)
  const [duration, setDuration] = useState(lastSessionSettings.durationSec)
  const [bellAtStart, setBellAtStart] = useState(lastSessionSettings.bellAtStart)
  const [bellAtEnd, setBellAtEnd] = useState(lastSessionSettings.bellAtEnd)
  const [customBells, setCustomBells] = useState<number[]>(lastSessionSettings.customBells)
  const [bellMin, setBellMin] = useState('')
  const [bellSec, setBellSec] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [journalText, setJournalText] = useState('')

  const goal = goals.find((g) => g.id === goalId) ?? null

  // Seeded on sessionId so the prompt-variant picks stay stable for the
  // whole running session (no flicker on re-render) but vary session to
  // session instead of reading identically every day.
  const prompts = useMemo(
    () => (goal ? generatePrompts(goal, mood, style, duration, sessionId ?? `${goal.id}-${mood}-${style}`) : []),
    [goal, mood, style, duration, sessionId],
  )

  useEffect(() => {
    if (initialGoalId) {
      setGoalId(initialGoalId)
      setStep('mood')
      onGoalConsumed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGoalId])

  if (step === 'pick-goal') {
    return (
      <div className="max-w-md mx-auto pt-16 px-6 fade-in">
        <p className="text-xs font-medium text-ink-faint mb-2">Choose a goal</p>
        <h2 className="font-display text-2xl mb-6">
          {activeProfileName ? `${activeProfileName}, what are you visualizing today?` : 'What are you visualizing today?'}
        </h2>
        {goals.length === 0 ? (
          <p className="text-sm text-ink-faint">No goals yet. Head to the Map tab and add one first.</p>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id}>
                <button
                  onClick={() => {
                    setGoalId(g.id)
                    setStep('mood')
                  }}
                  className="w-full text-left border-b border-ink/10 py-3 hover:text-patina transition-colors"
                >
                  {g.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (!goal) return null

  if (step === 'mood') {
    return (
      <div className="max-w-md mx-auto pt-16 px-6 pb-16 fade-in">
        <p className="text-xs font-medium text-ink-faint mb-1">Goal</p>
        <h2 className="font-display text-2xl mb-1">{goal.title}</h2>
        <p className="text-sm text-ink-faint mb-6">Quick check-in before you begin.</p>

        <label className="block text-sm font-medium text-ink-soft mb-2">How are you feeling right now?</label>
        <div className="flex flex-wrap gap-2 mb-6">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`${pillBase} ${mood === m.value ? pillActive : pillInactive}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {(mood === 'anxious' || mood === 'tired') && style !== 'somatic' && (
          <p className="text-xs text-ink-faint mb-5 -mt-3">
            Feeling {mood}?{' '}
            <button
              onClick={() => setStyle('somatic')}
              className="text-patina hover:text-patina-deep underline underline-offset-2"
            >
              Try breath &amp; body instead
            </button>
          </p>
        )}

        <label className="block text-sm font-medium text-ink-soft mb-2">How would you like to engage with this?</label>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStyle('seeing')}
            className={`${pillBase} ${style === 'seeing' ? pillActive : pillInactive}`}
          >
            I see images
          </button>
          <button
            onClick={() => setStyle('knowing')}
            className={`${pillBase} ${style === 'knowing' ? pillActive : pillInactive}`}
          >
            I just know things
          </button>
          <button
            onClick={() => setStyle('somatic')}
            className={`${pillBase} ${style === 'somatic' ? pillActive : pillInactive}`}
          >
            Visualizing stresses me — just breath &amp; body
          </button>
        </div>

        {style === 'seeing' && (
          <p className="text-xs text-ink-faint mb-6 -mt-3">
            Can&apos;t hold a clear picture? That&apos;s common, not a sign anything&apos;s wrong — it just means a
            different style may suit you better.{' '}
            <button
              onClick={() => setStyle('knowing')}
              className="text-patina hover:text-patina-deep underline underline-offset-2"
            >
              Try “I just know things”
            </button>
          </p>
        )}

        {/* Most people reuse their last timing setup (persisted via
            lastSessionSettings), so it stays collapsed by default — the
            summary line shows the current selection without opening it. */}
        <details className="group mb-8">
          <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center justify-between text-sm font-medium text-ink-faint hover:text-ink-soft">
            <span>
              Length &amp; bells{' '}
              <span className="text-ink-faint/70 font-normal">
                ({DURATIONS.find((d) => d.seconds === duration)?.label ?? `${duration}s`}, bells:{' '}
                {[bellAtStart && 'start', bellAtEnd && 'end', customBells.length > 0 && `${customBells.length} custom`]
                  .filter(Boolean)
                  .join(', ') || 'none'}
                )
              </span>
            </span>
            <span className="shrink-0 ml-2 transition-transform group-open:rotate-180" aria-hidden>
              ⌄
            </span>
          </summary>

          <div className="pt-4">
            <label className="block text-sm font-medium text-ink-soft mb-2">Session length</label>
            <div className="flex gap-2 mb-6">
              {DURATIONS.map((d) => (
                <button
                  key={d.seconds}
                  onClick={() => setDuration(d.seconds)}
                  className={`${pillBase} ${duration === d.seconds ? pillActive : pillInactive}`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-ink-soft mb-2">Bells</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={bellAtStart}
                  onChange={(e) => setBellAtStart(e.target.checked)}
                  className="accent-patina"
                />
                Start
              </label>
              <label className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={bellAtEnd}
                  onChange={(e) => setBellAtEnd(e.target.checked)}
                  className="accent-patina"
                />
                End
              </label>
            </div>

            {customBells.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {customBells
                  .slice()
                  .sort((a, b) => a - b)
                  .map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-paper-2 border border-ink/10 rounded-full px-2.5 py-1 flex items-center gap-1.5 text-ink-soft"
                    >
                      {Math.floor(t / 60)}:{(t % 60).toString().padStart(2, '0')}
                      <button
                        onClick={() => setCustomBells((bells) => bells.filter((b) => b !== t))}
                        aria-label={`Remove bell at ${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`}
                        className="text-ink-faint hover:text-ember"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div>
                <label htmlFor="bell-min" className="block text-xs font-medium text-ink-faint mb-1">
                  min
                </label>
                <input
                  id="bell-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={bellMin}
                  onChange={(e) => setBellMin(e.target.value)}
                  className="w-14 text-sm border border-ink/15 rounded-md px-2 py-1 bg-paper outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40"
                />
              </div>
              <div>
                <label htmlFor="bell-sec" className="block text-xs font-medium text-ink-faint mb-1">
                  sec
                </label>
                <input
                  id="bell-sec"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  value={bellSec}
                  onChange={(e) => setBellSec(e.target.value)}
                  className="w-14 text-sm border border-ink/15 rounded-md px-2 py-1 bg-paper outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40"
                />
              </div>
              <button
                onClick={() => {
                  const t = (parseInt(bellMin || '0', 10) || 0) * 60 + (parseInt(bellSec || '0', 10) || 0)
                  if (t > 0 && t < duration && !customBells.includes(t)) {
                    setCustomBells((bells) => [...bells, t])
                  }
                  setBellMin('')
                  setBellSec('')
                }}
                className="text-sm px-3 py-1.5 rounded-md border border-ink/15 text-ink-soft hover:border-patina transition-colors"
              >
                + place bell
              </button>
            </div>
          </div>
        </details>

        <button
          onClick={() => {
            setLastSessionSettings({ promptStyle: style, durationSec: duration, bellAtStart, bellAtEnd, customBells })
            const s = addSession(goal.id, mood, style, duration)
            setSessionId(s.id)
            setStep('running')
          }}
          className="w-full bg-patina text-paper py-2.5 rounded-lg hover:bg-patina-deep transition-colors"
        >
          Begin visualizing
        </button>
      </div>
    )
  }

  if (step === 'running') {
    return (
      <RunningSession
        prompts={prompts}
        durationSec={duration}
        bellAtStart={bellAtStart}
        bellAtEnd={bellAtEnd}
        customBells={customBells}
        onFinish={() => {
          if (sessionId) completeSession(sessionId)
          setStep('journal')
        }}
      />
    )
  }

  if (step === 'journal') {
    return (
      <div className="max-w-md mx-auto pt-16 px-6 fade-in">
        <p className="text-xs font-medium text-ink-faint mb-1">Journal</p>
        <h2 className="font-display text-2xl mb-1">Before it fades…</h2>
        <div className="flex items-start justify-between gap-3 mb-4">
          <label htmlFor="journal-text" className="text-sm text-ink-faint">
            Jot down anything from the session — a feeling, an image, a detail.
          </label>
          <div className="shrink-0">
            <VoiceInputButton
              label="Speak"
              onTranscript={(text) => setJournalText((prev) => (prev ? `${prev} ${text}` : text))}
            />
          </div>
        </div>
        <textarea
          id="journal-text"
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          rows={6}
          // Desktop only — on touch devices this would pop the keyboard open
          // immediately after a calm, eyes-closed session, which jars against
          // the gentle "before it fades" moment this screen is meant to be.
          autoFocus={typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
          className="w-full text-sm border border-ink/15 rounded-lg p-3 mb-4 outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40 bg-paper placeholder:text-ink-faint"
          placeholder="Write freely, or leave blank and skip."
        />
        <div className="flex gap-2">
          <button
            onClick={() => setStep('done')}
            className="flex-1 text-sm py-2.5 rounded-lg border border-ink/15 text-ink-soft hover:bg-paper-2 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => {
              if (sessionId && journalText.trim()) addJournalEntry(sessionId, goal.id, journalText.trim())
              setStep('done')
            }}
            className="flex-1 bg-patina text-paper text-sm py-2.5 rounded-lg hover:bg-patina-deep transition-colors"
          >
            Save entry
          </button>
        </div>
      </div>
    )
  }

  // done
  const streak = computeStreak(sessions)
  const streakLine =
    streak <= 1
      ? "Returning to the same scene tomorrow — with the same details and feeling — is what makes it stick."
      : `Day ${streak}. Same time tomorrow keeps it alive.`

  return (
    <div className="max-w-md mx-auto pt-20 px-6 text-center fade-in">
      <p className="font-display text-xl italic mb-2">Session complete.</p>
      <p className="text-sm text-ink-soft mb-2">Carry that feeling with you.</p>
      <p className="text-xs text-ink-faint mb-8 leading-relaxed">{streakLine}</p>
      <button
        onClick={() => {
          setStep('pick-goal')
          setGoalId(null)
          setJournalText('')
          setSessionId(null)
        }}
        className="text-sm font-medium text-patina hover:text-patina-deep"
      >
        Start another session
      </button>
    </div>
  )
}

// After this long without a tap, the screen dims — an invitation to close
// your eyes and put the phone face down instead of watching it.
const DIM_DELAY_MS = 7000

function RunningSession({
  prompts,
  durationSec,
  bellAtStart,
  bellAtEnd,
  customBells,
  onFinish,
}: {
  prompts: string[]
  durationSec: number
  bellAtStart: boolean
  bellAtEnd: boolean
  customBells: number[]
  onFinish: () => void
}) {
  const [remaining, setRemaining] = useState(durationSec)
  const [promptIndex, setPromptIndex] = useState(0)
  const [dimmed, setDimmed] = useState(false)
  const finishedRef = useRef(false)
  const firedBellsRef = useRef(new Set<number>())
  const dimTimerRef = useRef<number | null>(null)

  const promptInterval = Math.max(15, Math.floor(durationSec / prompts.length))

  useEffect(() => {
    if (bellAtStart) playBell()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scheduleDim() {
    if (dimTimerRef.current) window.clearTimeout(dimTimerRef.current)
    dimTimerRef.current = window.setTimeout(() => setDimmed(true), DIM_DELAY_MS)
  }

  useEffect(() => {
    scheduleDim()
    return () => {
      if (dimTimerRef.current) window.clearTimeout(dimTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleWake() {
    if (dimmed) setDimmed(false)
    scheduleDim()
  }

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick)
          if (!finishedRef.current) {
            finishedRef.current = true
            if (bellAtEnd) playBell()
            onFinish()
          }
          return 0
        }

        const elapsed = durationSec - (r - 1)
        if (customBells.includes(elapsed) && !firedBellsRef.current.has(elapsed)) {
          firedBellsRef.current.add(elapsed)
          playBell()
        }

        return r - 1
      })
    }, 1000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const elapsed = durationSec - remaining
    const idx = Math.min(prompts.length - 1, Math.floor(elapsed / promptInterval))
    setPromptIndex(idx)
  }, [remaining, durationSec, promptInterval, prompts.length])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div
      onClick={handleWake}
      className={`min-h-full flex items-center justify-center px-6 py-16 text-center cursor-default transition-colors duration-[1800ms] ${
        dimmed ? 'bg-dusk' : 'bg-transparent'
      }`}
    >
      <div className="max-w-lg w-full mx-auto fade-in">
        {!dimmed && (
          <p className="text-xs font-medium text-ink-faint mb-6 transition-opacity duration-700">
            Close your eyes between prompts — the screen will dim, and a bell will guide you.
          </p>
        )}
        <BreathRing size={220}>
          <p
            className={`font-mono text-2xl tabular-nums transition-opacity duration-700 ${
              dimmed ? 'opacity-0' : 'opacity-100 text-ink-soft'
            }`}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        </BreathRing>
        <p
          className={`font-display text-xl leading-relaxed min-h-[8rem] mt-10 transition-colors duration-[1800ms] ${
            dimmed ? 'text-paper/80' : 'text-ink'
          }`}
        >
          {prompts[promptIndex]}
        </p>
        {dimmed && (
          <p className="text-xs font-medium text-paper/35 mt-4">Tap to check the time</p>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (!finishedRef.current) {
              finishedRef.current = true
              onFinish()
            }
          }}
          className={`mt-6 text-xs font-medium transition-colors ${
            dimmed ? 'text-paper/35 hover:text-paper/70' : 'text-ink-faint hover:text-ink'
          }`}
        >
          End early
        </button>
      </div>
    </div>
  )
}
