import type { Goal, Mood, PromptStyle } from '../types'
import { createRng, pick } from './rng'

// Each fixed line has a couple of variants, chosen per-session by a seeded
// random pick (see `seed` below). This keeps daily sessions on the same goal
// from reading identically every time, without touching the parts that are
// already unique per-goal (the identity note, the goal title).
const moodOpeners: Record<Mood, string[]> = {
  calm: [
    "You're already settled. Let that calm deepen with each breath.",
    "There's an ease here already — let it spread a little further.",
  ],
  anxious: [
    'Before anything else, just breathe. Let your shoulders drop. There is no rush here.',
    'Nothing to solve right now. Just this breath, and the next one.',
  ],
  tired: [
    'No need to strain. Let this be gentle — soft focus, slow pace.',
    'Low effort is fine here. Let your eyes rest, even half-closed.',
  ],
  motivated: [
    "Good — bring that energy with you. Let's point it somewhere specific.",
    "That energy is useful. Let's give it a direction.",
  ],
  neutral: [
    'Take a slow breath in, and a slower breath out.',
    'Settle in. There is nowhere else you need to be right now.',
  ],
}

const breathCues = [
  'Breathe in slowly through the nose for a count of four… hold for a moment… and release for a count of six. Do that two more times, at your own pace.',
  "Slow inhale for four counts… a brief hold… and a long exhale for six. Repeat twice more, whenever you're ready.",
]

const relaxLines = [
  'Let your body go a little heavier with each breath, and let your eyes soften, even if they stay closed.',
  'With each breath, let your body settle a bit more and your eyes soften behind closed lids.',
]

const bodyScanVariants: string[][] = [
  ['Notice your feet, and the weight of them.', 'Notice your feet pressing down, and the weight they carry.'],
  ['Notice your legs, your hips, your stomach.', 'Notice your legs, your hips, the rise and fall of your stomach.'],
  [
    'Notice your chest rising and falling, and your shoulders.',
    'Notice your breath moving your chest, and the weight of your shoulders.',
  ],
  [
    'Notice your arms, your hands, your neck, your face. Just notice — no need to change anything.',
    'Notice your arms, hands, neck, and face — just noticing, nothing to adjust.',
  ],
]

const somaticClosingLines = [
  "Let whatever feeling is already here be enough — no need to manufacture anything. When you're ready, come back to the room.",
  "There's nothing to chase here — just let what's present be enough. Come back to the room whenever you're ready.",
]

const somaticFullMiddleLines = [
  "There's nothing to picture and nothing to get right. Just breath, body, and this quiet intention.",
  "No image required, nothing to get right — just breath, body, and this quiet intention.",
]

const somaticFullClosingLines = [
  'Let whatever feeling is already here be enough — no need to manufacture anything.',
  "Let whatever's already here be enough — nothing to force.",
]

const somaticFinalLines = [
  "Take a few more breaths. When you're ready, let your awareness widen and come back to the room.",
  "A few more slow breaths. When you're ready, widen your awareness and come back to the room.",
]

const sightLines = [
  'Look around. What do you see — the light, the colors, the shapes nearby?',
  'Look around. What catches your eye first — the light, a color, a shape nearby?',
]

const knowingSurroundLines = [
  "Notice what's around you — you don't need to see it, just know it's there.",
  "You don't need to picture what's around you — just sense that it's there."
]

const soundLines = [
  'What do you hear? Any sounds nearby, or further off?',
  'What do you hear — something close by, or further away?',
]

const senseLines = [
  'What do you smell, and what do you feel against your skin — temperature, texture, weight?',
  'What do you feel against your skin — temperature, texture — and what do you smell?',
]

const moveLines = [
  'Now let yourself move through this moment. What do you do next, first person, as this version of you?',
  'Let yourself move through this moment now — first person, as this version of you. What happens next?',
]

const gratitudeLines = [
  'Let a feeling of gratitude, joy, or quiet pride rise up — as if this has already happened. Let it fill your chest. Really feel it.',
  'Let gratitude, joy, or quiet pride rise up — as if this has already happened. Let it fill your chest, and really feel it.',
]

