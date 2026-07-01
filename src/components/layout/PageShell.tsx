export function PageShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="mb-8">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
          {title}
        </h1>
        {lead && <p className="mt-4 text-lg text-muted text-pretty">{lead}</p>}
      </header>
      {children}
    </div>
  );
}

export function ComingSoon({ items }: { items: string[] }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface-2 p-6">
      <p className="font-semibold mb-3">Being built (Phase 0 foundation in place):</p>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span aria-hidden className="text-accent">
              ◆
            </span>
            <span className="text-muted">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
