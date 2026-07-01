"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GO_NO_GO_CONTENT } from "@/lib/screening/content";
import { accuracyBand, confidenceFromTrials } from "@/lib/screening/scoring";
import { TaskResult, TaskResponse } from "@/lib/screening/types";
import { useGameSound } from "@/components/games/useGameSound";

const TRIALS = 16;
const NO_GO_RATIO = 0.3;
const STIMULUS_MS = 1100;
const ISI_MS = 650;

type Trial = { emoji: string; label: string; isGo: boolean };

function buildTrials(): Trial[] {
  const { goItems, noGoItems } = GO_NO_GO_CONTENT;
  return Array.from({ length: TRIALS }).map(() => {
    const isGo = Math.random() > NO_GO_RATIO;
    const pool = isGo ? goItems : noGoItems;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { emoji: pick.emoji, label: pick.label, isGo };
  });
}

export function GoNoGoTask({ onDone }: { onDone: (r: TaskResult) => void }) {
  const trials = useMemo(() => buildTrials(), []);
  const { sfx } = useGameSound();
  const [idx, setIdx] = useState(-1);
  const [showing, setShowing] = useState(false);

  const respondedRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const responsesRef = useRef<TaskResponse[]>([]);
  const statsRef = useRef({ hits: 0, correctRejections: 0, misses: 0, falseAlarms: 0 });
  const [stats, setStats] = useState({ hits: 0, correctRejections: 0, misses: 0, falseAlarms: 0 });
  const sync = () => setStats({ ...statsRef.current });

  const current = idx >= 0 ? trials[idx] : null;

  useEffect(() => {
    const run = (i: number) => {
      respondedRef.current = false;
      setIdx(i);
      setShowing(true);
      timerRef.current = window.setTimeout(() => {
        const trial = trials[i];
        if (!respondedRef.current) {
          if (trial.isGo) statsRef.current.misses++;
          else statsRef.current.correctRejections++;
          responsesRef.current.push({
            construct: "response_inhibition",
            taskType: "go_no_go",
            stimulus: trial.label,
            response: "no_tap",
            correct: !trial.isGo,
          });
          sync();
        }
        setShowing(false);
        timerRef.current = window.setTimeout(() => {
          if (i + 1 >= trials.length) {
            const s = statsRef.current;
            const correct = s.hits + s.correctRejections;
            const acc = correct / trials.length;
            const conf = confidenceFromTrials(trials.length);
            onDone({
              taskId: "go_no_go",
              responses: responsesRef.current,
              scores: [
                { construct: "response_inhibition", score: accuracyBand(acc), confidence: conf },
                { construct: "sustained_attention", score: accuracyBand(acc), confidence: conf },
              ],
            });
          } else {
            run(i + 1);
          }
        }, ISI_MS);
      }, STIMULUS_MS);
    };
    const kick = window.setTimeout(() => run(0), 500);
    return () => {
      window.clearTimeout(kick);
      window.clearTimeout(timerRef.current);
    };
  }, [trials, onDone]);

  const respond = () => {
    if (!showing || respondedRef.current || !current) return;
    respondedRef.current = true;
    if (current.isGo) {
      statsRef.current.hits++;
      sfx("success");
    } else {
      statsRef.current.falseAlarms++;
      sfx("error");
    }
    responsesRef.current.push({
      construct: "response_inhibition",
      taskType: "go_no_go",
      stimulus: current.label,
      response: "tap",
      correct: current.isGo,
    });
    sync();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showing, current]);

  return (
    <div className="space-y-6 text-center">
      <p className="font-semibold">
        Tap for <span className="text-success">{GO_NO_GO_CONTENT.goLabel}</span>,
        hold for <span className="text-danger">{GO_NO_GO_CONTENT.noGoLabel}</span>.
      </p>
      <div className="mx-auto grid place-items-center h-48 w-full max-w-sm rounded-[var(--radius-card)] border-2 border-border bg-surface">
        {showing && current ? (
          <div className="flex flex-col items-center gap-1">
            <span aria-hidden className="text-7xl">
              {current.emoji}
            </span>
            <span className={current.isGo ? "text-success font-bold" : "text-danger font-bold"}>
              {current.isGo ? "Tap!" : "Hold!"}
            </span>
          </div>
        ) : (
          <span className="text-muted">…</span>
        )}
      </div>
      <button
        type="button"
        onClick={respond}
        className="w-full max-w-sm mx-auto rounded-full bg-accent text-accent-fg px-8 py-5 text-2xl font-extrabold active:scale-95"
      >
        TAP
      </button>
      <p className="text-sm text-muted">
        Hits {stats.hits} · Held {stats.correctRejections} · Slips {stats.falseAlarms}
      </p>
    </div>
  );
}
