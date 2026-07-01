"use client";

import { useEffect, useRef, useState } from "react";
import { SPAN_ITEMS } from "@/lib/screening/content";
import { spanBand, confidenceFromTrials } from "@/lib/screening/scoring";
import { TaskResult, TaskResponse } from "@/lib/screening/types";
import { useGameSound } from "@/components/games/useGameSound";

type Phase = "present" | "recall" | "feedback";
const MAX_ROUNDS = 6;
const START_SPAN = 2;

function randomSeq(len: number): number[] {
  return Array.from({ length: len }).map(() =>
    Math.floor(Math.random() * SPAN_ITEMS.length),
  );
}

export function SpanTask({ onDone }: { onDone: (r: TaskResult) => void }) {
  const { sfx, narrate } = useGameSound();
  const [phase, setPhase] = useState<Phase>("present");
  const [span, setSpan] = useState(START_SPAN);
  const [sequence, setSequence] = useState<number[]>([]);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [recallPos, setRecallPos] = useState(0);
  const [message, setMessage] = useState("Watch the trail…");
  const [roundNum, setRoundNum] = useState(1);

  const maxSpanRef = useRef(0);
  const consecFailRef = useRef(0);
  const roundsRef = useRef(0);
  const responsesRef = useRef<TaskResponse[]>([]);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    after(300, () => {
      setMessage("Watch the trail…");
      setSequence(randomSeq(START_SPAN));
      setPhase("present");
    });
    return clearTimers;
  }, []);

  useEffect(() => {
    if (phase !== "present" || sequence.length === 0) return;
    let idx = 0;
    const step = () => {
      if (idx >= sequence.length) {
        setHighlight(null);
        after(350, () => {
          setRecallPos(0);
          setMessage("Now repeat the trail!");
          setPhase("recall");
        });
        return;
      }
      const itemIdx = sequence[idx];
      setHighlight(itemIdx);
      narrate(SPAN_ITEMS[itemIdx].name);
      sfx("tick");
      after(900, () => {
        setHighlight(null);
        idx++;
        after(220, step);
      });
    };
    after(450, step);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence]);

  const endRound = (success: boolean) => {
    setPhase("feedback");
    roundsRef.current += 1;
    responsesRef.current.push({
      construct: "verbal_working_memory",
      taskType: "span",
      stimulus: sequence.length,
      response: success ? "recalled" : "missed",
      correct: success,
    });
    let nextSpan = span;
    if (success) {
      maxSpanRef.current = Math.max(maxSpanRef.current, span);
      consecFailRef.current = 0;
      nextSpan = span + 1;
      sfx("cheer");
      setMessage("Perfect! ⭐");
    } else {
      consecFailRef.current += 1;
      nextSpan = Math.max(START_SPAN, span - 1);
      sfx("error");
      setMessage("Tricky one!");
    }

    const stop = roundsRef.current >= MAX_ROUNDS || consecFailRef.current >= 2;
    after(1100, () => {
      if (stop) {
        onDone({
          taskId: "span",
          responses: responsesRef.current,
          scores: [
            {
              construct: "verbal_working_memory",
              score: spanBand(maxSpanRef.current),
              confidence: confidenceFromTrials(roundsRef.current * 2),
            },
          ],
        });
        return;
      }
      setRoundNum(roundsRef.current + 1);
      setMessage("Watch the trail…");
      setSpan(nextSpan);
      setSequence(randomSeq(nextSpan));
      setRecallPos(0);
      setPhase("present");
    });
  };

  const tap = (idx: number) => {
    if (phase !== "recall") return;
    if (idx === sequence[recallPos]) {
      sfx("tick");
      const next = recallPos + 1;
      if (next >= sequence.length) endRound(true);
      else setRecallPos(next);
    } else {
      endRound(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-between text-sm font-semibold text-muted">
        <span>Round {Math.min(roundNum, MAX_ROUNDS)}</span>
        <span>Length {span}</span>
      </div>
      <p aria-live="polite" className="text-xl font-bold min-h-7">
        {message}
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {SPAN_ITEMS.map((it, idx) => (
          <button
            key={it.name}
            type="button"
            disabled={phase !== "recall"}
            onClick={() => tap(idx)}
            className={`flex flex-col items-center gap-1 rounded-[var(--radius-card)] border-2 p-4 ${
              highlight === idx
                ? "border-accent bg-[var(--accent-soft)] scale-105"
                : "border-border bg-surface"
            }`}
          >
            <span aria-hidden className="text-4xl">
              {it.emoji}
            </span>
            <span className="text-sm font-semibold">{it.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
