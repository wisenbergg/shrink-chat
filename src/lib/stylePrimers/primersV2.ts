/**
 * primersV2.ts – Strategic probe templates for Stillwater
 * -------------------------------------------------------
 * Each probe invites the user to deeper insight (laddering why,
 * schema naming, CBT mapping) instead of plain mirroring.
 *
 * Lenses covered in v0.1: anger, guilt, neutral‑pause.
 * Add more lenses by extending the map below.
 */

export type ToneTag =
  | 'neutral'
  | 'apologetic'
  | 'angry'
  | 'affectionate'
  | 'defensive'
  | 'guilty'
  | 'supportive'
  | 'reflective'
  | 'hopeful'
  | 'fearful'
  | 'disgusted'
  | 'dismissive';

export interface StrategicProbeMap {
  [lens: string]: {
    [tone in ToneTag]?: string[];
  };
}

/* ---- Strategic probes --------------------------------------------------- */

const probes: StrategicProbeMap = {
  anger: {
    angry: [
      "When you picture that anger as a voice in the room, what is it trying to protect?",
      "If the anger had a deeper feeling beneath it, what might that be?",
      "What would justice look like in this situation—concretely?"
    ],
    defensive: [
      "I sense you’re guarding something important—what would feel at risk if you lowered the shield for a moment?",
      "Who taught you that anger was the safest armor?",
      "If someone you trust repeated your story back to you, which part would make you tense up?"
    ],
    neutral: [
      "Shall we map out the automatic thought → emotion → action loop for this anger?",
      "If you paused the scene right before anger hits, what physical cue shows up first?",
      "Imagine the anger levels on a dial 0‑10—where are you now, and what nudges it down one click?"
    ]
  },

  guilt: {
    guilty: [
      "What’s the underlying ‘should’ statement that fuels this guilt?",
      "If you spoke to yourself with the same empathy you’d offer a friend, what might you say?",
      "How does carrying this guilt serve you—or does it?"
    ],
    apologetic: [
      "You’re already apologizing inwardly—what reparative action would move it forward outwardly?",
      "What evidence would convince you that forgiveness is allowed here?",
      "Which part of the guilt feels deserved, and which part feels inherited from someone else?"
    ],
    neutral: [
      "Let’s run a quick CBT thought record: trigger, thought, feeling, behavior—want to try?",
      "How old does this guilt feel—does it echo an earlier time?",
      "If guilt were a color or texture, what would you see?"
    ]
  },

  neutral: {
    neutral: [
      "What’s the most alive thread on your mind in this moment?",
      "Imagine we have a wide‑angle lens—what bigger context might help right now?",
      "Where in your life do you feel momentum, and where do you feel stuck?"
    ],
    reflective: [
      "What insight is hovering just outside of words as you pause?",
      "If you wrote a headline for this chapter of your life, what would it be?",
      "What’s a question you wish I’d ask right now?"
    ]
  }
};

/* ---- Public API --------------------------------------------------------- */

/**
 * chooseStrategicProbe
 * --------------------
 * Selects a probe by lens and dominant tone tag.
 * Falls back gracefully if no exact match:
 *   1. Same lens, 'neutral' tone
 *   2. Global neutral probe
 *   3. Empty string (caller decides fallback)
 */
export function chooseStrategicProbe(
  lens: string,
  toneTags: ToneTag[],
  rng: () => number = Math.random
): string {
  const tone = toneTags[0] as ToneTag | undefined; // assume first tag is most salient
  const lensProbes = probes[lens];
  if (lensProbes) {
    const candidates =
      (tone && lensProbes[tone]) ||
      lensProbes.neutral ||
      probes.neutral.neutral;
    if (candidates && candidates.length) {
      return candidates[Math.floor(rng() * candidates.length)];
    }
  }
  return '';
}
