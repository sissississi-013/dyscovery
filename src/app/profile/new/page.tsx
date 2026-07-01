import { PageShell } from "@/components/layout/PageShell";
import { ProfileOnboarding } from "@/components/profile/ProfileOnboarding";

export const metadata = { title: "Add a child — Dyscovery" };
export const dynamic = "force-dynamic";

export default function NewProfilePage() {
  return (
    <PageShell eyebrow="Profiles" title="Add a child profile">
      <ProfileOnboarding />
    </PageShell>
  );
}
