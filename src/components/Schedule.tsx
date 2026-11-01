import { useMemo, useState } from 'react'
import { downloadIcs } from '../lib/ics'
import { useStore } from '../store'
import type { PromptStyle } from '../types'

const DURATIONS = [
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
]

const pillBase = 'text-sm px-3 py-1.5 rounded-full border transition-colors'
const pillActive = 'bg-patina text-paper border-patina'
const pillInactive = 'border-ink/15 text-ink-soft hover:border-ink/30'

// Scheduling stays entirely local — there's no server to send a push
// reminder, so an .ics file is handed to whatever calendar app the person
// already trusts, and that app does the reminding.
export function Schedule({ onStartSession }: { onStartSession: (goalId: string) => void }) {
  const goals = useStore((s) => s.goals)
  const scheduledSessions = useStore((s) => s.scheduledSessions)
  const addScheduledSession = useStore((s) => s.addScheduledSession)
  const removeScheduledSession = useStore((s) => s.removeScheduledSession)

  const [goalId, setGoalId] = useState(goals[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(300)
  const [promptStyle, setPromptStyle] = useState<PromptStyle>('knowing')
  const [notes, setNotes] = useState('')

  const upcoming = useMemo(
    () => scheduledSessions.slice().sort((a, b) => a.scheduledAt - b.scheduledAt),
    [scheduledSessions],
  )

  function handleSchedule() {
    if (!goalId || !date) return
    const scheduledAt = new Date(`${date}T${time}`).getTime()
    if (Number.isNaN(scheduledAt)) return
    const scheduled = addScheduledSession(goalId, scheduledAt, duration, promptStyle, notes.trim())
    const goal = goals.find((g) => g.id === goalId)
    downloadIcs(scheduled, goal?.title ?? 'Visualize session')
    setNotes('')
  }

  if (goals.length === 0) {
    return (
      <div className="max-w-md mx-auto pt-16 px-6 fade-in">
        <p className="text-sm text-ink-faint">No goals yet. Head to the Map tab and add one first.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto pt-16 px-6 pb-16 fade-in">
      <p className="text-xs font-medium text-ink-faint mb-2">Schedule</p>
      <h2 className="font-display text-2xl mb-6">Put a session on your calendar.</h2>

      <label htmlFor="schedule-goal" className="block text-sm font-medium text-ink-soft mb-2">
        Goal
      </label>
      <select
        id="schedule-goal"
        value={goalId}
        onChange={(e) => setGoalId(e.target.value)}
        className="w-full text-sm border border-ink/15 rounded-lg p-2.5 mb-5 bg-paper text-ink outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40"
      >
        {goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.title}
          </option>
        ))}
      </select>

      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink-soft mb-2" htmlFor="schedule-date">
            Date
          </label>
          <input
            id="schedule-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm border border-ink/15 rounded-lg p-2.5 bg-paper outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink-soft mb-2" htmlFor="schedule-time">
            Time
          </label>
          <input
            id="schedule-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full text-sm border border-ink/15 rounded-lg p-2.5 bg-paper outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40"
          />
        </div>
      </div>

      <label className="block text-sm font-medium text-ink-soft mb-2">Length</label>
      <div className="flex gap-2 mb-5">
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

      <label className="block text-sm font-medium text-ink-soft mb-2">Style</label>
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setPromptStyle('seeing')}
          className={`${pillBase} ${promptStyle === 'seeing' ? pillActive : pillInactive}`}
        >
          I see images
        </button>
        <button
          onClick={() => setPromptStyle('knowing')}
          className={`${pillBase} ${promptStyle === 'knowing' ? pillActive : pillInactive}`}
        >
          I just know things
        </button>
        <button
          onClick={() => setPromptStyle('somatic')}
          className={`${pillBase} ${promptStyle === 'somatic' ? pillActive : pillInactive}`}
        >
          Breath &amp; body
        </button>
      </div>

      <label className="block text-sm font-medium text-ink-soft mb-2" htmlFor="schedule-notes">
        Note to self (optional)
      </label>
      <textarea
        id="schedule-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Anything you want the calendar event to say"
        className="w-full text-sm border border-ink/15 rounded-lg p-3 mb-6 outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40 bg-paper placeholder:text-ink-faint"
      />

      <button
        onClick={handleSchedule}
        disabled={!date}
        className="w-full bg-patina text-paper text-sm py-2.5 rounded-lg mb-10 hover:bg-patina-deep transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Schedule &amp; download calendar file
      </button>

      <h3 className="text-sm font-medium text-ink-soft mb-3">Upcoming</h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-ink-faint">Nothing scheduled yet.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((s) => {
            const goal = goals.find((g) => g.id === s.goalId)
            const due = s.scheduledAt <= Date.now()
            return (
              <li
                key={s.id}
                className="border-b border-ink/10 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">{goal?.title ?? 'Unknown goal'}</p>
                  <p className="text-xs text-ink-faint">
                    {new Date(s.scheduledAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {due && (
                    <button
                      onClick={() => onStartSession(s.goalId)}
                      className="text-xs font-medium text-patina hover:text-patina-deep"
                    >
                      Start now
                    </button>
                  )}
                  <button
                    onClick={() => downloadIcs(s, goal?.title ?? 'Visualize session')}
                    className="text-xs font-medium text-ink-faint hover:text-ink-soft"
                  >
                    Add to calendar
                  </button>
                  <button
                    onClick={() => removeScheduledSession(s.id)}
                    aria-label={`Remove scheduled session for ${goal?.title ?? 'this goal'}`}
                    className="text-xs font-medium text-ink-faint hover:text-ember"
                  >
                    ×
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
