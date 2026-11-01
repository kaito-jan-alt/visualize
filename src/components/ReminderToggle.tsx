import { useEffect, useRef, useState } from 'react'
import { notifySupported, requestNotificationPermission } from '../lib/reminder'
import { useStore } from '../store'

export function ReminderToggle() {
  const reminder = useStore((s) => s.reminder)
  const setReminder = useStore((s) => s.setReminder)
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    notifySupported() ? Notification.permission : 'unsupported',
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleToggle(enabled: boolean) {
    if (enabled && notifySupported() && Notification.permission === 'default') {
      const result = await requestNotificationPermission()
      setPermission(result)
    }
    setReminder({ ...reminder, enabled })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`text-xs font-medium transition-colors ${
          reminder.enabled ? 'text-patina' : 'text-ink-faint hover:text-ink-soft'
        }`}
      >
        {reminder.enabled ? `Reminder ${reminder.time}` : 'Remind me'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-paper border border-ink/15 rounded-lg shadow-lg p-4 z-30 text-left">
          <label className="flex items-center gap-2 text-sm text-ink-soft mb-3">
            <input
              type="checkbox"
              checked={reminder.enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="accent-patina"
            />
            Daily reminder
          </label>
          <label htmlFor="reminder-time" className="block text-xs font-medium text-ink-faint mb-1">
            Time
          </label>
          <input
            id="reminder-time"
            type="time"
            value={reminder.time}
            onChange={(e) => setReminder({ ...reminder, time: e.target.value })}
            disabled={!reminder.enabled}
            className="w-full text-sm border border-ink/15 rounded-md px-2 py-1 bg-paper outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40 disabled:opacity-50 mb-3"
          />
          {permission === 'denied' ? (
            <p className="text-xs text-ember leading-relaxed">
              Notifications are blocked in your browser. You'll still see a gentle nudge when you open Visualize.
            </p>
          ) : (
            <p className="text-xs text-ink-faint leading-relaxed">
              Works while Visualize is open or installed. No accounts, nothing leaves your device.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
