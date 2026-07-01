/**
 * Cognitive constructs Dyscovery trains. These mirror the `construct` DB enum
 * but are duplicated here as plain values so client/edge code can import them
 * without pulling in the database driver.
 */
export const CONSTRUCTS = [
  "phonological_awareness",
  "rapid_naming",
  "phonological_working_memory",
  "verbal_working_memory",
  "sustained_attention",
  "selective_attention",
  "response_inhibition",
  "processing_speed",
  "decoding",
] as const;

export type Construct = (typeof CONSTRUCTS)[number];

export const CONSTRUCT_LABELS: Record<Construct, string> = {
  phonological_awareness: "Sound awareness",
  rapid_naming: "Naming speed",
  phonological_working_memory: "Sound memory",
  verbal_working_memory: "Working memory",
  sustained_attention: "Staying focused",
  selective_attention: "Filtering distractions",
  response_inhibition: "Self-control",
  processing_speed: "Quick thinking",
  decoding: "Word reading",
};

export const FOCUS_AREAS = ["dyslexia", "adhd", "general"] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

export const AGE_BANDS = ["6-7", "8-9", "10-12"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

/** Difficulty is a 1-5 integer the mechanics interpret into concrete params. */
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;
