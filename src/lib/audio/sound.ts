"use client";

/**
 * Self-contained multi-modal audio: synthesized SFX via the Web Audio API and
 * voice narration via the Speech Synthesis API. No asset files required, works
 * offline, and gives every game a "no reading required" audio path.
 *
 * All functions no-op safely on the server and when the user has muted sound.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Browsers suspend the context until a user gesture; resume opportunistically.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number };

const PRESETS: Record<string, Tone[]> = {
  success: [
    { freq: 523.25, dur: 0.12 },
    { freq: 783.99, dur: 0.16 },
  ],
  error: [{ freq: 196, dur: 0.22, type: "triangle" }],
  tick: [{ freq: 660, dur: 0.06, gain: 0.05 }],
  start: [
    { freq: 392, dur: 0.1 },
    { freq: 587.33, dur: 0.14 },
  ],
  cheer: [
    { freq: 523.25, dur: 0.1 },
    { freq: 659.25, dur: 0.1 },
    { freq: 783.99, dur: 0.18 },
  ],
};

export function playSfx(name: keyof typeof PRESETS, enabled = true) {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  let t = audio.currentTime;
  for (const tone of PRESETS[name]) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.value = tone.freq;
    const peak = tone.gain ?? 0.12;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + tone.dur);
    t += tone.dur * 0.9;
  }
}

export function speak(text: string, enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95; // a touch slower for young / dyslexic listeners
  u.pitch = 1.05;
  synth.speak(u);
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}
