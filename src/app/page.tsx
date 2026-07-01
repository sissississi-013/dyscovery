import Link from "next/link";
import { ScreeningDisclaimer } from "@/components/legal/ScreeningDisclaimer";

const PILLARS = [
  {
    href: "/discover",
    emoji: "🧭",
    title: "Discover",
    tag: "Screening",
    body: "A short, playful, research-based check-in that maps your child's strengths and growth areas. A screening — never a diagnosis.",
  },
  {
    href: "/play",
    emoji: "🎮",
    title: "Play",
    tag: "Games",
    body: "AI personalizes multi-modal mini-games to that profile — music, motion, and voice — with difficulty that adapts so it's always fun, never repetitive.",
  },
  {
    href: "/grow",
    emoji: "🌱",
    title: "Grow",
    tag: "Progress",
    body: "Streaks and badges for kids; clear, honest progress trends for grown-ups. Re-check anytime to see real change over weeks.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-16 sm:py-24 text-center">
        <p className="inline-block rounded-full bg-accent-soft text-accent px-4 py-1.5 text-sm font-semibold mb-6">
          For dyslexia, ADHD &amp; the whole spectrum of neurodivergence
        </p>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto text-balance">
          Brain games that adapt to{" "}
          <span className="text-accent">how your kid thinks.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto text-pretty">
          Dyscovery turns evidence-based cognitive science into joyful,
          multi-modal play — personalized by AI to each child&apos;s profile, and
          built accessible from the very first pixel.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/discover"
            className="rounded-full bg-accent text-accent-fg px-7 py-3.5 font-bold text-lg"
          >
            Start the check-in
          </Link>
          <Link
            href="/play"
            className="rounded-full border border-border bg-surface px-7 py-3.5 font-bold text-lg hover:bg-surface-2"
          >
            See the games
          </Link>
        </div>
      </section>

      <section
        aria-label="How Dyscovery works"
        className="grid gap-5 sm:grid-cols-3 pb-12"
      >
        {PILLARS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-[var(--radius-card)] border border-border bg-surface p-6 hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span aria-hidden className="text-4xl">
                {p.emoji}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {p.tag}
              </span>
            </div>
            <h2 className="text-2xl font-bold group-hover:text-accent">
              {p.title}
            </h2>
            <p className="mt-2 text-muted">{p.body}</p>
          </Link>
        ))}
      </section>

      <section className="pb-16 max-w-3xl">
        <ScreeningDisclaimer />
      </section>
    </div>
  );
}
