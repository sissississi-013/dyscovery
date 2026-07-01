import Link from "next/link";

const NAV = [
  { href: "/discover", label: "Discover", hint: "Screening" },
  { href: "/play", label: "Play", hint: "Games" },
  { href: "/grow", label: "Grow", hint: "Progress" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold text-xl"
          aria-label="Dyscovery home"
        >
          <span
            aria-hidden
            className="inline-grid place-items-center w-9 h-9 rounded-xl bg-accent text-accent-fg"
          >
            ✦
          </span>
          <span>
            Dys<span className="text-accent">covery</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex flex-col px-3 py-1.5 rounded-lg hover:bg-surface-2 leading-tight"
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-xs text-muted">{item.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/sign-in"
          className="rounded-full bg-accent text-accent-fg px-4 py-2 font-semibold"
        >
          Parent sign in
        </Link>
      </div>
    </header>
  );
}
