"use client";

import { useEffect, useRef, useState } from "react";
import { MemorySpanBlueprint } from "@/lib/games/blueprint";
import { difficultyParams } from "@/lib/games/mechanics";
import { useGameSound } from "../useGameSound";
import { MechanicResult } from "../result";

type Props = {
  blueprint: MemorySpanBlueprint;
  onComplete: (r: MechanicResult) => void;
};

type Phase = "present" | "recall" | "feedback";

function randomSequence(len: number, poolSize: number): number[] {
  return Array.from({ length: len }).map(() =>
    Math.floor(Math.random() * poolSize),
  );
}

export function MemorySpan({ blueprint, onComplete }: Props) {
  const items = blueprint.content.items;
  const params = difficultyParams("memory_span", blueprint.difficulty) as {
    startSpan: number;
    presentMs: number;
    rounds: number;
  };
  const { sfx, narrate } = useGameSound();

  const [phase, setPhase] = useState<Phase>("present");
  const [span, setSpan] = useState(params.startSpan);
  const [sequence, setSequence] = useState<number[]>([]);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [recallPos, setRecallPos] = useState(0);
  const [message, setMessage] = useState("Watch closely…");
  const [roundNum, setRoundNum] = useState(1);

  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const maxSpanRef = useRef(params.startSpan);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    const t = window.setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  // Kick off the first round once, on mount (via timeout, not synchronously).
  useEffect(() => {
    const t = window.setTimeout(() => {
      setMessage("Watch and listen…");
      setSequence(randomSequence(params.startSpan, items.length));
      setPhase("present");
    }, 300);
    timersRef.current.push(t);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presentation scheduler.
  useEffect(() => {
    if (phase !== "present" || sequence.length === 0) return;
    let i = 0;
    const step = () => {
      if (i >= sequence.length) {
        setHighlight(null);
        after(350, () => {
          setRecallPos(0);
          setPhase("recall");
          setMessage("Now you! Tap them in order.");
        });
        return;
      }
      const idx = sequence[i];
      setHighlight(idx);
      narrate(items[idx].label);
      sfx("tick");
      after(params.presentMs, () => {
        setHighlight(null);
        i++;
        after(240, step);
      });
    };
    after(500, step);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence]);

  const endRound = (success: boolean) => {
    setPhase("feedback");
    attemptsRef.current += 1;
    let nextSpan = span;
    if (success) {
      correctRef.current += 1;
      maxSpanRef.current = Math.max(maxSpanRef.current, span);
      nextSpan = span + 1;
      sfx("cheer");
      setMessage("Perfect memory! ⭐");
    } else {
      nextSpan = Math.max(params.startSpan, span - 1);
      sfx("error");
      setMessage("Close! Let's try another.");
    }

    after(1300, () => {
      if (attemptsRef.current >= params.rounds) {
        const correct = correctRef.current;
        onComplete({
          correct,
          total: params.rounds,
          accuracy: correct / params.rounds,
          score: Math.round((correct / params.rounds) * 100),
        });
        return;
      }
      setRoundNum(attemptsRef.current + 1);
      setMessage("Watch and listen…");
      setSpan(nextSpan);
      setSequence(randomSequence(nextSpan, items.length));
      setRecallPos(0);
      setPhase("present");
    });
  };

  const tapItem = (idx: number) => {
    if (phase !== "recall") return;
    const expected = sequence[recallPos];
    if (idx === expected) {
      sfx("tick");
      const nextPos = recallPos + 1;
      if (nextPos >= sequence.length) {
        endRound(true);
      } else {
        setRecallPos(nextPos);
      }
    } else {
      endRound(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-between text-sm font-semibold text-muted">
        <span>
          Round {Math.min(roundNum, params.rounds)} of {params.rounds}
        </span>
        <span>Sequence length: {span}</span>
      </div>

      <p aria-live="polite" className="text-xl sm:text-2xl font-bold min-h-8">
        {message}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
        {items.map((it, idx) => {
          const lit = highlight === idx;
          return (
            <button
              key={`${it.label}-${idx}`}
              type="button"
              disabled={phase !== "recall"}
              onClick={() => tapItem(idx)}
              aria-label={it.label}
              className={[
                "flex flex-col items-center gap-1 rounded-[var(--radius-card)] border-2 p-5 transition-transform",
                lit
                  ? "border-accent bg-[var(--accent-soft)] scale-105"
                  : "border-border bg-surface",
                phase === "recall" && "hover:border-accent cursor-pointer",
                phase !== "recall" && "cursor-default",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span aria-hidden className="text-5xl">
                {it.emoji}
              </span>
              <span className="font-semibold">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
