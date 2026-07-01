import { PageShell } from "@/components/layout/PageShell";
import { ScreeningDisclaimer } from "@/components/legal/ScreeningDisclaimer";

export const metadata = { title: "Medical disclaimer — Dyscovery" };

export default function DisclaimerPage() {
  return (
    <PageShell
      eyebrow="Important"
      title="Medical disclaimer"
      lead="Please read this carefully — it explains what Dyscovery is and is not."
    >
      <div className="space-y-6">
        <ScreeningDisclaimer />
        <p className="text-muted leading-relaxed">
          Dyscovery provides educational screening and cognitive-training
          activities based on published research. It does{" "}
          <strong className="text-fg">not</strong> diagnose dyslexia, ADHD, or any
          medical, psychological, or learning condition, and it is not a medical
          device. Screening results indicate possible strengths and areas to grow
          — they are not a clinical determination.
        </p>
        <p className="text-muted leading-relaxed">
          Only a qualified professional (such as a licensed psychologist,
          neuropsychologist, pediatrician, or speech-language pathologist) can
          diagnose these conditions, using a comprehensive evaluation. Dyscovery
          is intended to complement — never replace — professional assessment and
          care. If you have concerns about your child&apos;s development, please
          consult a qualified professional.
        </p>
      </div>
    </PageShell>
  );
}
