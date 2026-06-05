// Mistake-friendly retry copy. Never says "wrong".
const LINES = [
  "Not quite — take another look.",
  "Close! Try once more.",
  "Almost there — give it another go.",
  "Good thinking, but not yet. Try again.",
  "Hmm, let's try that again.",
  "Nearly! One more try.",
];

const PRAISE = [
  "Nice — that's it.",
  "Exactly right.",
  "You got it.",
  "Well done.",
  "Perfect.",
  "Spot on.",
];

export function pickEncouragement(seed = 0): string {
  return LINES[Math.abs(seed) % LINES.length];
}

export function pickPraise(seed = 0): string {
  return PRAISE[Math.abs(seed) % PRAISE.length];
}
