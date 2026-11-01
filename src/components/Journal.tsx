import { useStore } from '../store'

export function Journal() {
  const entries = useStore((s) => s.journalEntries)
  const goals = useStore((s) => s.goals)

  if (entries.length === 0) {
    return (
      <div className="max-w-md mx-auto pt-20 px-6 text-center fade-in">
        <p className="font-display text-xl italic text-ink-soft mb-1">Nothing written yet.</p>
        <p className="text-sm text-ink-faint">Entries from your visualization sessions will collect here.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pt-10 px-6 pb-16 fade-in">
      <p className="text-xs font-medium text-ink-faint mb-1">Journal</p>
      <h2 className="font-display text-2xl mb-6">What stayed with you</h2>
      <ul className="divide-y divide-ink/10">
        {entries.map((e) => {
          const goal = goals.find((g) => g.id === e.goalId)
          return (
            <li key={e.id} className="py-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-medium text-ink">{goal?.title ?? 'Deleted goal'}</span>
                <span className="text-xs text-ink-faint">
                  {new Date(e.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed">{e.text}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
