"use client";

import { useCallback } from "react";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { playSfx, speak, stopSpeaking } from "@/lib/audio/sound";

/** Game-facing audio bound to the user's sound preference. */
export function useGameSound() {
  const { prefs } = useAccessibility();
  const enabled = prefs.sound;

  const sfx = useCallback(
    (name: Parameters<typeof playSfx>[0]) => playSfx(name, enabled),
    [enabled],
  );
  const narrate = useCallback((text: string) => speak(text, enabled), [enabled]);

  return { enabled, sfx, narrate, stopSpeaking };
}
