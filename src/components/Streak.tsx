import { useStore } from '../store'
import { computeStreak, dayKey } from '../lib/streak'

export function Streak() {
  const sessions = useStore((s) => s.sessions)

  const completedDays = new Set(sessions.filter((s) => s.completed).map((s) => dayKey(s.startedAt)))

  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })

  const streak = computeStreak(sessions)

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {days.map((d, i) => {
          const active = completedDays.has(dayKey(d.getTime()))
          const label = `${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} — ${
            active ? 'visualized' : 'not visualized'
          }`
          return (
            <span
              key={i}
              role="img"
              aria-label={label}
              title={d.toLocaleDateString()}
              className={`w-2 h-2 rounded-full transition-colors duration-500 ${active ? 'bg-gold' : 'bg-ink/10'}`}
            />
          )
        })}
      </div>
      {streak > 0 && <span className="text-xs font-medium text-ink-faint">{streak}d</span>}
    </div>
  )
}
