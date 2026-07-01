/**
 * Screening item banks. Built from public paradigms (not copyrighted
 * instruments). Kept simple, concrete, and picturable for young children.
 */

export type PhonemeTrial = {
  // Three words; two share a starting sound, one is the odd one out.
  options: { word: string; emoji: string; odd: boolean }[];
};

export const PHONEME_ODD_TRIALS: PhonemeTrial[] = [
  {
    options: [
      { word: "ball", emoji: "⚽", odd: false },
      { word: "bear", emoji: "🐻", odd: false },
      { word: "sun", emoji: "☀️", odd: true },
    ],
  },
  {
    options: [
      { word: "moon", emoji: "🌙", odd: false },
      { word: "mouse", emoji: "🐭", odd: false },
      { word: "fish", emoji: "🐟", odd: true },
    ],
  },
  {
    options: [
      { word: "cat", emoji: "🐱", odd: false },
      { word: "key", emoji: "🔑", odd: false },
      { word: "tree", emoji: "🌳", odd: true },
    ],
  },
  {
    options: [
      { word: "sock", emoji: "🧦", odd: false },
      { word: "snake", emoji: "🐍", odd: false },
      { word: "duck", emoji: "🦆", odd: true },
    ],
  },
  {
    options: [
      { word: "fire", emoji: "🔥", odd: false },
      { word: "fox", emoji: "🦊", odd: false },
      { word: "ball", emoji: "⚽", odd: true },
    ],
  },
];

export type WordTrial = { text: string; isReal: boolean };

export const WORD_NONWORD_TRIALS: WordTrial[] = [
  { text: "cat", isReal: true },
  { text: "blish", isReal: false },
  { text: "tree", isReal: true },
  { text: "dran", isReal: false },
  { text: "milk", isReal: true },
  { text: "ploon", isReal: false },
  { text: "jump", isReal: true },
  { text: "fude", isReal: false },
  { text: "star", isReal: true },
  { text: "vope", isReal: false },
];

export type RapidItem = { name: string; emoji: string };

export const RAPID_ITEMS: RapidItem[] = [
  { name: "sun", emoji: "☀️" },
  { name: "dog", emoji: "🐶" },
  { name: "cup", emoji: "☕" },
  { name: "car", emoji: "🚗" },
  { name: "fish", emoji: "🐟" },
  { name: "hat", emoji: "🎩" },
];

export const SPAN_ITEMS: RapidItem[] = [
  { name: "apple", emoji: "🍎" },
  { name: "star", emoji: "⭐" },
  { name: "moon", emoji: "🌙" },
  { name: "leaf", emoji: "🍃" },
  { name: "bell", emoji: "🔔" },
  { name: "key", emoji: "🔑" },
];

export const GO_NO_GO_CONTENT = {
  goLabel: "Green frogs",
  noGoLabel: "Red crabs",
  goItems: [
    { label: "frog", emoji: "🐸" },
    { label: "turtle", emoji: "🐢" },
  ],
  noGoItems: [{ label: "crab", emoji: "🦀" }],
};
