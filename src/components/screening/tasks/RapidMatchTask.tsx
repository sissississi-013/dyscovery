"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RAPID_ITEMS, RapidItem } from "@/lib/screening/content";
import { speedAccuracyBand, confidenceFromTrials } from "@/lib/screening/scoring";
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

const TRIAL_COUNT = 8;

type Trial = { target: RapidItem; options: RapidItem[] };

function buildTrials(): Trial[] {
  return Array.from({ length: TRIAL_COUNT }).map(() => {
    const target = RAPID_ITEMS[Math.floor(Math.random() * RAPID_ITEMS.length)];
    const distractors = shuffle(RAPID_ITEMS.filter((x) => x.name !== target.name)).slice(0, 2);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export function RapidMatchTask({ onDone }: { onDone: (r: TaskResult) => void }) {
  const trials = useMemo(() => buildTrials(), []);
  const { sfx } = useGameSound();
  const [i, setI] = useState(0);
  const [locked, setLocked] = useState(false);
  const responses = useRef<TaskResponse[]>([]);
  const startedAt = useRef(0);
  const trial = trials[i];

  useEffect(() => {
    startedAt.current = nowMs();
  }, [i]);

  const pick = (name: string) => {
    if (locked) return;
    setLocked(true);
    const correct = name === trial.target.name;
    responses.current.push({
      construct: "rapid_naming",
      taskType: "rapid_match",
      stimulus: trial.target.name,
      response: name,
      correct,
      latencyMs: nowMs() - startedAt.current,
    });
    sfx(correct ? "success" : "error");
    window.setTimeout(() => {
      if (i + 1 >= trials.length) {
        const correctCount = responses.current.filter((r) => r.correct).length;
        const acc = correctCount / responses.current.length;
        const meanLatency =
          responses.current.reduce((s, r) => s + (r.latencyMs ?? 0), 0) /
          responses.current.length;
        const band = speedAccuracyBand(acc, meanLatency);
        const conf = confidenceFromTrials(responses.current.length);
        onDone({
          taskId: "rapid_match",
          responses: responses.current,
          scores: [
            { construct: "rapid_naming", score: band, confidence: conf },
            { construct: "processing_speed", score: band, confidence: conf },
          ],
        });
      } else {
        setI((v) => v + 1);
        setLocked(false);
      }
    }, 250);
  };

  return (
    <div className="space-y-8 text-center">
      <p className="text-sm font-semibold text-muted">
        {i + 1} of {trials.length} · be quick!
      </p>
      <div className="grid place-items-center h-40">
        <span aria-hidden className="text-8xl">
          {trial.target.emoji}
        </span>
      </div>
      <p className="font-semibold">Tap its name as fast as you can:</p>
      <div className="grid grid-cols-3 gap-3">
        {trial.options.map((o) => (
          <button
            key={o.name}
            type="button"
            disabled={locked}
            onClick={() => pick(o.name)}
            className="rounded-[var(--radius-card)] border-2 border-border bg-surface px-3 py-4 text-lg font-bold hover:border-accent disabled:opacity-60"
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}