const stayWithFeelingLines = [
  "Stay with that feeling for a few more breaths. When you're ready, let it rest and come back to the room.",
  "Stay with it a little longer. When you're ready, let it settle and come back to the room.",
]

const compactGratitudeLines = [
  "Let a feeling of gratitude or joy rise up, as if this has already happened. Really feel it in your body.",
  "Let gratitude or joy rise up, as if this has already happened — really feel it in your body.",
]

const compactStayLines = [
  "Stay with that feeling. When you're ready, let it rest and come back to the room.",
  "Stay with that feeling a little longer, then let it rest and come back to the room.",
]

/**
 * Builds a sequence of prompts for a visualization session, following the
 * "mental rehearsal" structure: settle the body, enter the scene in first
 * person while static, layer in the senses, then close on an elevated
 * emotion so the moment is felt, not just pictured.
 *
 * "seeing" leans on imagery; "knowing" leans on conceptual/felt understanding
 * and non-visual senses. "somatic" skips imagery and scene-building entirely
 * in favor of breath and a body scan — for people who find visualization
 * itself stressful rather than calming.
 *
 * `seed` fixes which variant is picked for each fixed line, so the same
 * session always reads the same way on re-render, but different sessions
 * (different seeds) vary instead of repeating verbatim every day.
 */
export function generatePrompts(
  goal: Goal,
  mood: Mood,
  style: PromptStyle,
  durationSec = 300,
  seed: string | number = Date.now(),
): string[] {
  const compact = durationSec <= 150
  const rand = createRng(seed)
  const moodOpener = pick(rand, moodOpeners[mood])
  const breathCue = pick(rand, breathCues)
  const bodyScan = bodyScanVariants.map((variants) => pick(rand, variants))

  if (style === 'somatic') {
    const intentionLine = goal.identityNote
      ? `If it helps, let this rest quietly in the back of your mind: ${goal.identityNote}`
      : `Without picturing anything, just let the intention rest in the back of your mind: "${goal.title}". You don't need to do anything with it — just let it be present.`

    if (compact) {
      return [
        moodOpener,
        breathCue,
        bodyScan[2],
        intentionLine,
        pick(rand, somaticClosingLines),
      ]
    }

    return [
      moodOpener,
      breathCue,
      bodyScan[0],
      bodyScan[1],
      bodyScan[2],
      bodyScan[3],
      intentionLine,
      pick(rand, somaticFullMiddleLines),
      pick(rand, somaticFullClosingLines),
      pick(rand, somaticFinalLines),
    ]
  }

  const verb = style === 'seeing' ? 'See' : 'Know'
  const settleVerb = style === 'seeing' ? 'picture' : 'bring to mind'

  const identityLine = goal.identityNote
    ? `${verb === 'See' ? 'See yourself' : 'Hold this knowing'} as this person: ${goal.identityNote}`
    : `${verb} yourself fully arrived at "${goal.title}".`

  if (compact) {
    return [
      moodOpener,
      pick(rand, relaxLines),
      `In first person, ${settleVerb} the moment you already have "${goal.title}". Stay still for a second — what's nearest to you?`,
      identityLine,
      pick(rand, compactGratitudeLines),
      pick(rand, compactStayLines),
    ]
  }

  return [
    moodOpener,
    breathCue,
    pick(rand, relaxLines),
    `Now, in first person, ${settleVerb} the exact moment you already have "${goal.title}". Stay static for now — just notice what's nearest to you, right where you're standing.`,
    style === 'seeing' ? pick(rand, sightLines) : pick(rand, knowingSurroundLines),
    pick(rand, soundLines),
    pick(rand, senseLines),
    identityLine,
    pick(rand, moveLines),
    pick(rand, gratitudeLines),
    pick(rand, stayWithFeelingLines),
  ]
}

export const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'tired', label: 'Tired' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'motivated', label: 'Motivated' },
]
