"use client";

import { useState } from "react";
import Link from "next/link";
import { FocusArea, FOCUS_AREAS } from "@/lib/games/types";
import { ActiveProfile } from "@/lib/profile/types";
import {
  BATTERIES,
  TASK_META,
  ScreeningTaskId,
  TaskResult,
  TaskScore,
} from "@/lib/screening/types";
import { mergeProfile } from "@/lib/screening/scoring";
import { submitScreening } from "@/lib/data/actions";
import type { ScreeningReport } from "@/lib/ai/report";
import { ScoreBars } from "./ScoreBars";
import { ScreeningDisclaimer } from "@/components/legal/ScreeningDisclaimer";
import { PhonemeOddTask } from "./tasks/PhonemeOddTask";
import { WordNonwordTask } from "./tasks/WordNonwordTask";
import { RapidMatchTask } from "./tasks/RapidMatchTask";
import { SpanTask } from "./tasks/SpanTask";
import { GoNoGoTask } from "./tasks/GoNoGoTask";

type Step = "choose" | "intro" | "running" | "scoring" | "report";

const FOCUS_LABELS: Record<FocusArea, string> = {
  dyslexia: "Reading & sounds (dyslexia)",
  adhd: "Focus & attention (ADHD)",
  general: "A bit of everything",
};

function TaskView({
  taskId,
  onDone,
}: {
  taskId: ScreeningTaskId;
  onDone: (r: TaskResult) => void;
}) {
  switch (taskId) {
    case "phoneme_odd":
      return <PhonemeOddTask onDone={onDone} />;
    case "word_nonword":
      return <WordNonwordTask onDone={onDone} />;
    case "rapid_match":
      return <RapidMatchTask onDone={onDone} />;
    case "span":
      return <SpanTask onDone={onDone} />;
    case "go_no_go":
      return <GoNoGoTask onDone={onDone} />;
  }
}

export function ScreeningExperience({ profile }: { profile: ActiveProfile }) {
  const [step, setStep] = useState<Step>("choose");
  const [focus, setFocus] = useState<FocusArea>(profile.focusAreas[0] ?? "general");
  const [taskIdx, setTaskIdx] = useState(0);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [scores, setScores] = useState<TaskScore[]>([]);
  const [report, setReport] = useState<ScreeningReport | null>(null);

  const battery = BATTERIES[focus];

  const finish = async (allResults: TaskResult[]) => {
    setStep("scoring");
    const profileScores = mergeProfile(allResults);
    setScores(profileScores);

    // Persist (deterministic scores) and fetch AI narration in parallel.
    const responses = allResults.flatMap((r) => r.responses);
    void submitScreening({
      focusArea: focus,
      responses,
      scores: profileScores.map((s) => ({
        construct: s.construct,
        score: s.score,
        confidence: s.confidence,
      })),
    });

    try {
      const res = await fetch("/api/screening/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageBand: profile.ageBand,
          focusArea: focus,
          scores: profileScores.map((s) => ({ construct: s.construct, score: s.score })),
        }),
      });
      const data = await res.json();
      if (data?.report) setReport(data.report);
    } catch {
      /* report is optional; scores still show */
    }
    setStep("report");
  };

  const handleTaskDone = (r: TaskResult) => {
    const next = [...results, r];
    setResults(next);
    if (taskIdx + 1 >= battery.length) {
      void finish(next);
    } else {
      setTaskIdx((i) => i + 1);
    }
  };

  if (step === "choose") {
    return (
      <div className="space-y-6">
        <ScreeningDisclaimer />
        <fieldset>
          <legend className="text-sm font-semibold uppercase tracking-wide text-accent mb-3">
            What would you like to explore for {profile.displayName}?
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {FOCUS_AREAS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={focus === f}
                onClick={() => setFocus(f)}
                className={`rounded-[var(--radius-card)] border-2 p-5 text-left ${
                  focus === f
                    ? "border-accent bg-[var(--accent-soft)]"
                    : "border-border bg-surface hover:border-accent"
                }`}
              >
                <p className="font-bold">{FOCUS_LABELS[f]}</p>
                <p className="text-sm text-muted mt-1">
                  {BATTERIES[f].length} quick activities
                </p>
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() => setStep("intro")}
          className="rounded-full bg-accent text-accent-fg px-8 py-3.5 text-lg font-bold"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Here&apos;s the plan</h2>
        <ol className="space-y-2">
          {battery.map((id, n) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4"
            >
              <span aria-hidden className="text-2xl">
                {TASK_META[id].emoji}
              </span>
              <div>
                <p className="font-semibold">
                  {n + 1}. {TASK_META[id].title}
                </p>
                <p className="text-sm text-muted">{TASK_META[id].blurb}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-muted text-sm">
          Take your time, find a quiet spot, and turn sound on for the best
          experience. There are no wrong answers — just do your best!
        </p>
        <button
          type="button"
          onClick={() => setStep("running")}
          className="rounded-full bg-accent text-accent-fg px-8 py-3.5 text-lg font-bold"
        >
          ▶ Start
        </button>
      </div>
    );
  }

  if (step === "running") {
    const id = battery[taskIdx];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(taskIdx / battery.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-muted">
            {taskIdx + 1}/{battery.length}
          </span>
        </div>
        <div className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-5 sm:p-7">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span aria-hidden>{TASK_META[id].emoji}</span>
            {TASK_META[id].title}
          </h2>
          <TaskView key={id} taskId={id} onDone={handleTaskDone} />
        </div>
      </div>
    );
  }

  if (step === "scoring") {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-10 text-center">
        <p className="text-xl font-bold animate-pulse">Putting it all together…</p>
        <p className="text-muted mt-2">Scoring results and writing your summary.</p>
      </div>
    );
  }

  // report
  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 space-y-4">
        <h2 className="text-2xl font-extrabold">
          {report?.headline ?? "Here's your snapshot!"}
        </h2>
        {report?.summary && <p className="text-pretty">{report.summary}</p>}
        <div className="pt-2">
          <h3 className="font-bold mb-3">Skill snapshot</h3>
          <ScoreBars scores={scores} />
        </div>
      </div>

      {report && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <h3 className="font-bold text-success mb-2">Strengths</h3>
            <ul className="space-y-1 list-disc list-inside text-sm">
              {report.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <h3 className="font-bold text-accent mb-2">Areas to grow</h3>
            <ul className="space-y-1 list-disc list-inside text-sm">
              {report.growthAreas.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {report?.encouragement && (
        <p className="text-center text-lg font-semibold">{report.encouragement}</p>
      )}

      <ScreeningDisclaimer />

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/play"
          className="rounded-full bg-accent text-accent-fg px-7 py-3.5 font-bold"
        >
          Play games tuned to this →
        </Link>
        <Link
          href="/grow"
          className="rounded-full border border-border bg-surface px-7 py-3.5 font-bold"
        >
          See progress
        </Link>
      </div>
    </div>
  );
}
