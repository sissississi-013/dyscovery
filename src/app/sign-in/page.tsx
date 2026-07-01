import { PageShell } from "@/components/layout/PageShell";
import Link from "next/link";

export const metadata = { title: "Parent sign in — Dyscovery" };

export default function SignInPage() {
  return (
    <PageShell
      eyebrow="For grown-ups"
      title="Parents and guardians sign in here."
      lead="Children never create their own accounts. A parent or guardian holds the account, gives consent, and adds a profile for each child — this is how we keep kids' data safe and COPPA-compliant."
    >
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 max-w-md space-y-4">
        <p className="text-sm text-muted">
          Authentication is part of Phase 0 wiring. The flow will be:
        </p>
        <ol className="space-y-2 text-sm list-decimal list-inside text-muted">
          <li>Parent signs in / creates an account.</li>
          <li>
            Parent reviews the{" "}
            <Link href="/legal/privacy" className="underline text-fg">
              children&apos;s privacy notice
            </Link>{" "}
            and gives verifiable consent.
          </li>
          <li>Parent adds a child profile (display name + age band only).</li>
          <li>The child can play; the parent controls and can delete data anytime.</li>
        </ol>
        <button
          type="button"
          disabled
          className="w-full rounded-full bg-accent text-accent-fg px-5 py-3 font-semibold opacity-60 cursor-not-allowed"
        >
          Continue (auth coming in Phase 0)
        </button>
      </div>
    </PageShell>
  );
}
