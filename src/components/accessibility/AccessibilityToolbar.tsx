"use client";

import { useState } from "react";
import { useAccessibility } from "./AccessibilityProvider";
import {
  ColorTheme,
  FontChoice,
  TextScale,
  THEME_LABELS,
  FONT_LABELS,
  TEXT_LABELS,
} from "@/lib/accessibility";

function OptionGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-sm font-semibold text-muted mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                active
                  ? "bg-accent text-accent-fg border-accent"
                  : "bg-surface text-fg border-border hover:bg-surface-2"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AccessibilityToolbar() {
  const { prefs, setPref, reset } = useAccessibility();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        className="fixed bottom-4 right-4 z-50 rounded-full bg-accent text-accent-fg px-4 py-3 shadow-lg font-semibold focus-visible:outline-offset-4"
      >
        <span aria-hidden>⚙</span>
        <span className="ml-2">Accessibility</span>
      </button>

      {open && (
        <div
          id="a11y-panel"
          role="dialog"
          aria-label="Accessibility settings"
          className="fixed bottom-20 right-4 z-50 w-[min(92vw,22rem)] rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Make it comfortable</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close accessibility settings"
              className="rounded-md px-2 py-1 hover:bg-surface-2"
            >
              ✕
            </button>
          </div>

          <OptionGroup<ColorTheme>
            legend="Colors"
            value={prefs.theme}
            onChange={(v) => setPref("theme", v)}
            options={(Object.keys(THEME_LABELS) as ColorTheme[]).map((k) => ({
              value: k,
              label: THEME_LABELS[k],
            }))}
          />

          <OptionGroup<FontChoice>
            legend="Reading font"
            value={prefs.font}
            onChange={(v) => setPref("font", v)}
            options={(Object.keys(FONT_LABELS) as FontChoice[]).map((k) => ({
              value: k,
              label: FONT_LABELS[k],
            }))}
          />

          <OptionGroup<TextScale>
            legend="Text size"
            value={prefs.text}
            onChange={(v) => setPref("text", v)}
            options={(Object.keys(TEXT_LABELS) as TextScale[]).map((k) => ({
              value: k,
              label: TEXT_LABELS[k],
            }))}
          />

          <OptionGroup<"full" | "reduced">
            legend="Motion"
            value={prefs.motion}
            onChange={(v) => setPref("motion", v)}
            options={[
              { value: "full", label: "Full" },
              { value: "reduced", label: "Reduced" },
            ]}
          />

          <OptionGroup<"on" | "off">
            legend="Sound"
            value={prefs.sound ? "on" : "off"}
            onChange={(v) => setPref("sound", v === "on")}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />

          <button
            type="button"
            onClick={reset}
            className="text-sm underline text-muted hover:text-fg"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </>
  );
}
