"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AccessibilityPrefs,
  DEFAULT_PREFS,
  STORAGE_KEY,
  applyPrefsToDocument,
} from "@/lib/accessibility";

type Ctx = {
  prefs: AccessibilityPrefs;
  setPref: <K extends keyof AccessibilityPrefs>(
    key: K,
    value: AccessibilityPrefs[K],
  ) => void;
  reset: () => void;
};

const AccessibilityContext = createContext<Ctx | null>(null);

function readStoredPrefs(): AccessibilityPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lazily read storage on first client render. The inline pre-hydration script
  // has already applied the visual theme, and prefs-dependent UI (the settings
  // panel) is closed during hydration, so there is no hydration mismatch.
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(readStoredPrefs);

  // Persist + reflect to the document whenever prefs change.
  useEffect(() => {
    applyPrefsToDocument(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage may be unavailable */
    }
  }, [prefs]);

  const setPref = useCallback<Ctx["setPref"]>((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), []);

  const value = useMemo(() => ({ prefs, setPref, reset }), [prefs, setPref, reset]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return ctx;
}
