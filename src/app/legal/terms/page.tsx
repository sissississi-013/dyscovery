import { PageShell } from "@/components/layout/PageShell";

export const metadata = { title: "Terms — Dyscovery" };

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Terms"
      title="Terms of use"
      lead="A working draft. To be reviewed by counsel before launch."
    >
      <p className="text-muted leading-relaxed">
        By using Dyscovery you agree that it is an educational screening and
        practice tool, not a diagnostic or medical service. Accounts are held by
        adults (parents or guardians) on behalf of children. Full terms,
        acceptable-use, and liability sections will be added before public
        launch.
      </p>
    </PageShell>
  );
}
