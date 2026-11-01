import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'

// Local-only identity — no accounts, no passwords, nothing leaves the
// device. Just a name (and a color) so more than one person sharing a
// device can keep their own greeting straight. Switching profiles does not
// scope goals/sessions/journal — those stay shared on this device.
export function ProfileBar() {
  const profiles = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const addProfile = useStore((s) => s.addProfile)
  const renameProfile = useStore((s) => s.renameProfile)
  const deleteProfile = useStore((s) => s.deleteProfile)
  const setActiveProfile = useStore((s) => s.setActiveProfile)

  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const active = profiles.find((p) => p.id === activeProfileId) ?? null

  function close() {
    setOpen(false)
    setRenamingId(null)
  }

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    addProfile(name)
    setNewName('')
  }

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink-soft"
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-paper text-[10px] font-sans normal-case shrink-0"
          style={{ background: active?.color ?? '#8c8c7e' }}
          aria-hidden
        >
          {active ? active.name.trim().slice(0, 1).toUpperCase() : '?'}
        </span>
        <span className="truncate max-w-[6rem]">{active ? active.name : 'Guest'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-paper-2 border border-ink/15 rounded-lg shadow-md p-3 z-30 text-left fade-in">
          <p className="text-xs font-medium text-ink-faint mb-2">Who's visualizing?</p>

          <ul className="space-y-1 mb-3">
            <li>
              <button
                onClick={() => {
                  setActiveProfile(null)
                  close()
                }}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-paper transition-colors ${
                  activeProfileId === null ? 'text-patina' : 'text-ink-soft'
                }`}
              >
                Guest (no profile)
              </button>
            </li>
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                {renamingId === p.id ? (
                  <input
                    autoFocus
                    aria-label={`Rename ${p.name}`}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const name = renameValue.trim()
                        if (name) renameProfile(p.id, name)
                        setRenamingId(null)
                      }
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onBlur={() => setRenamingId(null)}
                    className="flex-1 text-sm px-2 py-1 rounded-md border border-ink/15 bg-paper outline-none focus-visible:ring-2 focus-visible:ring-patina/40"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setActiveProfile(p.id)
                      close()
                    }}
                    className={`flex-1 text-left text-sm px-2 py-1.5 rounded-md hover:bg-paper transition-colors truncate ${
                      activeProfileId === p.id ? 'text-patina' : 'text-ink-soft'
                    }`}
                  >
                    {p.name}
                  </button>
                )}
                <button
                  onClick={() => {
                    setRenamingId(p.id)
                    setRenameValue(p.name)
                  }}
                  aria-label={`Rename ${p.name}`}
                  className="shrink-0 text-xs text-ink-faint hover:text-ink-soft px-1"
                >
                  ✎
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Remove profile “${p.name}”? Your goals, sessions, and journal stay either way.`)) {
                      deleteProfile(p.id)
                    }
                  }}
                  aria-label={`Delete ${p.name}`}
                  className="shrink-0 text-xs text-ink-faint hover:text-ember px-1"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-1.5">
            <input
              aria-label="Add a profile"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
              placeholder="Add a profile…"
              className="flex-1 text-sm px-2 py-1.5 rounded-md border border-ink/15 bg-paper outline-none focus:border-patina focus-visible:ring-2 focus-visible:ring-patina/40 placeholder:text-ink-faint"
            />
            <button
              onClick={handleAdd}
              className="shrink-0 text-xs font-medium text-patina hover:text-patina-deep px-1"
            >
              Add
            </button>
          </div>

          <button
            onClick={close}
            className="mt-3 w-full text-xs font-medium text-ink-faint hover:text-ink text-center"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
