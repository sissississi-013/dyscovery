import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { getActiveProfile, listProfiles } from "@/lib/profile/actions";
import { getGrowData } from "@/lib/data/queries";
import { ProfileOnboarding } from "@/components/profile/ProfileOnboarding";
import { ProfileControls } from "@/components/profile/ProfileControls";
import { ScoreBars } from "@/components/screening/ScoreBars";
import { MECHANICS } from "@/lib/games/mechanics";
import { CONSTRUCT_LABELS } from "@/lib/games/types";
import { MechanicId } from "@/lib/games/blueprint";

export const metadata = { title: "Grow — Dyscovery" };
export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 text-center">
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}

export default async function GrowPage() {
  const profile = await getActiveProfile();

  if (!profile) {
    return (
      <PageShell
        eyebrow="Grow"
        title="Track progress over time."
        lead="Create a child profile to start saving streaks, stats, and skill growth."
      >
        <ProfileOnboarding />
      </PageShell>
    );
  }

  const [data, profiles] = await Promise.all([
    getGrowData(profile.id),
    listProfiles(),
  ]);

  const latestScreening = data.screenings[0];

  return (
    <PageShell
      eyebrow="Grow"
      title={`${profile.displayName}'s progress`}
      lead="Streaks and stats for kids; honest, plain-language trends for grown-ups."
    >
      <div className="space-y-8">
        <ProfileControls profiles={profiles} activeId={profile.id} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Games played" value={data.gameCount} />
          <StatCard label="Day streak" value={`${data.dayStreak}🔥`} />
          <StatCard label="Check-ins" value={data.screeningCount} />
          <StatCard label="Last played" value={fmtDate(data.lastPlayed)} />
        </div>

        {data.skills.length > 0 ? (
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
            <h2 className="text-xl font-bold mb-4">Skill garden 🌱</h2>
            <ScoreBars
              scores={data.skills.map((s) => ({
                construct: s.construct,
                score: Math.round(s.estimate),
                confidence: 1,
              }))}
            />
          </section>
        ) : (
          <section className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface-2 p-6 text-center">
            <p className="font-semibold">No skills tracked yet.</p>
            <p className="text-muted mt-1">
              Take a{" "}
              <Link href="/discover" className="underline text-accent">
                check-in
              </Link>{" "}
              or{" "}
              <Link href="/play" className="underline text-accent">
                play a game
              </Link>{" "}
              to start growing your garden.
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
            <h2 className="text-xl font-bold mb-4">Recent activity</h2>
            {data.recentGames.length === 0 ? (
              <p className="text-muted">No games played yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentGames.map((g, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>
                        {MECHANICS[g.mechanic as MechanicId]?.emoji ?? "🎮"}
                      </span>
                      {MECHANICS[g.mechanic as MechanicId]?.title ?? g.mechanic}
                    </span>
                    <span className="text-muted">
                      {g.accuracy != null ? `${Math.round(g.accuracy * 100)}%` : "—"} ·{" "}
                      {fmtDate(g.startedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
            <h2 className="text-xl font-bold mb-4">Latest check-in</h2>
            {latestScreening ? (
              <>
                <p className="text-sm text-muted mb-3">
                  {fmtDate(latestScreening.completedAt)} · {latestScreening.focusArea}
                </p>
                <ScoreBars
                  scores={latestScreening.scores.map((s) => ({
                    construct: s.construct,
                    score: Math.round(s.score),
                    confidence: 1,
                  }))}
                />
                {data.screenings.length > 1 && (
                  <p className="text-xs text-muted mt-3">
                    {data.screenings.length} check-ins recorded — retake anytime to
                    see change over weeks.
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted">
                No check-ins yet.{" "}
                <Link href="/discover" className="underline text-accent">
                  Take the first one →
                </Link>
              </p>
            )}
          </section>
        </div>

        <p className="text-xs text-muted">
          Note: scores are screening indicators, not clinical measures.{" "}
          <span className="font-semibold">
            {CONSTRUCT_LABELS.phonological_awareness}
          </span>{" "}
          and other skills grow with practice — celebrate effort over numbers.
        </p>
      </div>
    </PageShell>
  );
}
