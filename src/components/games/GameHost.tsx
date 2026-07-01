"use client";

import { useState } from "react";
import { GameBlueprint } from "@/lib/games/blueprint";
import { MECHANICS } from "@/lib/games/mechanics";
import { CONSTRUCT_LABELS } from "@/lib/games/types";
import { MechanicResult, starsFor } from "./result";
import { useGameSound } from "./useGameSound";
import { PhonemeMatch } from "./mechanics/PhonemeMatch";
import { GoNoGo } from "./mechanics/GoNoGo";
import { MemorySpan } from "./mechanics/MemorySpan";

type Phase = "intro" | "playing" | "done";

export function GameHost({
  blueprint,
  onNewGame,
  onResult,
  source,
}: {
  blueprint: GameBlueprint;
  onNewGame?: () => void;
  onResult?: (r: MechanicResult) => void;
  source?: "ai" | "fallback";
}) {
  const { sfx, narrate, stopSpeaking } = useGameSound();
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<MechanicResult | null>(null);
  const [attempt, setAttempt] = useState(0); // remount key for "play again"

  const meta = MECHANICS[blueprint.mechanic];

  const start = () => {
    sfx("start");
    narrate(blueprint.introNarration);
    setResult(null);
    setPhase("playing");
  };

  const handleComplete = (r: MechanicResult) => {
    stopSpeaking();
    setResult(r);
    setPhase("done");
    if (r.accuracy >= 0.6) sfx("cheer");
    onResult?.(r);
  };

  const playAgain = () => {
    setAttempt((a) => a + 1);
    start();
  };

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-3xl">
            {meta.emoji}
          </span>
          <div>
            <h2 className="text-xl font-extrabold leading-tight">
              {blueprint.title}
            </h2>
            <p className="text-sm text-muted">
              Trains: {CONSTRUCT_LABELS[blueprint.targetConstruct]} · Level{" "}
              {blueprint.difficulty}
            </p>
          </div>
        </div>
        {source && (
          <span className="text-xs rounded-full bg-surface px-3 py-1 border border-border text-muted">
            {source === "ai" ? "AI-generated" : "Sample content"}
          </span>
        )}
      </div>

      {phase === "intro" && (
        <div className="text-center space-y-6 py-6">
          <p className="text-lg sm:text-xl text-pretty max-w-xl mx-auto">
            {blueprint.introNarration}
          </p>
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-accent text-accent-fg px-10 py-4 text-xl font-extrabold"
          >
            ▶ Play
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div key={attempt}>
          {blueprint.mechanic === "phoneme_match" && (
            <PhonemeMatch blueprint={blueprint} onComplete={handleComplete} />
          )}
          {blueprint.mechanic === "go_no_go" && (
            <GoNoGo blueprint={blueprint} onComplete={handleComplete} />
          )}
          {blueprint.mechanic === "memory_span" && (
            <MemorySpan blueprint={blueprint} onComplete={handleComplete} />
          )}
        </div>
      )}

      {phase === "done" && result && (
        <div className="text-center space-y-5 py-6">
          <div aria-hidden className="text-5xl">
            {"⭐".repeat(starsFor(result.accuracy)) ||
              "🌱"}
          </div>
          <p className="text-2xl font-extrabold">
            {result.correct} of {result.total} right!
          </p>
          <p className="text-muted">
            {result.accuracy >= 0.85
              ? "Amazing focus — you're ready to level up!"
              : result.accuracy >= 0.6
                ? "Great work. Keep it going!"
                : "Every try makes your brain stronger. 💪"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={playAgain}
              className="rounded-full border border-border bg-surface px-6 py-3 font-bold hover:bg-surface-2"
            >
              Play again
            </button>
            {onNewGame && (
              <button
                type="button"
                onClick={onNewGame}
                className="rounded-full bg-accent text-accent-fg px-6 py-3 font-bold"
              >
                New game ✨
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
