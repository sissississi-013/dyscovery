import type { Metadata, Viewport } from "next";
import { Lexend, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider";
import { AccessibilityToolbar } from "@/components/accessibility/AccessibilityToolbar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PREHYDRATION_SCRIPT } from "@/lib/accessibility";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const hyperlegible = Atkinson_Hyperlegible({
  variable: "--font-hyperlegible",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dyscovery — playful, evidence-based brain games",
  description:
    "A multi-modal, AI-personalized cognitive-training playground for neurodivergent kids. Screening, not diagnosis.",
};

export const viewport: Viewport = {
  themeColor: "#2f6f6b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${hyperlegible.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREHYDRATION_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-accent focus:text-accent-fg focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to main content
        </a>
        <AccessibilityProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <AccessibilityToolbar />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
