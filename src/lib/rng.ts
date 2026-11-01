/** Small deterministic PRNG so the same seed always reproduces the same picks
 * within one session, while different sessions (different seeds) vary. */
export function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return h
}

export function createRng(seed: string | number) {
  return mulberry32(typeof seed === 'number' ? seed : hashSeed(seed))
}

export function pick<T>(rand: () => number, options: T[]): T {
  return options[Math.floor(rand() * options.length)]
}
