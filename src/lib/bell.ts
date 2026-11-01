let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

/** Plays a simple sine-wave meditation bell. No audio assets needed. */
export function playBell() {
  const audioCtx = getCtx()
  const now = audioCtx.currentTime

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(528, now)

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5)

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start(now)
  osc.stop(now + 3.6)
}
