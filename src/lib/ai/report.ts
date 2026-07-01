import "server-only";
import { z } from "zod";
import { generateStructured, hasGoogleAI } from "./google";
import { CONSTRUCT_LABELS, Construct, FocusArea } from "@/lib/games/types";
import { bandLabel } from "@/lib/screening/scoring";

export const reportSchema = z.object({
  headline: z.string().min(3).max(90),
  summary: z.string().min(20).max(700),
  strengths: z.array(z.string().min(3).max(180)).min(1).max(3),
  growthAreas: z.array(z.string().min(3).max(180)).min(1).max(3),
  encouragement: z.string().min(10).max(280),
});

export type ScreeningReport = z.infer<typeof reportSchema>;

type ScoreInput = { construct: Construct; score: number };

const SYSTEM = `You write warm, plain-language screening summaries for parents of neurodivergent children.
Rules:
- Strengths-based and encouraging; never use deficit or scary language; never label or diagnose.
- Do NOT invent numbers; only interpret the provided band levels qualitatively.
- Use everyday words a parent understands (avoid jargon).
- Frame growth areas as opportunities, with a hopeful, supportive tone.
- Keep it concise. Output must match the JSON schema exactly.`;

function describe(scores: ScoreInput[]): string {
  return scores
    .map(
      (s) =>
        `- ${CONSTRUCT_LABELS[s.construct]}: ${bandLabel(s.score)} (${Math.round(s.score)}/100)`,
    )
    .join("\n");
}

function fallbackReport(scores: ScoreInput[]): ScreeningReport {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const strengths = sorted
    .filter((s) => bandLabel(s.score) !== "emerging")
    .slice(0, 2)
    .map((s) => `Showing real strength in ${CONSTRUCT_LABELS[s.construct].toLowerCase()}.`);
  const growth = [...sorted]
    .reverse()
    .slice(0, 2)
    .map(
      (s) =>
        `${CONSTRUCT_LABELS[s.construct]} is a great area to grow with playful practice.`,
    );
  return {
    headline: "Here's what we noticed — and it's full of strengths!",
    summary:
      "This quick check-in gives a snapshot of how your child is doing across a few reading- and attention-related skills. It's a screening, not a diagnosis. Use it as a starting point and a way to track growth over time.",
    strengths: strengths.length ? strengths : ["A willingness to try every activity!"],
    growthAreas: growth.length ? growth : ["Keep exploring all the games together."],
    encouragement:
      "Every round of play helps these skills grow. Celebrate the effort, not just the score!",
  };
}

export async function generateReport(
  scores: ScoreInput[],
  ageBand: string,
  focusArea: FocusArea,
): Promise<{ report: ScreeningReport; source: "ai" | "fallback" }> {
  if (hasGoogleAI()) {
    const prompt = [
      `Child age band: ${ageBand}. Focus: ${focusArea}.`,
      `Screening results (qualitative bands):`,
      describe(scores),
      `Write the summary now.`,
    ].join("\n");
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const report = await generateStructured(reportSchema, {
          prompt,
          system: SYSTEM,
          temperature: 0.7,
        });
        return { report, source: "ai" };
      } catch (err) {
        if (attempt === 2) {
          console.warn("[report] AI narration failed, using fallback:", err);
        } else {
          await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
        }
      }
    }
  }
  return { report: fallbackReport(scores), source: "fallback" };
}
