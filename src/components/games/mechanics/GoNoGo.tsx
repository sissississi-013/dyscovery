"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GoNoGoBlueprint } from "@/lib/games/blueprint";
import { difficultyParams } from "@/lib/games/mechanics";
import { useGameSound } from "../useGameSound";
import { MechanicResult } from "../result";

type Props = {
  blueprint: GoNoGoBlueprint;
  onComplete: (r: MechanicResult) => void;
};

type Trial = { emoji: string; label: string; isGo: boolean };

function buildTrials(bp: GoNoGoBlueprint): Trial[] {
  const p = difficultyParams("go_no_go", bp.difficulty) as {
    trials: number;
    noGoRatio: number;
  };
  const { goItems, noGoItems } = bp.content;
  const out: Trial[] = [];
  for (let i = 0; i < p.trials; i++) {
    const isGo = Math.random() > p.noGoRatio;
    const pool = isGo ? goItems : noGoItems;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    out.push({ emoji: pick.emoji, label: pick.label, isGo });
  }
  return out;
}

export function GoNoGo({ blueprint, onComplete }: Props) {
  const trials = useMemo(() => buildTrials(blueprint), [blueprint]);
  const params = difficultyParams("go_no_go", blueprint.difficulty) as {
    stimulusMs: number;
    interStimulusMs: number;
  };
  const { sfx } = useGameSound();

  const [trialIdx, setTrialIdx] = useState(-1);
  const [showing, setShowing] = useState(false);
  const [flash, setFlash] = useState<"hit" | "good-hold" | "oops" | null>(null);

  const respondedRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const statsRef = useRef({ hits: 0, correctRejections: 0, misses: 0, falseAlarms: 0 });
  const [stats, setStats] = useState({
    hits: 0,
    correctRejections: 0,
    misses: 0,
    falseAlarms: 0,
  });
  const syncStats = () => setStats({ ...statsRef.current });

  const current = trialIdx >= 0 ? trials[trialIdx] : null;

  // Scheduler: run one trial, then advance. setState happens inside timeouts
  // (never synchronously in an effect body).
  useEffect(() => {
    const runTrial = (i: number) => {
      respondedRef.current = false;
      setTrialIdx(i);
      setShowing(true);
      setFlash(null);
      timerRef.current = window.setTimeout(() => {
        const trial = trials[i];
        if (!respondedRef.current) {
          if (trial.isGo) statsRef.current.misses++;
          else statsRef.current.correctRejections++; // correctly held back
          syncStats();
        }
        setShowing(false);
        timerRef.current = window.setTimeout(() => {
          if (i + 1 >= trials.length) {
            const s = statsRef.current;
            const correct = s.hits + s.correctRejections;
            onComplete({
              correct,
              total: trials.length,
              accuracy: correct / trials.length,
              score: Math.round((correct / trials.length) * 100),
            });
          } else {
            runTrial(i + 1);
          }
        }, params.interStimulusMs);
      }, params.stimulusMs);
    };

    const kickoff = window.setTimeout(() => runTrial(0), 400);
    return () => {
      window.clearTimeout(kickoff);
      window.clearTimeout(timerRef.current);
    };
  }, [trials, params.stimulusMs, params.interStimulusMs, onComplete]);

  const respond = () => {
    if (!showing || respondedRef.current || !current) return;
    respondedRef.current = true;
    if (current.isGo) {
      statsRef.current.hits++;
      setFlash("hit");
      sfx("success");
    } else {
      statsRef.current.falseAlarms++;
      setFlash("oops");
      sfx("error");
    }
    syncStats();
  };

  // Keyboard: space / enter to tap.
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
      <p className="text-lg font-semibold">
        Tap for <span className="text-success">{blueprint.content.goLabel}</span>.
        Hold still for{" "}
        <span className="text-danger">{blueprint.content.noGoLabel}</span>.
      </p>

      <div
        className="mx-auto grid place-items-center h-56 w-full max-w-sm rounded-[var(--radius-card)] border-2 border-border bg-surface"
        aria-live="polite"
      >
        {showing && current ? (
          <div className="flex flex-col items-center gap-2">
            <span aria-hidden className="text-8xl">
              {current.emoji}
            </span>
            <span className="text-xl font-bold">{current.label}</span>
            <span
              className={`text-sm font-semibold ${current.isGo ? "text-success" : "text-danger"}`}
            >
              {current.isGo ? "Tap!" : "Hold!"}
            </span>
          </div>
        ) : (
          <span className="text-muted text-lg">
            {flash === "hit" && "Nice! ✅"}
            {flash === "oops" && "Oops — that was a hold one. 🤚"}
            {flash === null && "…"}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={respond}
        className="w-full max-w-sm mx-auto rounded-full bg-accent text-accent-fg px-8 py-6 text-2xl font-extrabold active:scale-95"
      >
        TAP
      </button>

      <p className="text-sm text-muted">
        Hits {stats.hits} · Held correctly {stats.correctRejections} · Slips{" "}
        {stats.falseAlarms}
      </p>
    </div>
  );
}
