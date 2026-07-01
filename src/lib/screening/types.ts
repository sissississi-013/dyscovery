import { Construct, FocusArea } from "@/lib/games/types";

export const SCREENING_TASK_IDS = [
  "phoneme_odd",
  "word_nonword",
  "rapid_match",
  "span",
  "go_no_go",
] as const;
export type ScreeningTaskId = (typeof SCREENING_TASK_IDS)[number];

export type TaskResponse = {
  construct: Construct;
  taskType: string;
  stimulus?: unknown;
  response?: unknown;
  correct?: boolean;
  latencyMs?: number;
};

export type TaskScore = {
  construct: Construct;
  score: number; // 0-100 band
  confidence: number; // 0-1
};

export type TaskResult = {
  taskId: ScreeningTaskId;
  scores: TaskScore[];
  responses: TaskResponse[];
};

export type TaskMeta = {
  id: ScreeningTaskId;
  title: string;
  blurb: string;
  emoji: string;
  constructs: Construct[];
};

export const TASK_META: Record<ScreeningTaskId, TaskMeta> = {
  phoneme_odd: {
    id: "phoneme_odd",
    title: "Odd Sound Out",
    blurb: "Find the word that begins with a different sound.",
    emoji: "👂",
    constructs: ["phonological_awareness"],
  },
  word_nonword: {
    id: "word_nonword",
    title: "Real or Made-Up?",
    blurb: "Decide if each one is a real word or a made-up word.",
    emoji: "📖",
    constructs: ["decoding"],
  },
  rapid_match: {
    id: "rapid_match",
    title: "Quick Name",
    blurb: "Name each picture as fast as you can.",
    emoji: "⏱️",
    constructs: ["rapid_naming", "processing_speed"],
  },
  span: {
    id: "span",
    title: "Memory Trail",
    blurb: "Remember the growing sequence.",
    emoji: "🧠",
    constructs: ["verbal_working_memory"],
  },
  go_no_go: {
    id: "go_no_go",
    title: "Go & Stop",
    blurb: "Tap the targets, hold still for the rest.",
    emoji: "🚦",
    constructs: ["response_inhibition", "sustained_attention"],
  },
};

/** Which tasks run for a given focus area. */
export const BATTERIES: Record<FocusArea, ScreeningTaskId[]> = {
  dyslexia: ["phoneme_odd", "word_nonword", "rapid_match", "span"],
  adhd: ["go_no_go", "span", "rapid_match"],
  general: ["phoneme_odd", "word_nonword", "rapid_match", "span", "go_no_go"],
};
