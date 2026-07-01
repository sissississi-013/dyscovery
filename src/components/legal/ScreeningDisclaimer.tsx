/**
 * The single most important compliance + ethics statement in the product.
 * Dyscovery provides screening and training, NOT a clinical diagnosis.
 * Keep this prominent wherever results are shown.
 */
export function ScreeningDisclaimer({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  if (variant === "compact") {
    return (
      <p className="text-sm text-muted">
        <strong className="text-fg">This is a screening, not a diagnosis.</strong>{" "}
        Results indicate possible strengths and areas to grow — they are not a
        medical or clinical diagnosis.
      </p>
    );
  }

  return (
    <aside
      role="note"
      className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 text-sm leading-relaxed"
    >
      <p className="font-semibold text-fg mb-1">
        Dyscovery is a screening &amp; practice tool — not a diagnosis.
      </p>
      <p className="text-muted">
        Our activities are based on published cognitive-science research, but
        they do <strong>not</strong> diagnose dyslexia, ADHD, or any condition. A
        diagnosis can only be made by a qualified professional. If results
        suggest your child may benefit from support, we&apos;ll point you toward
        next steps. Dyscovery is a complement to — never a replacement for —
        professional care.
      </p>
    </aside>
  );
}
