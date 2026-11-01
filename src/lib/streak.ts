import type { Session } from '../types'

export function dayKey(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Consecutive days (including today, if applicable) with at least one completed session. */
export function computeStreak(sessions: Session[]): number {
  const completedDays = new Set(sessions.filter((s) => s.completed).map((s) => dayKey(s.startedAt)))
  const today = new Date()
  let streak = 0
  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (completedDays.has(dayKey(d.getTime()))) streak++
    else break
  }
  return streak
}
