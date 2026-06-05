import confetti from "canvas-confetti";

const MONO = ["#000000", "#1e1e1e", "#bababa", "#d2c5aa", "#876a30"];

export function celebrateBurst() {
  confetti({
    particleCount: 70,
    spread: 72,
    origin: { y: 0.6 },
    colors: MONO,
    scalar: 0.9,
  });
}

export function celebrateBig() {
  const end = Date.now() + 600;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: MONO });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: MONO });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
