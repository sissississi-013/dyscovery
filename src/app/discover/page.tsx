import { PageShell } from "@/components/layout/PageShell";
import { getActiveProfile } from "@/lib/profile/actions";
import { ProfileOnboarding } from "@/components/profile/ProfileOnboarding";
import { ScreeningExperience } from "@/components/screening/ScreeningExperience";

export const metadata = { title: "Discover — Dyscovery" };
export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const profile = await getActiveProfile();

  return (
    <PageShell
      eyebrow="Discover"
      title={
        profile
          ? `Let's check in with ${profile.displayName}`
          : "A playful check-in, grounded in research."
      }
      lead="A short, multi-modal screening that maps strengths and growth areas across reading and attention skills. It becomes the reference profile that personalizes every game."
    >
      {profile ? (
        <ScreeningExperience profile={profile} />
      ) : (
        <ProfileOnboarding />
      )}
    </PageShell>
  );
}
