import Link from "next/link";
import { ScreeningDisclaimer } from "@/components/legal/ScreeningDisclaimer";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <ScreeningDisclaimer />
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} Dyscovery.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-4">
              <li>
                <Link href="/legal/privacy" className="underline hover:text-fg">
                  Privacy &amp; children&apos;s data
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="underline hover:text-fg">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/legal/disclaimer" className="underline hover:text-fg">
                  Medical disclaimer
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
