"use client";

import { motion, AnimatePresence, Reorder } from "motion/react";
import { useMemo, useState } from "react";
import type { Step } from "@/lib/courseTypes";
import { celebrateBurst } from "@/lib/confetti";
import { pickEncouragement, pickPraise } from "@/lib/encouragement";

/* ───────────────────────── shared ───────────────────────── */

export type WidgetProps = {
  step: Step;
  onSolved: () => void;
};

function Feedback({ state, attempts }: { state: "idle" | "wrong" | "right"; attempts: number }) {
  return (
    <div className="h-6 mt-4 text-center">
      <AnimatePresence mode="wait">
        {state === "wrong" && (
          <motion.p key="w" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-mono tracking-mono text-[12px] uppercase text-off-black/70">
            ⚠ {pickEncouragement(attempts)}
          </motion.p>
        )}
        {state === "right" && (
          <motion.p key="r" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-mono tracking-mono text-[12px] uppercase">
            ✓ {pickPraise(attempts)}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Prompt({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-[19px] leading-[1.25] mb-5">{children}</p>;
}

/* ───────────────────────── Quiz ───────────────────────── */

export function QuizCard({ step, onSolved }: WidgetProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);
  const answer = Number(step.answer ?? 0);

  const choose = (i: number) => {
    if (state === "right") return;
    setPicked(i);
    if (i === answer) {
      setState("right");
      celebrateBurst();
      onSolved();
    } else {
      setState("wrong");
      setAttempts((a) => a + 1);
    }
  };

  return (
    <div>
      <Prompt>{step.prompt}</Prompt>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(step.choices ?? []).map((c, i) => {
          const isPicked = picked === i;
          const isRight = state === "right" && i === answer;
          const isWrong = state === "wrong" && isPicked;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => choose(i)}
              animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
              className={`text-left px-4 py-3 rounded-[3px] border font-mono text-[15px] transition-colors ${
                isRight
                  ? "bg-off-black text-pure-white border-off-black"
                  : isWrong
                    ? "border-absolute-black bg-light-concrete/40"
                    : "border-absolute-black hover:bg-light-concrete/30"
              }`}
            >
              <span className="font-mono tracking-mono-sm text-[10px] uppercase opacity-50 mr-2">
                {String.fromCharCode(65 + i)}
              </span>
              {c}
            </motion.button>
          );
        })}
      </div>
      <Feedback state={state} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── True / False ───────────────────────── */

export function TrueFalse({ step, onSolved }: WidgetProps) {
  const correct = String(step.answer) === "true";
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);

  const choose = (v: boolean) => {
    if (state === "right") return;
    setPicked(v);
    if (v === correct) { setState("right"); celebrateBurst(); onSolved(); }
    else { setState("wrong"); setAttempts((a) => a + 1); }
  };

  return (
    <div>
      <Prompt>{step.prompt}</Prompt>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((v) => {
          const isRight = state === "right" && v === correct;
          const isWrong = state === "wrong" && picked === v;
          return (
            <motion.button
              key={String(v)}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(v)}
              animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
              className={`py-6 rounded-[3px] border font-mono tracking-mono text-[15px] uppercase transition-colors ${
                isRight ? "bg-off-black text-pure-white border-off-black" : "border-absolute-black hover:bg-light-concrete/30"
              }`}
            >
              {v ? "✓ True" : "✗ False"}
            </motion.button>
          );
        })}
      </div>
      <Feedback state={state} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── Fill in the blank ───────────────────────── */

export function FillBlank({ step, onSolved }: WidgetProps) {
  const [val, setVal] = useState("");
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);
  const answer = String(step.answer ?? "").trim().toLowerCase();

  const check = () => {
    if (state === "right") return;
    if (val.trim().toLowerCase() === answer && answer) {
      setState("right"); celebrateBurst(); onSolved();
    } else { setState("wrong"); setAttempts((a) => a + 1); }
  };

  // Render the prompt with the blank highlighted
  const parts = (step.prompt ?? "___").split("___");

  return (
    <div>
      <p className="text-[19px] leading-[1.4] mb-5">
        {parts[0]}
        <span className="inline-block min-w-[80px] border-b-2 border-absolute-black mx-1 text-center font-mono">
          {state === "right" ? step.answer : val || "?"}
        </span>
        {parts[1]}
      </p>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
          disabled={state === "right"}
          placeholder="Type your answer…"
          className="flex-1 font-mono text-[15px] px-3 py-3 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-2 focus:ring-absolute-black disabled:opacity-60"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={check}
          disabled={state === "right" || !val.trim()}
          className="font-mono tracking-mono text-[12px] uppercase px-6 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40"
        >
          Check
        </motion.button>
      </div>
      <Feedback state={state} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── Match pairs ───────────────────────── */

export function MatchPairs({ step, onSolved }: WidgetProps) {
  const pairs = step.pairs ?? [];
  const rights = useMemo(() => shuffle(pairs.map((p, i) => ({ text: p.right, idx: i }))), [pairs]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, boolean>>({});
  const [wrongShake, setWrongShake] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const tryMatch = (rightIdx: number) => {
    if (selectedLeft === null) return;
    if (selectedLeft === rightIdx) {
      const next = { ...matched, [selectedLeft]: true };
      setMatched(next);
      setSelectedLeft(null);
      if (Object.keys(next).length === pairs.length) { celebrateBurst(); onSolved(); }
    } else {
      setWrongShake(rightIdx);
      setAttempts((a) => a + 1);
      setTimeout(() => setWrongShake(null), 400);
    }
  };

  const done = Object.keys(matched).length === pairs.length;

  return (
    <div>
      <Prompt>{step.prompt}</Prompt>
      <div className="grid grid-cols-2 gap-4">
        {/* left column */}
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <button
              key={i}
              disabled={matched[i]}
              onClick={() => setSelectedLeft(i)}
              className={`w-full text-left px-3 py-3 rounded-[3px] border font-mono text-[14px] transition-colors ${
                matched[i]
                  ? "bg-off-black text-pure-white border-off-black opacity-60"
                  : selectedLeft === i
                    ? "border-absolute-black ring-2 ring-absolute-black bg-light-concrete/40"
                    : "border-absolute-black hover:bg-light-concrete/30"
              }`}
            >
              {p.left}
            </button>
          ))}
        </div>
        {/* right column (shuffled) */}
        <div className="space-y-2">
          {rights.map((r) => (
            <motion.button
              key={r.idx}
              disabled={matched[r.idx]}
              onClick={() => tryMatch(r.idx)}
              animate={wrongShake === r.idx ? { x: [0, -5, 5, -3, 3, 0] } : {}}
              className={`w-full text-left px-3 py-3 rounded-[3px] border font-mono text-[14px] transition-colors ${
                matched[r.idx]
                  ? "bg-off-black text-pure-white border-off-black opacity-60"
                  : "border-absolute-black hover:bg-light-concrete/30"
              }`}
            >
              {r.text}
            </motion.button>
          ))}
        </div>
      </div>
      <Feedback state={done ? "right" : attempts > 0 ? "wrong" : "idle"} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── Sort sequence ───────────────────────── */

export function SortSequence({ step, onSolved }: WidgetProps) {
  const correct = step.items ?? [];
  const [order, setOrder] = useState<string[]>(() => shuffle(correct));
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);

  const check = () => {
    if (state === "right") return;
    if (order.every((v, i) => v === correct[i])) { setState("right"); celebrateBurst(); onSolved(); }
    else { setState("wrong"); setAttempts((a) => a + 1); }
  };

  return (
    <div>
      <Prompt>{step.prompt ?? "Drag into the correct order."}</Prompt>
      <Reorder.Group axis="y" values={order} onReorder={(v) => { setOrder(v); setState("idle"); }} className="space-y-2">
        {order.map((item, i) => (
          <Reorder.Item key={item} value={item}
            className="flex items-center gap-3 px-3 py-3 rounded-[3px] border border-absolute-black bg-pure-white cursor-grab active:cursor-grabbing font-mono text-[14px]"
          >
            <span className="font-mono tracking-mono-sm text-[10px] text-off-black/40 tabular-nums">{i + 1}</span>
            <span className="flex-1">{item}</span>
            <span className="text-off-black/30">⠿</span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="mt-4 flex justify-center">
        <motion.button whileTap={{ scale: 0.97 }} onClick={check} disabled={state === "right"}
          className="font-mono tracking-mono text-[12px] uppercase px-8 py-2.5 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40">
          Check order
        </motion.button>
      </div>
      <Feedback state={state} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── Fraction bar ───────────────────────── */

export function FractionBar({ step, onSolved }: WidgetProps) {
  const denom = Math.max(2, step.denominator ?? 4);
  const target = Math.min(denom, Math.max(0, step.numerator ?? 1));
  const [filled, setFilled] = useState<boolean[]>(Array(denom).fill(false));
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);
  const count = filled.filter(Boolean).length;

  const toggle = (i: number) => {
    if (state === "right") return;
    setFilled((f) => f.map((v, idx) => (idx === i ? !v : v)));
    setState("idle");
  };

  const check = () => {
    if (count === target) { setState("right"); celebrateBurst(); onSolved(); }
    else { setState("wrong"); setAttempts((a) => a + 1); }
  };

  return (
    <div>
      <Prompt>{step.prompt ?? `Show ${target}/${denom}`}</Prompt>
      <div className="flex border-2 border-absolute-black rounded-[3px] overflow-hidden">
        {filled.map((on, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`flex-1 h-16 border-r-2 border-absolute-black last:border-r-0 transition-colors ${on ? "bg-off-black" : "bg-pure-white hover:bg-light-concrete/40"}`}
          />
        ))}
      </div>
      <p className="mt-3 text-center font-mono tracking-mono text-[15px] tabular-nums">{count}/{denom}</p>
      <div className="mt-3 flex justify-center">
        <motion.button whileTap={{ scale: 0.97 }} onClick={check} disabled={state === "right"}
          className="font-mono tracking-mono text-[12px] uppercase px-8 py-2.5 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40">
          Check
        </motion.button>
      </div>
      <Feedback state={state} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── Pie divider ───────────────────────── */

export function PieDivider({ step, onSolved }: WidgetProps) {
  const denom = Math.max(2, step.denominator ?? 4);
  const target = Math.min(denom, Math.max(0, step.numerator ?? 1));
  const [on, setOn] = useState<boolean[]>(Array(denom).fill(false));
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);
  const count = on.filter(Boolean).length;

  const toggle = (i: number) => { if (state !== "right") { setOn((s) => s.map((v, idx) => idx === i ? !v : v)); setState("idle"); } };
  const check = () => { if (count === target) { setState("right"); celebrateBurst(); onSolved(); } else { setState("wrong"); setAttempts((a) => a + 1); } };

  const R = 100;
  const slices = on.map((_, i) => {
    const a0 = (i / denom) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / denom) * 2 * Math.PI - Math.PI / 2;
    const x0 = R * Math.cos(a0), y0 = R * Math.sin(a0);
    const x1 = R * Math.cos(a1), y1 = R * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M 0 0 L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  });

  return (
    <div>
      <Prompt>{step.prompt ?? `Tap ${target}/${denom} of the pizza`}</Prompt>
      <div className="grid place-items-center">
        <svg viewBox="-110 -110 220 220" className="w-[220px] h-[220px]">
          <circle cx="0" cy="0" r={R} fill="none" stroke="#000" strokeWidth="2" />
          {slices.map((d, i) => (
            <path key={i} d={d} onClick={() => toggle(i)}
              stroke="#000" strokeWidth="1.5" style={{ cursor: "pointer" }}
              fill={on[i] ? "#1e1e1e" : "#ffffff"} />
          ))}
        </svg>
      </div>
      <p className="mt-2 text-center font-mono tracking-mono text-[15px] tabular-nums">{count}/{denom}</p>
      <div className="mt-3 flex justify-center">
        <motion.button whileTap={{ scale: 0.97 }} onClick={check} disabled={state === "right"}
          className="font-mono tracking-mono text-[12px] uppercase px-8 py-2.5 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40">
          Check
        </motion.button>
      </div>
      <Feedback state={state} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── Number line ───────────────────────── */

export function NumberLine({ step, onSolved }: WidgetProps) {
  const min = step.min ?? 0;
  const max = step.max ?? 10;
  const target = step.target ?? Math.round((min + max) / 2);
  const [val, setVal] = useState(min);
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);

  const check = () => {
    if (state === "right") return;
    if (val === target) { setState("right"); celebrateBurst(); onSolved(); }
    else { setState("wrong"); setAttempts((a) => a + 1); }
  };

  const ticks = [];
  for (let n = min; n <= max; n++) ticks.push(n);

  return (
    <div>
      <Prompt>{step.prompt ?? `Find ${target}`}</Prompt>
      <div className="px-2 py-6">
        <input
          type="range" min={min} max={max} step={1} value={val}
          onChange={(e) => { setVal(Number(e.target.value)); setState("idle"); }}
          className="w-full accent-[#1e1e1e]"
        />
        <div className="flex justify-between mt-2">
          {ticks.map((n) => (
            <span key={n} className={`font-mono text-[12px] tabular-nums ${n === val ? "text-absolute-black font-bold" : "text-off-black/40"}`}>
              {n}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center font-mono tracking-mono text-[19px] tabular-nums">You picked: {val}</p>
      <div className="mt-3 flex justify-center">
        <motion.button whileTap={{ scale: 0.97 }} onClick={check} disabled={state === "right"}
          className="font-mono tracking-mono text-[12px] uppercase px-8 py-2.5 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40">
          Check
        </motion.button>
      </div>
      <Feedback state={state} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── Tap to label ───────────────────────── */

export function TapLabel({ step, onSolved }: WidgetProps) {
  const labels = step.labels ?? [];
  const [targetIdx, setTargetIdx] = useState(0);
  const [found, setFound] = useState<boolean[]>(Array(labels.length).fill(false));
  const [attempts, setAttempts] = useState(0);
  const [wrong, setWrong] = useState(false);

  const current = labels[targetIdx];
  const done = found.every(Boolean);

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (done || !current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const dist = Math.hypot(x - current.x, y - current.y);
    if (dist < 14) {
      const next = found.map((f, i) => (i === targetIdx ? true : f));
      setFound(next);
      setWrong(false);
      if (next.every(Boolean)) { celebrateBurst(); onSolved(); }
      else {
        const nextIdx = next.findIndex((f) => !f);
        setTargetIdx(nextIdx);
      }
    } else {
      setWrong(true);
      setAttempts((a) => a + 1);
      setTimeout(() => setWrong(false), 400);
    }
  };

  return (
    <div>
      <Prompt>{current && !done ? <>Tap the <b>{current.text}</b></> : step.prompt}</Prompt>
      <motion.div
        onClick={onTap}
        animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        className="relative w-full aspect-[4/3] rounded-[3px] border border-absolute-black overflow-hidden bg-light-concrete/30 cursor-crosshair select-none"
        style={step.imageUrl ? { backgroundImage: `url(${step.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {!step.imageUrl && (
          <div className="absolute inset-0 grid place-items-center font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
            diagram
          </div>
        )}
        {/* reveal found markers */}
        {labels.map((l, i) =>
          found[i] ? (
            <motion.div
              key={i}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1"
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
            >
              <span className="w-3 h-3 rounded-full bg-off-black border-2 border-pure-white" />
              <span className="font-mono tracking-mono-sm text-[10px] uppercase bg-off-black text-pure-white px-1.5 py-0.5 rounded-[2px] whitespace-nowrap">
                {l.text}
              </span>
            </motion.div>
          ) : null
        )}
      </motion.div>
      <p className="mt-3 text-center font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 tabular-nums">
        {found.filter(Boolean).length} / {labels.length} found
      </p>
      <Feedback state={done ? "right" : attempts > 0 ? "wrong" : "idle"} attempts={attempts} />
    </div>
  );
}

/* ───────────────────────── registry ───────────────────────── */

export const WIDGETS: Partial<Record<Step["type"], React.ComponentType<WidgetProps>>> = {
  quiz: QuizCard,
  "true-false": TrueFalse,
  "fill-blank": FillBlank,
  "match-pairs": MatchPairs,
  "sort-sequence": SortSequence,
  "fraction-bar": FractionBar,
  "pie-divider": PieDivider,
  "number-line": NumberLine,
  "tap-label": TapLabel,
};

export const INTERACTIVE_TYPES = Object.keys(WIDGETS) as Step["type"][];

/* ───────────────────────── util ───────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // guard: avoid identical-to-input shuffle for short arrays
  if (a.length > 1 && a.every((v, i) => v === arr[i])) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}
