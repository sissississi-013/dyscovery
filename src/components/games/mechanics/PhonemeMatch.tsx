"use client";

import { useCallback, useEffect, useState } from "react";
import { PhonemeMatchBlueprint } from "@/lib/games/blueprint";
import { useGameSound } from "../useGameSound";
import { MechanicResult } from "../result";

type Props = {
  blueprint: PhonemeMatchBlueprint;
  onComplete: (r: MechanicResult) => void;
};

export function PhonemeMatch({ blueprint, onComplete }: Props) {
  const rounds = blueprint.content.rounds;
  const { sfx, narrate } = useGameSound();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const round = rounds[index];

  // Narrate the prompt whenever a new round appears.
  useEffect(() => {
    if (round) narrate(round.instruction);
  }, [round, narrate]);

  const handlePick = useCallback(
    (optionIdx: number) => {
      if (locked) return;
      setLocked(true);
      setPicked(optionIdx);
      const isCorrect = round.options[optionIdx].correct;
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        sfx("success");
        narrate("Yes! Great listening.");
      } else {
        sfx("error");
        narrate("Good try. Listen again next time.");
      }
      window.setTimeout(() => {
        if (index + 1 >= rounds.length) {
          const correct = correctCount + (isCorrect ? 1 : 0);
          onComplete({
            correct,
            total: rounds.length,
            accuracy: correct / rounds.length,
            score: Math.round((correct / rounds.length) * 100),
          });
        } else {
          setIndex((i) => i + 1);
          setPicked(null);
          setLocked(false);
        }
      }, 1100);
    },
    [locked, round, sfx, narrate, index, rounds.length, correctCount, onComplete],
  );

  if (!round) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted">
          Round {index + 1} of {rounds.length}
        </p>
        <button
          type="button"
          onClick={() => narrate(round.instruction)}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          🔊 Hear it again
        </button>
      </div>

      <p className="text-2xl sm:text-3xl font-bold text-center text-balance">
        {round.instruction}
      </p>

      <div
        role="group"
        aria-label="Answer choices"
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {round.options.map((opt, i) => {
          const isPicked = picked === i;
          const state =
            picked === null
              ? "idle"
              : opt.correct
                ? "correct"
                : isPicked
                  ? "wrong"
                  : "dim";
          return (
            <button
              key={`${opt.word}-${i}`}
              type="button"
              disabled={locked}
              onClick={() => handlePick(i)}
              aria-label={opt.word}
              className={[
                "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 p-6 transition-colors",
                state === "idle" && "border-border bg-surface hover:border-accent",
                state === "correct" && "border-success bg-[var(--accent-soft)]",
                state === "wrong" && "border-danger bg-surface",
                state === "dim" && "border-border bg-surface opacity-50",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span aria-hidden className="text-6xl">
                {opt.emoji}
              </span>
              <span className="text-lg font-bold">{opt.word}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
