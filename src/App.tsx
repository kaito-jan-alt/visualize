import { useEffect, useMemo, useRef, useState } from 'react'
import { CrisisRelief } from './components/CrisisRelief'
import { GoalMap } from './components/GoalMap'
import { Guide } from './components/Guide'
import { Journal } from './components/Journal'
import { ProfileBar } from './components/ProfileBar'
import { ReminderToggle } from './components/ReminderToggle'
import { Schedule } from './components/Schedule'
import { Session } from './components/Session'
import { Streak } from './components/Streak'
import { dayKey } from './lib/streak'
import { msUntilNext, notifySupported, timeHasPassedToday } from './lib/reminder'
import { useStore } from './store'

type Tab = 'map' | 'session' | 'schedule' | 'journal'

function App() {
  const [tab, setTab] = useState<Tab>('map')
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null)
  const [crisisActive, setCrisisActive] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const reminder = useStore((s) => s.reminder)
  const sessions = useStore((s) => s.sessions)
  const guideSeen = useStore((s) => s.guideSeen)
  const markGuideSeen = useStore((s) => s.markGuideSeen)
  const [guideOpen, setGuideOpen] = useState(false)

  // Show the guide automatically the first time someone opens the app —
  // dismissing it is what marks it seen, so it won't interrupt again.
  useEffect(() => {
    if (!guideSeen) setGuideOpen(true)
  }, [guideSeen])

  const doneToday = useMemo(() => {
    const today = dayKey(Date.now())
    return sessions.some((s) => s.completed && dayKey(s.startedAt) === today)
  }, [sessions])

  // Fires a local notification at the reminder time, while the app is open
  // (or kept alive in the background). This can't wake the app once it's
  // fully closed — that would need a push server, which this local-first
  // app intentionally doesn't have. The in-app nudge banner below is the
  // reliable fallback for that case.
  useEffect(() => {
    if (!reminder.enabled || !notifySupported() || Notification.permission !== 'granted') return
    let timer: number
    function scheduleNext() {
      timer = window.setTimeout(() => {
        const today = dayKey(Date.now())
        const alreadyDoneToday = useStore.getState().sessions.some((s) => s.completed && dayKey(s.startedAt) === today)
        if (!alreadyDoneToday) {
          try {
            new Notification('Time to visualize', {
              body: 'A couple of quiet minutes for your goal.',
              icon: '/icon-192.png',
            })
          } catch {
            // Notification constructor can throw in some PWA contexts; fail silently.
          }
        }
        scheduleNext()
      }, msUntilNext(reminder.time))
    }
    scheduleNext()
    return () => window.clearTimeout(timer)
  }, [reminder.enabled, reminder.time])

  const showNudge =
    reminder.enabled && !doneToday && !nudgeDismissed && !crisisActive && timeHasPassedToday(reminder.time)

  function handleExport() {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visualize-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(reader.result as string)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Could not read that file — is it a valid backup?')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="h-full flex flex-col bg-paper text-ink pb-[env(safe-area-inset-bottom)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-patina focus:text-paper focus:px-3 focus:py-2 focus:rounded-md focus:text-sm"
      >
        Skip to main content
      </a>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:py-4 border-b border-ink/10">
        <div className="flex items-center gap-4 sm:gap-8">
          <h1 className="font-display italic text-lg sm:text-xl tracking-tight">Visualize</h1>
          <nav className="flex gap-3 sm:gap-5">
            {(['map', 'session', 'schedule', 'journal'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  if (t !== 'session') setPendingGoalId(null)
                }}
                className={`text-sm pb-0.5 border-b-2 transition-colors ${
                  tab === t && !crisisActive
                    ? 'border-patina text-ink font-medium'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {t === 'session' ? 'Visualize' : t === 'map' ? 'Map' : t === 'schedule' ? 'Schedule' : 'Journal'}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center flex-wrap justify-end gap-3 sm:gap-5">
          <button
            onClick={() => setCrisisActive(true)}
            className="text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full border border-ember/40 text-ember hover:bg-ember-tint transition-colors whitespace-nowrap"
          >
            Need relief now
          </button>
          <Streak />
          <ReminderToggle />
          <ProfileBar />
          <div className="flex items-center gap-3 text-xs font-medium text-ink-faint whitespace-nowrap divide-x divide-ink/15">
            <button onClick={() => setGuideOpen(true)} className="hover:text-ink-soft">
              Guide
            </button>
            <button onClick={handleExport} className="hover:text-ink-soft pl-3">
              Export
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="hover:text-ink-soft pl-3">
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </header>

      {showNudge && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2 bg-patina-tint text-sm text-ink-soft border-b border-ink/10 fade-in"
        >
          <span>Haven't visualized today yet.</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setTab('session')
                setNudgeDismissed(true)
              }}
              className="text-xs font-medium text-patina hover:text-patina-deep"
            >
              Visualize now
            </button>
            <button
              onClick={() => setNudgeDismissed(true)}
              className="text-ink-faint hover:text-ink"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="flex-1 overflow-hidden outline-none">
        {crisisActive ? (
          <div className="h-full overflow-y-auto">
            <CrisisRelief onExit={() => setCrisisActive(false)} />
          </div>
        ) : (
          <>
            {tab === 'map' && (
              <GoalMap
                onStartSession={(goalId) => {
                  setPendingGoalId(goalId)
                  setTab('session')
                }}
              />
            )}
            {tab === 'session' && (
              <div className="h-full overflow-y-auto">
                <Session initialGoalId={pendingGoalId} onGoalConsumed={() => setPendingGoalId(null)} />
              </div>
            )}
            {tab === 'schedule' && (
              <div className="h-full overflow-y-auto">
                <Schedule
                  onStartSession={(goalId) => {
                    setPendingGoalId(goalId)
                    setTab('session')
                  }}
                />
              </div>
            )}
            {tab === 'journal' && (
              <div className="h-full overflow-y-auto">
                <Journal />
              </div>
            )}
          </>
        )}
      </main>

      {guideOpen && (
        <Guide
          onClose={() => {
            setGuideOpen(false)
            markGuideSeen()
          }}
        />
      )}
    </div>
  )
}

export default App
