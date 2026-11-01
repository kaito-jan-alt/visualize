import { useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStore } from '../store'
import type { Goal } from '../types'
import { VoiceInputButton } from './VoiceInputButton'

export function GoalMap({ onStartSession }: { onStartSession: (goalId: string) => void }) {
  const goals = useStore((s) => s.goals)
  const addGoal = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const addDependency = useStore((s) => s.addDependency)
  const removeDependency = useStore((s) => s.removeDependency)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = goals.find((g) => g.id === selectedId) ?? null

  const nodes: Node[] = useMemo(
    () =>
      goals.map((g) => ({
        id: g.id,
        position: g.position,
        data: { label: g.title || 'Untitled goal' },
        style: {
          border: selectedId === g.id ? '1.5px solid #4b6e62' : '1px solid rgba(33,31,26,0.14)',
          borderRadius: 10,
          padding: '10px 14px',
          background: '#dbd3bc',
          fontSize: 13,
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          color: '#211f1a',
          boxShadow: selectedId === g.id ? '0 2px 10px rgba(75,110,98,0.18)' : '0 1px 3px rgba(33,31,26,0.06)',
        },
      })),
    [goals, selectedId],
  )

  // Dashed, quiet lines — this is lineage between goals, not a process
  // flow, so no arrowheads are added (ReactFlow omits them unless markerEnd
  // is set).
  const edges: Edge[] = useMemo(
    () =>
      goals.flatMap((g) =>
        g.dependsOn.map((depId) => ({
          id: `${depId}->${g.id}`,
          source: depId,
          target: g.id,
          animated: false,
          style: { stroke: 'rgba(75,110,98,0.35)', strokeWidth: 1.5, strokeDasharray: '4 4' },
        })),
      ),
    [goals],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateGoal(change.id, { position: change.position })
        }
      }
    },
    [updateGoal],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addDependency(connection.target, connection.source)
      }
    },
    [addDependency],
  )

  return (
    <div className="flex h-full relative">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onPaneClick={() => setSelectedId(null)}
          fitView
        >
          <Background color="rgba(33,31,26,0.12)" gap={24} size={1} />
          <Controls showInteractive={false} className="goal-map-controls" />
        </ReactFlow>

        <button
          onClick={() => {
            const g = addGoal('New goal')
            setSelectedId(g.id)
          }}
          className="absolute top-4 left-4 bg-patina text-paper text-sm px-3.5 py-2 rounded-lg shadow-sm hover:bg-patina-deep transition-colors"
        >
          + Add goal
        </button>

        {goals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center max-w-xs">
              <p className="font-display text-xl italic text-ink-soft mb-1">An empty map.</p>
              <p className="text-sm text-ink-faint">
                Add a goal, then write who you are once it's true — that's what you'll visualize.
              </p>
            </div>
          </div>
        )}

        <p className="absolute bottom-4 left-4 text-xs font-medium text-ink-faint max-w-xs">
          Drag between goals to connect dependencies
        </p>
      </div>

      {selected && (
        <GoalPanel
          goal={selected}
          allGoals={goals}
          onChange={(patch) => updateGoal(selected.id, patch)}
          onDelete={() => {
            deleteGoal(selected.id)
            setSelectedId(null)
          }}
          onAddDependency={(depId) => addDependency(selected.id, depId)}
          onRemoveDependency={(depId) => removeDependency(selected.id, depId)}
          onStartSession={() => onStartSession(selected.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

function GoalPanel({
  goal,
  allGoals,
  onChange,
  onDelete,
  onAddDependency,
  onRemoveDependency,
  onStartSession,
  onClose,
}: {
  goal: Goal
  allGoals: Goal[]
  onChange: (patch: Partial<Pick<Goal, 'title' | 'identityNote'>>) => void
  onDelete: () => void
  onAddDependency: (id: string) => void
  onRemoveDependency: (id: string) => void
  onStartSession: () => void
  onClose: () => void
}) {
  const candidates = allGoals.filter((g) => g.id !== goal.id && !goal.dependsOn.includes(g.id))

  return (
    <div className="fixed inset-0 z-20 sm:static sm:z-auto sm:inset-auto w-full sm:w-80 border-l border-ink/10 p-6 pt-[max(1.5rem,env(safe-area-inset-top))] sm:pt-6 overflow-y-auto bg-paper-2">
      <div className="flex justify-between items-start mb-5">
        <h2 className="text-xs font-medium text-ink-faint">Goal</h2>
        <button onClick={onClose} className="text-xs font-medium text-ink-faint hover:text-ink">
          Close
        </button>
      </div>

      <label htmlFor="goal-title" className="sr-only">
        Goal title
      </label>
      <input
        id="goal-title"
        value={goal.title}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full font-display text-xl mb-5 border-b border-transparent focus:border-ink/20 outline-none focus-visible:ring-2 focus-visible:ring-patina/40 rounded pb-1 bg-transparent"
        placeholder="Goal title"
      />

      <div className="flex items-start justify-between gap-2 mb-2">
        <label htmlFor="goal-identity-note" className="block text-sm font-medium text-ink-soft">
          Future me — identity, not just the achievement
        </label>
        <div className="shrink-0">
          <VoiceInputButton
            label="Speak"
            onTranscript={(text) =>
              onChange({ identityNote: goal.identityNote ? `${goal.identityNote} ${text}` : text })
            }
          />
        </div>
      </div>
      <textarea
        id="goal-identity-note"
        value={goal.identityNote}
        onChange={(e) => onChange({ identityNote: e.target.value })}
        rows={5}
        placeholder="How do I think, act, and spend my time once this is true?"
        className="w-full text-sm border border-ink/15 rounded-lg p-3 mb-5 outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40 bg-paper placeholder:text-ink-faint"
      />

      <div className="mb-6">
        <h3 className="text-sm font-medium text-ink-soft mb-2">Depends on</h3>
        {goal.dependsOn.length === 0 && <p className="text-xs text-ink-faint">No dependencies yet.</p>}
        <ul className="space-y-1.5">
          {goal.dependsOn.map((depId) => {
            const dep = allGoals.find((g) => g.id === depId)
            return (
              <li key={depId} className="flex justify-between items-center gap-2 text-sm">
                <span className="min-w-0 truncate">{dep?.title ?? 'Unknown'}</span>
                <button
                  onClick={() => onRemoveDependency(depId)}
                  className="shrink-0 text-xs font-medium text-ink-faint hover:text-ember"
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
        {candidates.length > 0 && (
          <select
            className="mt-2 w-full text-sm border border-ink/15 rounded-lg p-1.5 bg-paper text-ink focus-visible:ring-2 focus-visible:ring-patina/40 outline-none"
            value=""
            onChange={(e) => {
              if (e.target.value) onAddDependency(e.target.value)
            }}
          >
            <option value="">+ add dependency…</option>
            {candidates.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        onClick={onStartSession}
        className="w-full bg-patina text-paper text-sm py-2.5 rounded-lg mb-2 hover:bg-patina-deep transition-colors"
      >
        Start visualization
      </button>
      <button
        onClick={() => {
          if (window.confirm(`Delete "${goal.title || 'this goal'}"? This can't be undone.`)) {
            onDelete()
          }
        }}
        className="w-full text-xs font-medium text-ink-faint hover:text-ember py-1.5"
      >
        Delete goal
      </button>
    </div>
  )
}
