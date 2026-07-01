"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AGE_BANDS, AgeBand, FocusArea } from "@/lib/games/types";
import { createProfile } from "@/lib/profile/actions";
import { ScreeningDisclaimer } from "@/components/legal/ScreeningDisclaimer";

const FOCUS_OPTIONS: { value: FocusArea; label: string }[] = [
  { value: "dyslexia", label: "Reading & sounds (dyslexia)" },
  { value: "adhd", label: "Focus & attention (ADHD)" },
];

export function ProfileOnboarding() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("8-9");
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(["dyslexia"]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFocus = (f: FocusArea) =>
    setFocusAreas((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const submit = () => {
    setError(null);
    if (!displayName.trim()) return setError("Please add a name or nickname.");
    if (!consent) return setError("A parent or guardian must give consent to continue.");
    startTransition(async () => {
      try {
        await createProfile({
          displayName,
          ageBand,
          focusAreas: focusAreas.length ? focusAreas : ["general"],
          consent,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold">Set up a child profile</h2>
          <p className="text-sm text-muted mt-1">
            A grown-up creates this. We only ask for a nickname and an age range —
            never a full name or birth date.
          </p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-1">
            Child&apos;s name or nickname
          </label>
          <input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5"
            placeholder="e.g. Robin"
          />
        </div>

        <div>
          <span className="block text-sm font-semibold mb-1">Age</span>
          <div className="flex gap-2">
            {AGE_BANDS.map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={ageBand === b}
                onClick={() => setAgeBand(b)}
                className={`rounded-full px-4 py-2 text-sm border ${
                  ageBand === b
                    ? "bg-accent text-accent-fg border-accent"
                    : "bg-surface border-border hover:bg-surface-2"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold mb-1">
            Areas of interest (optional)
          </span>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={focusAreas.includes(o.value)}
                onClick={() => toggleFocus(o.value)}
                className={`rounded-full px-4 py-2 text-sm border ${
                  focusAreas.includes(o.value)
                    ? "bg-accent text-accent-fg border-accent"
                    : "bg-surface border-border hover:bg-surface-2"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 accent-[var(--accent)]"
          />
          <span>
            I am this child&apos;s parent or guardian and I consent to Dyscovery
            collecting screening and gameplay data, and sending de-identified data
            to our AI provider to personalize games and summaries.
          </span>
        </label>

        {error && <p className="text-danger text-sm font-semibold">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="w-full rounded-full bg-accent text-accent-fg px-6 py-3 font-bold disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create profile"}
        </button>
      </div>
      <ScreeningDisclaimer />
    </div>
  );
}
