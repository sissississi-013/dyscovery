import "server-only";
import {
  GameBlueprint,
  MechanicId,
  blueprintSchema,
  generationSchema,
} from "./blueprint";
import { MECHANICS, difficultyParams } from "./mechanics";
import { fallbackGeneration } from "./fallback";
import { DEFAULT_MODEL, generateStructured, hasGoogleAI } from "@/lib/ai/google";
import { Construct, MAX_DIFFICULTY, MIN_DIFFICULTY } from "./types";

/** Models tried in order; the lighter model is a backup when the primary is busy. */
const MODELS = [DEFAULT_MODEL, "gemini-2.5-flash-lite"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type DirectorRequest = {
  mechanic: MechanicId;
  targetConstruct: Construct;
  difficulty: number;
  ageBand: string;
  /** Optional theme hint from the child's profile (e.g. "dinosaurs"). */
  themeHint?: string;
};

export type DirectorResult = {
  blueprint: GameBlueprint;
  source: "ai" | "fallback";
};

const SYSTEM = `You are the Game Director for Dyscovery, a cognitive-training playground for neurodivergent children (dyslexia and ADHD).
Your job is to generate CONTENT for an existing, fixed game mechanic — never code, never new rules.
Hard requirements:
- Age-appropriate, warm, encouraging, and inclusive. No scary, violent, or sad themes.
- Use simple, concrete, picturable words a child of the given age knows.
- Every emoji must clearly match its label.
- Follow the exact JSON schema you are given. Do not add commentary.
- For sound/phoneme tasks, be phonetically accurate: a word "starts with" a sound only if its first spoken phoneme matches.`;

function buildPrompt(req: DirectorRequest): string {
  const m = MECHANICS[req.mechanic];
  const params = difficultyParams(req.mechanic, req.difficulty);
  return [
    `Mechanic: ${m.title} (${m.id}).`,
    `What it trains: ${m.construct}.`,
    `Mechanic content guidance: ${m.promptHint}`,
    `Target child age band: ${req.ageBand} years.`,
    `Difficulty: ${req.difficulty} of ${MAX_DIFFICULTY} (1 = easiest).`,
    `Tuning params (for sizing the content): ${JSON.stringify(params)}.`,
    req.themeHint ? `Preferred theme if it fits: ${req.themeHint}.` : "",
    `Generate a fresh, fun, themed instance now.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function clampDifficulty(d: number): number {
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Math.round(d)));
}

/**
 * Produce a validated, ready-to-render Game Blueprint. Tries Gemini with
 * schema-constrained output (with retries); on any failure, falls back to the
 * deterministic generator so the engine never blocks on the model.
 */
export async function generateBlueprint(
  req: DirectorRequest,
): Promise<DirectorResult> {
  const difficulty = clampDifficulty(req.difficulty);
  const genSchema = generationSchema(req.mechanic);

  if (hasGoogleAI()) {
    const prompt = buildPrompt({ ...req, difficulty });
    const maxAttempts = 4;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Alternate to the backup model on later attempts.
      const model = MODELS[Math.min(attempt, MODELS.length - 1)];
      try {
        const gen = await generateStructured(genSchema, {
          prompt,
          system: SYSTEM,
          model,
        });
        const blueprint = blueprintSchema.parse({
          mechanic: req.mechanic,
          targetConstruct: req.targetConstruct,
          difficulty,
          ...gen,
        });
        return { blueprint, source: "ai" };
      } catch (err) {
        const last = attempt === maxAttempts - 1;
        if (last) {
          console.warn("[director] AI generation failed, using fallback:", err);
        } else {
          // Exponential backoff helps with transient 503/429 demand spikes.
          await sleep(400 * 2 ** attempt);
        }
      }
    }
  }

  const gen = fallbackGeneration(req.mechanic, difficulty);
  const blueprint = blueprintSchema.parse({
    mechanic: req.mechanic,
    targetConstruct: req.targetConstruct,
    difficulty,
    ...gen,
  });
  return { blueprint, source: "fallback" };
}
