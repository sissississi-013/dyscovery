"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WORD_NONWORD_TRIALS } from "@/lib/screening/content";
import { accuracyBand, confidenceFromTrials } from "@/lib/screening/scoring";
import { TaskResult, TaskResponse } from "@/lib/screening/types";
import { useGameSound } from "@/components/games/useGameSound";
import { nowMs } from "@/lib/util/clock";

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function WordNonwordTask({ onDone }: { onDone: (r: TaskResult) => void }) {
  const trials = useMemo(() => shuffle(WORD_NONWORD_TRIALS), []);
  const { sfx } = useGameSound();
  const [i, setI] = useState(0);
  const [locked, setLocked] = useState(false);
  const responses = useRef<TaskResponse[]>([]);
  const startedAt = useRef(0);
  const trial = trials[i];

  useEffect(() => {
    startedAt.current = nowMs();
  }, [i]);

  const answer = (saidReal: boolean) => {
    if (locked) return;
    setLocked(true);
    const correct = saidReal === trial.isReal;
    responses.current.push({
      construct: "decoding",
      taskType: "word_nonword",
      stimulus: trial.text,
      response: saidReal ? "real" : "made-up",
      correct,
      latencyMs: nowMs() - startedAt.current,
    });
    sfx(correct ? "success" : "error");
    window.setTimeout(() => {
      if (i + 1 >= trials.length) {
        const acc =
          responses.current.filter((r) => r.correct).length /
          responses.current.length;
        onDone({
          taskId: "word_nonword",
          responses: responses.current,
          scores: [
            {
              construct: "decoding",
              score: accuracyBand(acc),
              confidence: confidenceFromTrials(responses.current.length),
            },
          ],
        });
      } else {
        setI((v) => v + 1);
        setLocked(false);
      }
    }, 450);
  };

  return (
    <div className="space-y-8 text-center">
      <p className="text-sm font-semibold text-muted">
        {i + 1} of {trials.length}
      </p>
      <div className="grid place-items-center h-40 rounded-[var(--radius-card)] border-2 border-border bg-surface">
        <span className="text-5xl font-extrabold tracking-wide">{trial.text}</span>
      </div>
      <div className="flex justify-center gap-4">
        <button
          type="button"
          disabled={locked}
          onClick={() => answer(true)}
          className="rounded-full bg-success text-white px-8 py-4 text-lg font-bold disabled:opacity-60"
        >
          ✓ Real word
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => answer(false)}
          className="rounded-full bg-secondary text-white px-8 py-4 text-lg font-bold disabled:opacity-60"
        >
          ✦ Made-up
        </button>
      </div>
    </div>
  );
}
