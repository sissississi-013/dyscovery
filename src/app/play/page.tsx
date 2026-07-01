import { PageShell } from "@/components/layout/PageShell";
import { PlayExperience } from "@/components/games/PlayExperience";
import { ProfileOnboarding } from "@/components/profile/ProfileOnboarding";
import { getActiveProfile } from "@/lib/profile/actions";

export const metadata = { title: "Play — Dyscovery" };
export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const profile = await getActiveProfile();

  return (
    <PageShell
      eyebrow="Play"
      title={profile ? `${profile.displayName}'s games` : "Make a game that's just for you."}
      lead="Pick a skill and a difficulty. Gemini directs a hand-built, accessible mechanic — choosing the content, theme, and challenge — so every game is fresh, multi-modal, and fun. Results save to the profile."
    >
      {profile ? <PlayExperience profile={profile} /> : <ProfileOnboarding />}
    </PageShell>
  );
}
