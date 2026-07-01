export type ColorTheme = "calm" | "highContrast" | "dark";
export type FontChoice = "lexend" | "hyperlegible" | "dyslexic";
export type TextScale = "sm" | "md" | "lg" | "xl";
export type MotionPref = "full" | "reduced";

export type AccessibilityPrefs = {
  theme: ColorTheme;
  font: FontChoice;
  text: TextScale;
  motion: MotionPref;
  /** Master audio toggle for music/voice/SFX in games and narration. */
  sound: boolean;
};

export const DEFAULT_PREFS: AccessibilityPrefs = {
  theme: "calm",
  font: "lexend",
  text: "md",
  motion: "full",
  sound: true,
};

export const STORAGE_KEY = "dyscovery:a11y";

export const THEME_LABELS: Record<ColorTheme, string> = {
  calm: "Calm",
  highContrast: "High contrast",
  dark: "Dark",
};

export const FONT_LABELS: Record<FontChoice, string> = {
  lexend: "Lexend (default)",
  hyperlegible: "Atkinson Hyperlegible",
  dyslexic: "OpenDyslexic",
};

export const TEXT_LABELS: Record<TextScale, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Extra large",
};

export function applyPrefsToDocument(prefs: AccessibilityPrefs) {
  const el = document.documentElement;
  el.dataset.theme = prefs.theme;
  el.dataset.font = prefs.font;
  el.dataset.text = prefs.text;
  el.dataset.motion = prefs.motion;
}

/**
 * Inline, pre-hydration script. Reads saved prefs (and OS reduced-motion)
 * and applies the data attributes before first paint to avoid a flash.
 */
export const PREHYDRATION_SCRIPT = `
(function () {
  try {
    var d = document.documentElement;
    var raw = localStorage.getItem('${STORAGE_KEY}');
    var p = raw ? JSON.parse(raw) : {};
    d.dataset.theme = p.theme || 'calm';
    d.dataset.font = p.font || 'lexend';
    d.dataset.text = p.text || 'md';
    var osReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    d.dataset.motion = p.motion || (osReduced ? 'reduced' : 'full');
  } catch (e) {}
})();
`;
