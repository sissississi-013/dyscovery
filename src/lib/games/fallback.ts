import { MechanicId } from "./blueprint";
import { difficultyParams } from "./mechanics";
import { z } from "zod";
import { generationSchema } from "./blueprint";

/**
 * Deterministic, offline content generator. Used when no AI key is configured
 * or when the AI call fails validation — so the engine is always playable and
 * resilient. Content is themed but built from a small curated bank.
 */

type Word = { word: string; emoji: string };

const PHONEME_BANK: Record<string, Word[]> = {
  b: [
    { word: "ball", emoji: "⚽" },
    { word: "bear", emoji: "🐻" },
    { word: "boat", emoji: "⛵" },
  ],
  s: [
    { word: "sun", emoji: "☀️" },
    { word: "snake", emoji: "🐍" },
    { word: "sock", emoji: "🧦" },
  ],
  m: [
    { word: "moon", emoji: "🌙" },
    { word: "mouse", emoji: "🐭" },
    { word: "milk", emoji: "🥛" },
  ],
  f: [
    { word: "fish", emoji: "🐟" },
    { word: "fire", emoji: "🔥" },
    { word: "fox", emoji: "🦊" },
  ],
  k: [
    { word: "cat", emoji: "🐱" },
    { word: "key", emoji: "🔑" },
    { word: "cake", emoji: "🍰" },
  ],
  t: [
    { word: "tree", emoji: "🌳" },
    { word: "tiger", emoji: "🐯" },
    { word: "train", emoji: "🚂" },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Gen = z.infer<ReturnType<typeof generationSchema>>;

export function fallbackGeneration(mechanic: MechanicId, difficulty: number): Gen {
  const params = difficultyParams(mechanic, difficulty) as Record<string, number>;

  if (mechanic === "phoneme_match") {
    const phonemes = shuffle(Object.keys(PHONEME_BANK));
    const optionCount = Math.min(4, Math.max(2, params.optionCount ?? 3));
    const roundCount = Math.min(8, Math.max(3, params.rounds ?? 5));
    const rounds = Array.from({ length: roundCount }).map((_, i) => {
      const target = phonemes[i % phonemes.length];
      const correct = shuffle(PHONEME_BANK[target])[0];
      const distractorPhonemes = phonemes.filter((p) => p !== target);
      const distractors = shuffle(distractorPhonemes)
        .slice(0, optionCount - 1)
        .map((p) => shuffle(PHONEME_BANK[p])[0]);
      const options = shuffle([
        { word: correct.word, emoji: correct.emoji, correct: true },
        ...distractors.map((d) => ({ word: d.word, emoji: d.emoji, correct: false })),
      ]);
      return {
        instruction: `Which word starts with the "${target}" sound?`,
        targetPhoneme: target,
        options,
      };
    });
    return {
      title: "Sound Safari",
      theme: "animals and friends",
      introNarration:
        "Listen closely! I'll say a sound. Tap the picture whose name starts with that sound.",
      content: { rounds },
    };
  }

  if (mechanic === "go_no_go") {
    return {
      title: "Robot Rescue",
      theme: "space robots",
      introNarration:
        "Tap the friendly robots as fast as you can. But watch out — never tap a sleepy robot. Hold still!",
      content: {
        instruction: "Tap the friendly robots. Don't tap the sleepy robots!",
        goLabel: "Friendly robots",
        noGoLabel: "Sleepy robots",
        goItems: [
          { label: "happy bot", emoji: "🤖" },
          { label: "star bot", emoji: "🌟" },
          { label: "rocket bot", emoji: "🚀" },
        ],
        noGoItems: [
          { label: "sleepy bot", emoji: "😴" },
          { label: "moon bot", emoji: "🌚" },
        ],
      },
    };
  }

  // memory_span
  return {
    title: "Critter Trail",
    theme: "forest critters",
    introNarration:
      "Watch the critters light up in order. Then tap them in the same order to remember the trail!",
    content: {
      instruction: "Repeat the sequence in the same order.",
      items: [
        { label: "fox", emoji: "🦊" },
        { label: "owl", emoji: "🦉" },
        { label: "frog", emoji: "🐸" },
        { label: "deer", emoji: "🦌" },
        { label: "bee", emoji: "🐝" },
        { label: "duck", emoji: "🦆" },
      ],
    },
  };
}
