import { PageShell } from "@/components/layout/PageShell";

export const metadata = { title: "Children's privacy — Dyscovery" };

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="Children's privacy & data (COPPA)"
      lead="Dyscovery is built for children, so we follow the U.S. Children's Online Privacy Protection Act (COPPA) by design. This page is a working draft of our notice — it is not yet legal advice and must be reviewed by counsel before launch."
    >
      <div className="prose-dyscovery space-y-6 text-pretty">
        <Section title="The short version">
          A parent or guardian holds the account and gives verifiable consent
          before we collect anything from a child. We collect the minimum needed
          to run the games, never sell data, never use it for behavioral
          advertising, and let parents review or delete it at any time.
        </Section>

        <Section title="What we collect">
          From the <strong>parent</strong>: email and authentication details.
          From the <strong>child profile</strong>: a display name (not a legal
          name), a coarse age band (not a birth date), accessibility
          preferences, screening responses, and gameplay results.
        </Section>

        <Section title="Verifiable parental consent">
          We obtain consent before any collection. We ask for{" "}
          <strong>separate</strong> consent for anything that is not integral to
          the service — including sending de-identified data to our AI provider
          for game generation and report narration. We never use children&apos;s
          data to train third-party AI models, and we never share it for
          targeted advertising.
        </Section>

        <Section title="Your rights as a parent">
          Review your child&apos;s data, revoke consent, and request export or
          deletion at any time. Deletion is honored promptly and logged.
        </Section>

        <Section title="Retention & security">
          We keep data only as long as needed to provide the service, following
          a written retention schedule, and protect it with encryption in transit
          and at rest.
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-muted leading-relaxed">{children}</p>
    </section>
  );
}
