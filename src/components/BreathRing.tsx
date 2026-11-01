import type { ReactNode } from 'react'

export function BreathRing({
  size = 280,
  tone = 'patina',
  children,
}: {
  size?: number
  /** 'ember' marks the acute-distress Crisis Relief flow so it reads as
   * visually distinct from a routine visualization session at a glance. */
  tone?: 'patina' | 'ember'
  children?: ReactNode
}) {
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={`breath-ring ${tone === 'ember' ? 'tone-ember' : ''} absolute inset-0`} aria-hidden>
        <span className="ring ring-1" />
        <span className="ring ring-2" />
        <span className="ring ring-3" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
