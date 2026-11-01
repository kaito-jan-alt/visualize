import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parseBackup } from './lib/importValidation'
import type { Goal, JournalEntry, Mood, Profile, PromptStyle, ScheduledSession, Session } from './types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PROFILE_COLORS = ['#4b6e62', '#b5533c', '#a9842f', '#5c5d51']

export interface SessionSettings {
  promptStyle: PromptStyle
  durationSec: number
  bellAtStart: boolean
  bellAtEnd: boolean
  customBells: number[]
}

const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  promptStyle: 'knowing',
  durationSec: 300,
  bellAtStart: true,
  bellAtEnd: true,
  customBells: [],
}

export interface ReminderSettings {
  enabled: boolean
  time: string // "HH:MM", 24h
}

const DEFAULT_REMINDER: ReminderSettings = { enabled: false, time: '09:00' }

interface AppState {
  goals: Goal[]
  sessions: Session[]
  journalEntries: JournalEntry[]
  lastSessionSettings: SessionSettings
  reminder: ReminderSettings
  profiles: Profile[]
  activeProfileId: string | null
  scheduledSessions: ScheduledSession[]
  guideSeen: boolean

  addGoal: (title: string, position?: { x: number; y: number }) => Goal
  updateGoal: (id: string, patch: Partial<Pick<Goal, 'title' | 'identityNote' | 'position'>>) => void
  deleteGoal: (id: string) => void
  addDependency: (goalId: string, dependsOnId: string) => void
  removeDependency: (goalId: string, dependsOnId: string) => void

  addSession: (goalId: string, mood: Mood, promptStyle: PromptStyle, durationSec: number) => Session
  completeSession: (id: string) => void
  setLastSessionSettings: (settings: SessionSettings) => void
  setReminder: (settings: ReminderSettings) => void

  addJournalEntry: (sessionId: string, goalId: string, text: string) => void

  addProfile: (name: string) => Profile
  renameProfile: (id: string, name: string) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string | null) => void

  addScheduledSession: (
    goalId: string,
    scheduledAt: number,
    durationSec: number,
    promptStyle: PromptStyle,
    notes: string,
  ) => ScheduledSession
  removeScheduledSession: (id: string) => void

  markGuideSeen: () => void

  exportData: () => string
  importData: (json: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      goals: [],
      sessions: [],
      journalEntries: [],
      lastSessionSettings: DEFAULT_SESSION_SETTINGS,
      reminder: DEFAULT_REMINDER,
      profiles: [],
      activeProfileId: null,
      scheduledSessions: [],
      guideSeen: false,

      addGoal: (title, position) => {
        const goal: Goal = {
          id: uid(),
          title,
          identityNote: '',
          dependsOn: [],
          position: position ?? { x: 80 + Math.random() * 300, y: 80 + Math.random() * 200 },
          createdAt: Date.now(),
        }
        set((s) => ({ goals: [...s.goals, goal] }))
        return goal
      },

      updateGoal: (id, patch) => {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }))
      },

      deleteGoal: (id) => {
        set((s) => ({
          goals: s.goals
            .filter((g) => g.id !== id)
            .map((g) => ({ ...g, dependsOn: g.dependsOn.filter((d) => d !== id) })),
        }))
      },

      addDependency: (goalId, dependsOnId) => {
        if (goalId === dependsOnId) return
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId && !g.dependsOn.includes(dependsOnId)
              ? { ...g, dependsOn: [...g.dependsOn, dependsOnId] }
              : g,
          ),
        }))
      },

      removeDependency: (goalId, dependsOnId) => {
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, dependsOn: g.dependsOn.filter((d) => d !== dependsOnId) } : g,
          ),
        }))
      },

      addSession: (goalId, mood, promptStyle, durationSec) => {
        const session: Session = {
          id: uid(),
          goalId,
          mood,
          promptStyle,
          durationSec,
          startedAt: Date.now(),
          completed: false,
        }
        set((s) => ({ sessions: [...s.sessions, session] }))
        return session
      },

      completeSession: (id) => {
        set((s) => ({
          sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, completed: true } : sess)),
        }))
      },

      setLastSessionSettings: (settings) => {
        set({ lastSessionSettings: settings })
      },

      setReminder: (settings) => {
        set({ reminder: settings })
      },

      addJournalEntry: (sessionId, goalId, text) => {
        const entry: JournalEntry = { id: uid(), sessionId, goalId, text, createdAt: Date.now() }
        set((s) => ({ journalEntries: [entry, ...s.journalEntries] }))
      },

      addProfile: (name) => {
        const profile: Profile = {
          id: uid(),
          name,
          color: PROFILE_COLORS[get().profiles.length % PROFILE_COLORS.length],
          createdAt: Date.now(),
        }
        set((s) => ({ profiles: [...s.profiles, profile], activeProfileId: profile.id }))
        return profile
      },

      renameProfile: (id, name) => {
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, name } : p)) }))
      },

      deleteProfile: (id) => {
        set((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id)
          return {
            profiles,
            activeProfileId: s.activeProfileId === id ? (profiles[0]?.id ?? null) : s.activeProfileId,
          }
        })
      },

      setActiveProfile: (id) => {
        set({ activeProfileId: id })
      },

      addScheduledSession: (goalId, scheduledAt, durationSec, promptStyle, notes) => {
        const scheduled: ScheduledSession = {
          id: uid(),
          goalId,
          scheduledAt,
          durationSec,
          promptStyle,
          notes,
          createdAt: Date.now(),
        }
        set((s) => ({ scheduledSessions: [...s.scheduledSessions, scheduled] }))
        return scheduled
      },

      removeScheduledSession: (id) => {
        set((s) => ({ scheduledSessions: s.scheduledSessions.filter((sch) => sch.id !== id) }))
      },

      markGuideSeen: () => {
        set({ guideSeen: true })
      },

      exportData: () => {
        const { goals, sessions, journalEntries, profiles, activeProfileId, scheduledSessions } = get()
        return JSON.stringify(
          { goals, sessions, journalEntries, profiles, activeProfileId, scheduledSessions },
          null,
          2,
        )
      },

      importData: (json) => {
        set(parseBackup(json))
      },
    }),
    { name: 'visualize-app-storage' },
  ),
)
