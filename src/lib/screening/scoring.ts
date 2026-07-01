import { Construct } from "@/lib/games/types";
import { TaskResult, TaskScore } from "./types";

/**
 * Deterministic scoring. Converts raw task metrics into 0-100 construct bands.
 * The AI never scores — it only narrates the numbers produced here.
 *
 * NOTE: these are heuristic developmental bands for a screening, not normed
 * standard scores. Real norming requires a referenced sample (future work).
 */

export const clamp = (n: number, lo = 0, hi = 100) =>
  Math.min(hi, Math.max(lo, n));

/** Accuracy (0-1) → band, with a floor so chance performance isn't a 0. */
export function accuracyBand(accuracy: number): number {
  return clamp(Math.round(accuracy * 100));
}

/**
 * Combine accuracy with speed. Faster correct responses score higher.
 * idealMs = latency that earns full speed credit; slowMs = little credit.
 */
export function speedAccuracyBand(
  accuracy: number,
  meanLatencyMs: number,
  idealMs = 1200,
  slowMs = 4000,
): number {
  const acc = clamp(accuracy * 100);
  const speedFrac = clamp(
    (slowMs - meanLatencyMs) / (slowMs - idealMs),
    0,
    1,
  );
  // 70% accuracy, 30% speed.
  return clamp(Math.round(acc * 0.7 + speedFrac * 100 * 0.3));
}

/** Max sequence length recalled → band. */
export function spanBand(maxSpan: number): number {
  const map: Record<number, number> = { 0: 5, 1: 20, 2: 35, 3: 55, 4: 72, 5: 86, 6: 95 };
  return map[Math.min(6, Math.max(0, maxSpan))] ?? 95;
}

/** Confidence grows with the number of trials (caps at ~12 trials). */
export function confidenceFromTrials(trials: number): number {
  return clamp(Math.round((Math.min(trials, 12) / 12) * 100)) / 100;
}

/**
 * Merge per-task scores into one Reference Profile. When several tasks measure
 * the same construct, combine as a confidence-weighted average.
 */
export function mergeProfile(results: TaskResult[]): TaskScore[] {
  const byConstruct = new Map<Construct, { wSum: number; wcSum: number; cSum: number; n: number }>();
  for (const r of results) {
    for (const s of r.scores) {
      const prev = byConstruct.get(s.construct) ?? {
        wSum: 0,
        wcSum: 0,
        cSum: 0,
        n: 0,
      };
      const w = Math.max(0.05, s.confidence);
      prev.wSum += w;
      prev.wcSum += w * s.score;
      prev.cSum += s.confidence;
      prev.n += 1;
      byConstruct.set(s.construct, prev);
    }
  }
  const out: TaskScore[] = [];
  for (const [construct, agg] of byConstruct) {
    out.push({
      construct,
      score: clamp(Math.round(agg.wcSum / agg.wSum)),
      confidence: Math.round((agg.cSum / agg.n) * 100) / 100,
    });
  }
  return out;
}

/** Plain-language band label for a 0-100 score (kid/caregiver friendly). */
export function bandLabel(score: number): "emerging" | "developing" | "strong" {
  if (score >= 70) return "strong";
  if (score >= 45) return "developing";
  return "emerging";
}
