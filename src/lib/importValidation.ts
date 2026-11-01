import type { Goal, JournalEntry, Mood, Profile, PromptStyle, ScheduledSession, Session } from '../types'

// Backup files come from a file picker, not a trusted source — someone could
// hand-edit one, or pick the wrong file entirely. Rather than trust the
// shape and let a malformed field crash the app mid-render (or silently
// corrupt the rest of localStorage), each array is filtered down to only
// the items that actually match the expected shape.
export interface BackupData {
  goals: Goal[]
  sessions: Session[]
  journalEntries: JournalEntry[]
  profiles: Profile[]
  activeProfileId: string | null
  scheduledSessions: ScheduledSession[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMood(value: unknown): value is Mood {
  return value === 'calm' || value === 'anxious' || value === 'tired' || value === 'motivated' || value === 'neutral'
}

function isPromptStyle(value: unknown): value is PromptStyle {
  return value === 'seeing' || value === 'knowing' || value === 'somatic'
}

function isGoal(v: unknown): v is Goal {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.identityNote === 'string' &&
    Array.isArray(v.dependsOn) &&
    v.dependsOn.every((d) => typeof d === 'string') &&
    isRecord(v.position) &&
    typeof v.position.x === 'number' &&
    typeof v.position.y === 'number' &&
    typeof v.createdAt === 'number'
  )
}

function isSession(v: unknown): v is Session {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.goalId === 'string' &&
    isMood(v.mood) &&
    isPromptStyle(v.promptStyle) &&
    typeof v.durationSec === 'number' &&
    typeof v.startedAt === 'number' &&
    typeof v.completed === 'boolean'
  )
}

function isJournalEntry(v: unknown): v is JournalEntry {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.sessionId === 'string' &&
    typeof v.goalId === 'string' &&
    typeof v.text === 'string' &&
    typeof v.createdAt === 'number'
  )
}

function isProfile(v: unknown): v is Profile {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.color === 'string' &&
    typeof v.createdAt === 'number'
  )
}

function isScheduledSession(v: unknown): v is ScheduledSession {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.goalId === 'string' &&
    typeof v.scheduledAt === 'number' &&
    typeof v.durationSec === 'number' &&
    isPromptStyle(v.promptStyle) &&
    typeof v.notes === 'string' &&
    typeof v.createdAt === 'number'
  )
}

function filterArray<T>(value: unknown, isItem: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(isItem) : []
}

export function parseBackup(json: string): BackupData {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  if (!isRecord(data)) {
    throw new Error("That doesn't look like a Visualize backup file.")
  }

  const goals = filterArray(data.goals, isGoal)
  const profiles = filterArray(data.profiles, isProfile)
  const profileIds = new Set(profiles.map((p) => p.id))

  return {
    goals,
    sessions: filterArray(data.sessions, isSession),
    journalEntries: filterArray(data.journalEntries, isJournalEntry),
    profiles,
    activeProfileId: typeof data.activeProfileId === 'string' && profileIds.has(data.activeProfileId) ? data.activeProfileId : null,
    scheduledSessions: filterArray(data.scheduledSessions, isScheduledSession),
  }
}
