"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PHONEME_ODD_TRIALS } from "@/lib/screening/content";
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

export function PhonemeOddTask({ onDone }: { onDone: (r: TaskResult) => void }) {
  const trials = useMemo(
    () => PHONEME_ODD_TRIALS.map((t) => ({ ...t, options: shuffle(t.options) })),
    [],
  );
  const { narrate, sfx } = useGameSound();
  const [i, setI] = useState(0);
  const [locked, setLocked] = useState(false);
  const responses = useRef<TaskResponse[]>([]);
  const startedAt = useRef(0);
  const trial = trials[i];

  useEffect(() => {
    startedAt.current = nowMs();
    narrate("Which word starts with a different sound?");
  }, [i, narrate]);

  const pick = (optIdx: number) => {
    if (locked) return;
    setLocked(true);
    const opt = trial.options[optIdx];
    const correct = opt.odd;
    responses.current.push({
      construct: "phonological_awareness",
      taskType: "phoneme_odd",
      stimulus: trial.options.map((o) => o.word),
      response: opt.word,
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
          taskId: "phoneme_odd",
          responses: responses.current,
          scores: [
            {
              construct: "phonological_awareness",
              score: accuracyBand(acc),
              confidence: confidenceFromTrials(responses.current.length),
            },
          ],
        });
      } else {
        setI((v) => v + 1);
        setLocked(false);
      }
    }, 650);
  };

  return (
    <div className="space-y-6 text-center">
      <p className="text-sm font-semibold text-muted">
        {i + 1} of {trials.length}
      </p>
      <h3 className="text-2xl font-bold">
        Which one starts with a <em>different</em> sound?
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {trial.options.map((o, idx) => (
          <button
            key={o.word}
            type="button"
            disabled={locked}
            onClick={() => pick(idx)}
            onMouseEnter={() => narrate(o.word)}
            className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border-2 border-border bg-surface p-5 hover:border-accent disabled:opacity-60"
          >
            <span aria-hidden className="text-5xl">
              {o.emoji}
            </span>
            <span className="font-bold">{o.word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
