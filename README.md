# Dyscovery

A multi-modal, AI-personalized **cognitive-training playground** for
neurodivergent kids (dyslexia, ADHD, and the broader spectrum). Dyscovery turns
peer-reviewed cognitive science into joyful, accessible games — and adapts them
to each child via a research-based screening profile.

> **Screening, not diagnosis.** Dyscovery never diagnoses. It screens for
> strengths/needs and provides training, as a complement to professional care.

## Three experiences

- **Discover** — a short, adaptive, multi-modal screening → a normalized
  *Reference Profile*. Scoring is deterministic; AI only adapts and narrates.
- **Play** — a schema-governed *AI Game Director* directs a library of
  hand-built, accessible game mechanics (it emits validated JSON blueprints,
  never raw code), with multi-modal audio/visuals and adaptive difficulty.
- **Grow** — kid-facing streaks/badges and a caregiver progress view with
  honest change-over-time charts and re-assessment.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with an accessibility-first design system
- **Drizzle ORM** + **Neon Postgres**
- **Zod** for runtime schema validation (incl. AI game blueprints)
- **Phaser** for arcade game mechanics _(added in Phase 2)_

## Accessibility (built in, not bolted on)

Driven by `data-*` attributes on `<html>` and the `AccessibilityProvider`:

- Dyslexia-friendly fonts (Lexend default, Atkinson Hyperlegible, OpenDyslexic)
- Color themes incl. high-contrast (WCAG AA pairs)
- Adjustable text size, reduced-motion (respects OS preference), sound toggle
- Visible focus, skip link, keyboard support

## Getting started

```bash
npm install
cp .env.example .env.local   # add your Neon DATABASE_URL
npm run db:push              # create tables in Neon
npm run dev                  # http://localhost:3000
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` / `typecheck` | ESLint / TypeScript checks |
| `npm run db:generate` | Generate SQL migrations from the schema |
| `npm run db:push` | Push the schema to Neon |
| `npm run db:studio` | Open Drizzle Studio |

## Privacy by design (COPPA)

Children never own accounts — a parent/guardian holds the account, gives
verifiable consent, and can export or delete data at any time. We minimize data,
never sell it, and never use it for behavioral ads. See `src/db/schema.ts`
(`consentRecords`, `auditLog`) and `/legal/privacy`.

## Status

**Built:** screening engine, AI game engine, profiles, persistence, and Grow dashboard.
