"use client";

import { useEffect, useState } from "react";
import { MECHANICS_LIST } from "@/lib/games/mechanics";
import { MechanicId, GameBlueprint, blueprintSchema } from "@/lib/games/blueprint";
import { AgeBand, CONSTRUCT_LABELS, MAX_DIFFICULTY } from "@/lib/games/types";
import { ActiveProfile } from "@/lib/profile/types";
import { recordGameResult, getSuggestedDifficulty } from "@/lib/data/actions";
import { GameHost } from "./GameHost";
import { MechanicResult } from "./result";

type Step = "choose" | "loading" | "play" | "error";

export function PlayExperience({ profile }: { profile?: ActiveProfile }) {
  const [step, setStep] = useState<Step>("choose");
  const [mechanic, setMechanic] = useState<MechanicId>("phoneme_match");
  const [difficulty, setDifficulty] = useState(2);
  const [ageBand] = useState<AgeBand>(profile?.ageBand ?? "8-9");
  const [blueprint, setBlueprint] = useState<GameBlueprint | null>(null);
  const [source, setSource] = useState<"ai" | "fallback">("fallback");

  const selected = MECHANICS_LIST.find((m) => m.id === mechanic)!;

  // Prefill difficulty from the child's live skill estimate for this skill.
  useEffect(() => {
    if (!profile) return;
    let active = true;
    getSuggestedDifficulty(selected.construct).then((d) => {
      if (active) setDifficulty(d);
    });
    return () => {
      active = false;
    };
  }, [profile, selected.construct]);

  const saveResult = (r: MechanicResult) => {
    if (!profile || !blueprint) return;
    void recordGameResult({
      mechanic: blueprint.mechanic,
      targetConstruct: blueprint.targetConstruct,
      difficulty: blueprint.difficulty,
      score: r.score,
      accuracy: r.accuracy,
    });
  };

  const generate = async () => {
    setStep("loading");
    try {
      const res = await fetch("/api/games/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mechanic,
          targetConstruct: selected.construct,
          difficulty,
          ageBand,
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const bp = blueprintSchema.parse(data.blueprint);
      setBlueprint(bp);
      setSource(data.source === "ai" ? "ai" : "fallback");
      setStep("play");
    } catch (err) {
      console.error(err);
      setStep("error");
    }
  };

  if (step === "play" && blueprint) {
    return (
      <GameHost
        blueprint={blueprint}
        source={source}
        onResult={saveResult}
        onNewGame={() => setStep("choose")}
      />
    );
  }

  if (step === "loading") {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-10 text-center">
        <p className="text-xl font-bold animate-pulse">
          ✨ Building your game…
        </p>
        <p className="text-muted mt-2">
          Personalizing the content for you.
        </p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="rounded-[var(--radius-card)] border border-danger bg-surface p-8 text-center space-y-4">
        <p className="text-lg font-bold">We couldn&apos;t build a game just now.</p>
        <button
          type="button"
          onClick={() => setStep("choose")}
          className="rounded-full bg-accent text-accent-fg px-6 py-3 font-bold"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-accent mb-3">
          Pick a skill to practice
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {MECHANICS_LIST.map((m) => {
            const active = m.id === mechanic;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMechanic(m.id)}
                className={`text-left rounded-[var(--radius-card)] border-2 p-5 transition-colors ${
                  active
                    ? "border-accent bg-[var(--accent-soft)]"
                    : "border-border bg-surface hover:border-accent"
                }`}
              >
                <span aria-hidden className="text-4xl">
                  {m.emoji}
                </span>
                <h3 className="mt-2 text-lg font-bold">{m.title}</h3>
                <p className="text-sm text-muted">{m.blurb}</p>
                <p className="mt-2 text-xs font-semibold text-accent">
                  {CONSTRUCT_LABELS[m.construct]}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="max-w-sm">
        <label htmlFor="difficulty" className="block text-sm font-semibold mb-2">
          Difficulty: level {difficulty}
          {profile && (
            <span className="ml-2 text-xs font-normal text-muted">
              (suggested for {profile.displayName})
            </span>
          )}
        </label>
        <input
          id="difficulty"
          type="range"
          min={1}
          max={MAX_DIFFICULTY}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-xs text-muted">
          <span>Easier</span>
          <span>Harder</span>
        </div>
      </div>

      <button
        type="button"
        onClick={generate}
        className="w-full sm:w-auto rounded-full bg-accent text-accent-fg px-10 py-4 text-xl font-extrabold"
      >
        ✨ Make my game
      </button>
    </div>
  );
}
