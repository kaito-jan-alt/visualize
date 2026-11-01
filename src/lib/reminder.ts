export function notifySupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notifySupported()) return 'denied'
  if (Notification.permission === 'default') return Notification.requestPermission()
  return Notification.permission
}

/** Milliseconds from now until the next occurrence of "HH:MM" (today if still ahead, else tomorrow). */
export function msUntilNext(time: string): number {
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

/** Has the reminder time already passed today, relative to now? */
export function timeHasPassedToday(time: string): boolean {
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
}
