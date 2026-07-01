import { z } from "zod";
import { CONSTRUCTS } from "./types";

/**
 * Game Blueprints are the contract between the AI "director" and the engine.
 * The AI never returns executable code — only data validated against these
 * schemas. If validation fails, the engine rejects/regenerates, so a broken or
 * unsafe game can never reach a child.
 */

export const MECHANIC_IDS = ["phoneme_match", "go_no_go", "memory_span"] as const;
export type MechanicId = (typeof MECHANIC_IDS)[number];

const item = z.object({
  label: z.string().min(1).max(24),
  emoji: z.string().min(1).max(8),
});

/* ----- per-mechanic content -------------------------------------------- */

export const phonemeMatchContent = z.object({
  rounds: z
    .array(
      z.object({
        // Spoken prompt, e.g. "Which word starts with the /b/ sound?"
        instruction: z.string().min(3).max(120),
        targetPhoneme: z.string().min(1).max(12),
        options: z
          .array(
            z.object({
              word: z.string().min(1).max(20),
              emoji: z.string().min(1).max(8),
              correct: z.boolean(),
            }),
          )
          .min(2)
          .max(4),
      }),
    )
    .min(3)
    .max(8),
});

export const goNoGoContent = z.object({
  instruction: z.string().min(3).max(160),
  goLabel: z.string().min(1).max(40),
  noGoLabel: z.string().min(1).max(40),
  goItems: z.array(item).min(2).max(6),
  noGoItems: z.array(item).min(2).max(6),
});

export const memorySpanContent = z.object({
  instruction: z.string().min(3).max(160),
  items: z.array(item).min(4).max(9),
});

export const CONTENT_SCHEMAS = {
  phoneme_match: phonemeMatchContent,
  go_no_go: goNoGoContent,
  memory_span: memorySpanContent,
} as const;

/* ----- creative payload the AI returns (per mechanic) ------------------ */

export function generationSchema(mechanic: MechanicId) {
  return z.object({
    title: z.string().min(2).max(60),
    theme: z.string().min(2).max(40),
    introNarration: z.string().min(5).max(240),
    content: CONTENT_SCHEMAS[mechanic],
  });
}

/* ----- full assembled, validated blueprint ----------------------------- */

const blueprintBase = {
  targetConstruct: z.enum(CONSTRUCTS),
  difficulty: z.number().int().min(1).max(5),
  title: z.string(),
  theme: z.string(),
  introNarration: z.string(),
};

export const blueprintSchema = z.discriminatedUnion("mechanic", [
  z.object({ mechanic: z.literal("phoneme_match"), content: phonemeMatchContent, ...blueprintBase }),
  z.object({ mechanic: z.literal("go_no_go"), content: goNoGoContent, ...blueprintBase }),
  z.object({ mechanic: z.literal("memory_span"), content: memorySpanContent, ...blueprintBase }),
]);

export type GameBlueprint = z.infer<typeof blueprintSchema>;
export type PhonemeMatchBlueprint = Extract<GameBlueprint, { mechanic: "phoneme_match" }>;
export type GoNoGoBlueprint = Extract<GameBlueprint, { mechanic: "go_no_go" }>;
export type MemorySpanBlueprint = Extract<GameBlueprint, { mechanic: "memory_span" }>;
