import { MechanicId } from "./blueprint";
import { Construct } from "./types";

export type MechanicMeta = {
  id: MechanicId;
  title: string;
  blurb: string;
  emoji: string;
  /** Primary construct this mechanic trains. */
  construct: Construct;
  /** Other constructs it also exercises. */
  alsoTrains: Construct[];
  /** Guidance injected into the AI prompt to shape generated content. */
  promptHint: string;
};

export const MECHANICS: Record<MechanicId, MechanicMeta> = {
  phoneme_match: {
    id: "phoneme_match",
    title: "Sound Match",
    blurb: "Listen, then pick the word that starts with the matching sound.",
    emoji: "🔤",
    construct: "phonological_awareness",
    alsoTrains: ["decoding", "phonological_working_memory"],
    promptHint:
      "Create rounds where the child hears a target sound (a single phoneme) and picks the option word that STARTS with that phoneme. Each round has exactly one correct option and 2-3 plausible distractors that start with different sounds. Use concrete, picturable nouns a child knows, each with a fitting emoji. Keep words short and common.",
  },
  go_no_go: {
    id: "go_no_go",
    title: "Catch & Hold",
    blurb: "Tap the good characters fast — but hold still for the trap ones!",
    emoji: "⚡",
    construct: "response_inhibition",
    alsoTrains: ["sustained_attention", "selective_attention", "processing_speed"],
    promptHint:
      "Pick a fun theme with two clearly different groups: a 'go' group the child should tap and a 'no-go' group the child must NOT tap (to practice self-control). Provide a few friendly, picturable items per group, each with an emoji. Make the two groups easy to tell apart by category, not by color alone.",
  },
  memory_span: {
    id: "memory_span",
    title: "Remember the Path",
    blurb: "Watch and listen to the sequence, then repeat it in order.",
    emoji: "🧠",
    construct: "verbal_working_memory",
    alsoTrains: ["phonological_working_memory", "sustained_attention"],
    promptHint:
      "Pick a playful theme and provide a pool of distinct, picturable items (each with a label and emoji) that will be shown one at a time in a growing sequence for the child to repeat. Items should be easy to name and visually distinct from each other.",
  },
};

export const MECHANICS_LIST = Object.values(MECHANICS);

export function mechanicsForConstruct(construct: Construct): MechanicMeta[] {
  return MECHANICS_LIST.filter(
    (m) => m.construct === construct || m.alsoTrains.includes(construct),
  );
}

/**
 * Difficulty (1-5) → concrete gameplay parameters, interpreted by the mechanic
 * components. Centralized here so adaptive difficulty has one source of truth.
 */
export function difficultyParams(mechanic: MechanicId, difficulty: number) {
  const d = Math.min(5, Math.max(1, Math.round(difficulty)));
  switch (mechanic) {
    case "phoneme_match":
      // More options + shorter listen window as difficulty rises.
      return { optionCount: Math.min(4, 1 + d), rounds: 4 + d };
    case "go_no_go":
      // Faster stimuli + more no-go trials (harder inhibition) as it rises.
      return {
        stimulusMs: 1400 - d * 150, // 1250 -> 650ms on screen
        interStimulusMs: 900 - d * 80,
        trials: 12 + d * 2,
        noGoRatio: 0.25 + d * 0.05,
      };
    case "memory_span":
      // Longer starting span + faster presentation as it rises.
      return { startSpan: 2 + Math.floor(d / 2), presentMs: 1100 - d * 120, rounds: 4 };
    default:
      return {};
  }
}
