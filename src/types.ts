export type PromptStyle = 'seeing' | 'knowing' | 'somatic'

export type Mood = 'calm' | 'anxious' | 'tired' | 'motivated' | 'neutral'

export interface Goal {
  id: string
  title: string
  identityNote: string
  dependsOn: string[]
  position: { x: number; y: number }
  createdAt: number
}

export interface Session {
  id: string
  goalId: string
  mood: Mood
  promptStyle: PromptStyle
  durationSec: number
  startedAt: number
  completed: boolean
}

export interface JournalEntry {
  id: string
  sessionId: string
  goalId: string
  text: string
  createdAt: number
}

// Local-only identity — no accounts, no server. Just a name/color stored
// on-device so a shared device can support more than one person and greet
// them by name.
export interface Profile {
  id: string
  name: string
  color: string
  createdAt: number
}

// A session the person intends to do later, exported as an .ics file so it
// can live in whatever calendar app they already use — this app has no
// backend to push a reminder itself.
export interface ScheduledSession {
  id: string
  goalId: string
  scheduledAt: number
  durationSec: number
  promptStyle: PromptStyle
  notes: string
  createdAt: number
}
