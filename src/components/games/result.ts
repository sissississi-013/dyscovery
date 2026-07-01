/** Outcome a mechanic reports back to the GameHost when a round set ends. */
export type MechanicResult = {
  /** 0-100 game score (used for the kid-facing number / stars). */
  score: number;
  /** 0-1 accuracy, used for adaptive difficulty. */
  accuracy: number;
  correct: number;
  total: number;
};

export function starsFor(accuracy: number): number {
  if (accuracy >= 0.85) return 3;
  if (accuracy >= 0.6) return 2;
  if (accuracy >= 0.35) return 1;
  return 0;
}
