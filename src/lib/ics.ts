import type { ScheduledSession } from '../types'

function formatIcsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// Escaping per RFC 5545 — backslashes and the three delimiter characters
// that have meaning inside an ICS text value.
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildIcs(scheduled: ScheduledSession, goalTitle: string): string {
  const start = formatIcsDate(scheduled.scheduledAt)
  const end = formatIcsDate(scheduled.scheduledAt + scheduled.durationSec * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Visualize//EN',
    'BEGIN:VEVENT',
    `UID:${scheduled.id}@visualize.local`,
    `DTSTAMP:${formatIcsDate(Date.now())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(`Visualize — ${goalTitle}`)}`,
    scheduled.notes ? `DESCRIPTION:${escapeIcsText(scheduled.notes)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => line !== null)

  return lines.join('\r\n')
}

// Fully client-side, no network — mirrors the JSON backup download already
// used elsewhere in the app, just with calendar content instead.
export function downloadIcs(scheduled: ScheduledSession, goalTitle: string) {
  const ics = buildIcs(scheduled, goalTitle)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const slug = goalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  a.download = `visualize-${slug || 'session'}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
