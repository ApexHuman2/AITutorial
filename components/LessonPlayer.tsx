"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { Lesson, Step } from "@/lib/courseTypes";
import { WIDGETS, INTERACTIVE_TYPES } from "@/components/widgets";
import { speak, cancelSpeech, setVoiceEnabled, preloadVoice, onVoiceProgress } from "@/lib/speak";

/* ─── types ─────────────────────────────────────────────── */

type Instructor = {
  name: string;
  voiceId: string;
  avatarSeed: string;
  avatarStyle?: string;
  photoUrl?: string;
};

type Props = {
  lesson: Lesson;
  instructor?: Instructor;
  courseTitle?: string;
  hasNext?: boolean;
  onFinish: () => void;
  onNext: () => void;
  onExit: () => void;
};

/* ─── helpers ────────────────────────────────────────────── */

function avatarSrc(ins?: Instructor) {
  if (!ins) return `https://api.dicebear.com/9.x/lorelei/svg?seed=maria&backgroundColor=1e1e1e&radius=50`;
  if (ins.photoUrl) return ins.photoUrl;
  return `https://api.dicebear.com/9.x/${ins.avatarStyle ?? "lorelei"}/svg?seed=${encodeURIComponent(ins.avatarSeed)}&backgroundColor=1e1e1e&radius=50`;
}

function burst() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 },
    colors: ["#000000","#1e1e1e","#bababa","#d2c5aa"] });
}

function bigBurst() {
  const end = Date.now() + 1800;
  (function frame() {
    confetti({ particleCount: 6, angle: 60,  spread: 55, origin: { x: 0 },
      colors: ["#000000","#1e1e1e","#bababa","#d2c5aa","#876a30"] });
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 },
      colors: ["#000000","#1e1e1e","#bababa","#d2c5aa","#876a30"] });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

const STEP_LABELS: Partial<Record<Step["type"], string>> = {
  intro:           "Introduction",
  explainer:       "Concept",
  quiz:            "Quiz",
  "fill-blank":    "Fill in the blank",
  "true-false":    "True or false",
  "match-pairs":   "Match the pairs",
  "sort-sequence": "Put in order",
  "fraction-bar":  "Fraction bar",
  "pie-divider":   "Pizza slices",
  "number-line":   "Number line",
  "tap-label":     "Tap to label",
};

/**
 * Build what the tutor SAYS aloud for a step: the script, then the question,
 * then (for multiple choice) the choices read out. Never reads anything that
 * would give away the answer (e.g. the correct sort order or pair mapping).
 */
function composeNarration(step?: Step): string {
  if (!step) return "";
  const parts: string[] = [];
  if (step.script?.trim()) parts.push(step.script.trim());

  const LETTERS = ["A", "B", "C", "D", "E", "F"];

  switch (step.type) {
    case "intro":
    case "explainer":
      if (step.prompt?.trim()) parts.push(step.prompt.trim());
      break;

    case "quiz": {
      if (step.prompt?.trim()) parts.push(step.prompt.trim());
      const choices = step.choices ?? [];
      if (choices.length) {
        parts.push("Here are your choices.");
        choices.forEach((c, i) => parts.push(`${LETTERS[i] ?? i + 1}. ${c}.`));
      }
      break;
    }

    case "true-false":
      if (step.prompt?.trim()) parts.push(step.prompt.trim());
      parts.push("Is that true, or false?");
      break;

    case "fill-blank":
      if (step.prompt?.trim()) {
        parts.push(step.prompt.replace(/_+/g, " blank ").replace(/\s+/g, " ").trim());
      }
      break;

    // Read the instruction only — never the underlying answer data.
    case "match-pairs":
    case "sort-sequence":
    case "fraction-bar":
    case "pie-divider":
    case "number-line":
    case "tap-label":
      if (step.prompt?.trim()) parts.push(step.prompt.trim());
      break;
  }

  return parts.join(" ");
}

/* ─── main component ─────────────────────────────────────── */

export default function LessonPlayer({
  lesson, instructor, courseTitle = "", hasNext = true,
  onFinish, onNext, onExit,
}: Props) {
  const steps   = lesson.steps ?? [];
  const [idx,     setIdx]     = useState(0);
  const [solved,  setSolved]  = useState(false);
  const [voice,   setVoice]   = useState(true);
  const [done,    setDone]    = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"loading" | "hd" | "sd">("loading");
  const [voicePct, setVoicePct] = useState(0);
  const finishedRef = useRef(false);
  const idxRef = useRef(0);
  idxRef.current = idx;

  /* warm the HD model and react to its download progress */
  useEffect(() => {
    // Defer the heavy WASM init until after the lesson UI has painted,
    // so opening a lesson is instant and the model loads in the background.
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const kick = () => preloadVoice();
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(kick)
      : window.setTimeout(kick, 600);

    const unsub = onVoiceProgress((pct, st) => {
      setVoicePct(pct);
      // Just reflect the engine state in the badge. We deliberately do NOT
      // re-speak the current line when HD becomes ready — interrupting audio
      // mid-sentence is exactly what makes the voice seem to "stop midway".
      // The next step (or the replay button) will use HD automatically.
      if (st === "ready") setVoiceMode("hd");
      else if (st === "error") setVoiceMode("sd");
      else setVoiceMode((prev) => (prev === "hd" ? "hd" : "loading"));
    });
    return () => {
      unsub();
      const cancelIdle = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (cancelIdle) cancelIdle(id); else clearTimeout(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step       = steps[idx];
  const voiceId    = instructor?.voiceId ?? "af_heart";
  const tutorName  = instructor?.name    ?? "Maria";
  const avatar     = avatarSrc(instructor);
  const isInteractive = step ? INTERACTIVE_TYPES.includes(step.type) : false;
  const canContinue   = !isInteractive || solved;
  const isLast        = idx === steps.length - 1;

  // progress: each step counts fully once it's continuable
  const progressPct = steps.length
    ? ((idx + (canContinue ? 1 : 0)) / steps.length) * 100
    : 0;

  /* speak on step change */
  useEffect(() => {
    if (!step) return;
    setSolved(false);
    setHintOpen(false);
    if (voice) speak(composeNarration(step), voiceId);
    return cancelSpeech;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const go = () => {
    cancelSpeech();
    if (!isLast) {
      setIdx(i => i + 1);
    } else if (!finishedRef.current) {
      finishedRef.current = true;
      setDone(true);
      bigBurst();
      onFinish();
    }
  };

  const toggleVoice = () => {
    const nv = !voice;
    setVoice(nv);
    setVoiceEnabled(nv);
    if (nv && step) speak(composeNarration(step), voiceId);
    else cancelSpeech();
  };

  const WidgetComp = step ? WIDGETS[step.type] : null;

  if (done) return (
    <DoneScreen
      lesson={lesson} tutorName={tutorName} avatar={avatar}
      steps={steps.length} hasNext={hasNext}
      onNext={onNext} onExit={onExit}
    />
  );

  return (
    <div className="min-h-screen bg-pure-white text-absolute-black flex flex-col">

      {/* ── top bar ── */}
      <header className="sticky top-0 z-20 bg-pure-white/95 backdrop-blur-sm border-b border-absolute-black">
        <div className="flex items-center h-12 px-4 md:px-8 gap-4">
          <button
            onClick={() => { cancelSpeech(); onExit(); }}
            className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 hover:text-absolute-black transition-colors flex items-center gap-1.5"
          >
            <span>←</span> Exit
          </button>

          <div className="flex-1 min-w-0 text-center">
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 truncate">
              {courseTitle && <span className="mr-2 opacity-60">{courseTitle} /</span>}
              {lesson.title}
            </p>
          </div>

          <button
            onClick={toggleVoice}
            title={voice ? "Voice on" : "Voice off"}
            className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 hover:text-absolute-black transition-colors flex items-center gap-1.5"
          >
            <span>{voice ? "🔊" : "🔇"}</span>
            {voice && (
              <span className={`hidden sm:inline px-1.5 py-0.5 rounded-[2px] text-[9px] tabular-nums ${
                voiceMode === "hd"
                  ? "bg-off-black text-pure-white"
                  : voiceMode === "loading"
                    ? "border border-absolute-black/30 text-off-black/40 animate-pulse"
                    : "border border-absolute-black/30 text-off-black/40"
              }`}>
                {voiceMode === "hd"
                  ? "HD"
                  : voiceMode === "loading"
                    ? (voicePct > 0 ? `HD ${voicePct}%` : "HD…")
                    : "STD"}
              </span>
            )}
          </button>
        </div>

        {/* segmented progress bar */}
        <div className="flex gap-0.5 px-4 md:px-8 pb-3">
          {steps.map((_, i) => {
            const past    = i < idx;
            const current = i === idx;
            return (
              <div key={i} className="flex-1 h-1 rounded-full bg-absolute-black/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-absolute-black"
                  initial={{ width: past ? "100%" : "0%" }}
                  animate={{
                    width: past ? "100%" : current ? `${canContinue ? 100 : 0}%` : "0%",
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            );
          })}
        </div>
      </header>

      {/* ── body ── */}
      <div className="flex-1 flex flex-col items-center px-4 md:px-8 py-8 md:py-12">
        <div className="w-full max-w-[640px] flex flex-col gap-6">

          {/* step type label */}
          <motion.p
            key={`label-${idx}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40"
          >
            Step {idx + 1} of {steps.length} · {STEP_LABELS[step?.type] ?? step?.type}
          </motion.p>

          {/* ── tutor bubble ── */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={tutorName}
                className={`w-11 h-11 rounded-full border border-absolute-black bg-off-black
                  ${instructor?.photoUrl ? "object-cover grayscale" : "object-contain"}`}
              />
              {voice && (
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-off-black border-2 border-pure-white"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                  {tutorName}
                </span>
                <button
                  onClick={() => { if (step) speak(composeNarration(step), voiceId); }}
                  className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 hover:text-absolute-black transition-colors"
                >
                  ⟲ replay
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`script-${idx}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-light-concrete/30 border border-absolute-black/10 rounded-[3px] rounded-tl-none px-4 py-3"
                >
                  <p className="text-[17px] leading-[1.4]">{step?.script}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── widget card ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${idx}`}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="border border-absolute-black rounded-[3px] bg-pure-white overflow-hidden"
            >
              {/* card header stripe */}
              <div className="h-1 w-full bg-off-black/5" />

              <div className="p-5 md:p-7">
                {WidgetComp && isInteractive ? (
                  <WidgetComp
                    step={step as Step}
                    onSolved={() => { setSolved(true); burst(); }}
                  />
                ) : (
                  <NonInteractiveCard step={step} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── hint toggle (interactive steps only) ── */}
          {isInteractive && step.prompt && !solved && (
            <div>
              <button
                onClick={() => setHintOpen(h => !h)}
                className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 hover:text-absolute-black transition-colors flex items-center gap-1.5"
              >
                {hintOpen ? "▾" : "▸"} Hint
              </button>
              <AnimatePresence>
                {hintOpen && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 font-mono tracking-mono text-[12px] uppercase text-off-black/60 border-l-2 border-absolute-black/20 pl-3"
                  >
                    Read the question carefully. The tutor just explained it — tap replay if you need it again.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── bottom nav ── */}
          <div className="flex items-center justify-between pt-2">
            {/* back */}
            <button
              onClick={() => { if (idx > 0) { cancelSpeech(); setIdx(i => i - 1); } }}
              disabled={idx === 0}
              className="font-mono tracking-mono text-[12px] uppercase px-4 py-2.5 border border-absolute-black/30 rounded-[3px]
                text-off-black/50 hover:border-absolute-black hover:text-absolute-black transition-colors disabled:opacity-20 disabled:pointer-events-none"
            >
              ← Back
            </button>

            {/* status label */}
            <AnimatePresence mode="wait">
              {!canContinue ? (
                <motion.span
                  key="waiting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40"
                >
                  Answer to continue
                </motion.span>
              ) : solved ? (
                <motion.span
                  key="solved"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/70"
                >
                  ✓ Correct
                </motion.span>
              ) : (
                <motion.span key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
                  Ready
                </motion.span>
              )}
            </AnimatePresence>

            {/* continue */}
            <motion.button
              whileTap={canContinue ? { scale: 0.96 } : {}}
              onClick={canContinue ? go : undefined}
              disabled={!canContinue}
              className={`font-mono tracking-mono text-[12px] uppercase px-6 py-2.5 rounded-[3px] transition-all ${
                canContinue
                  ? "bg-off-black text-pure-white hover:bg-absolute-black shadow-sm"
                  : "bg-absolute-black/10 text-absolute-black/30 cursor-not-allowed"
              }`}
            >
              {isLast ? "Finish →" : "Continue →"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── non-interactive step card ──────────────────────────── */

function NonInteractiveCard({ step }: { step?: Step }) {
  if (!step) return null;
  return (
    <div className="py-2 space-y-3">
      {step.type === "intro" && (
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
            Let's begin
          </span>
          <div className="flex-1 h-px bg-absolute-black/10" />
        </div>
      )}
      {step.type === "explainer" && (
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
            Concept
          </span>
          <div className="flex-1 h-px bg-absolute-black/10" />
        </div>
      )}
      {step.prompt ? (
        <p className="text-[19px] leading-[1.45]">{step.prompt}</p>
      ) : (
        <p className="text-[15px] leading-[1.5] text-off-black/50">
          Listen to {step.type === "intro" ? "the introduction" : "the explanation"}, then hit Continue.
        </p>
      )}
    </div>
  );
}

/* ─── celebration / done screen ──────────────────────────── */

function DoneScreen({
  lesson, tutorName, avatar, steps, hasNext, onNext, onExit,
}: {
  lesson: Lesson;
  tutorName: string;
  avatar: string;
  steps: number;
  hasNext: boolean;
  onNext: () => void;
  onExit: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-pure-white text-absolute-black flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* background grid decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center max-w-[480px] w-full"
          >
            {/* avatar */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
              className="relative inline-block mb-6"
            >
              <img src={avatar} alt={tutorName}
                className="w-24 h-24 rounded-full border-2 border-absolute-black bg-off-black object-contain mx-auto" />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-off-black text-pure-white rounded-full grid place-items-center text-[14px]"
              >
                ✓
              </motion.span>
            </motion.div>

            {/* text */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
                Lesson complete
              </p>
              <h1 className="mt-3 text-[48px] md:text-[56px] leading-[1] tracking-[-0.02em]">
                Nice work.
              </h1>
              <p className="mt-4 text-[16px] leading-[1.5] text-off-black/70 max-w-[36ch] mx-auto">
                "{lesson.title}" is done. {tutorName} is proud of you.
              </p>
            </motion.div>

            {/* stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="mt-8 grid grid-cols-2 border border-absolute-black rounded-[3px] divide-x divide-absolute-black"
            >
              <div className="px-6 py-4">
                <p className="text-[32px] leading-none tabular-nums">{steps}</p>
                <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
                  Steps finished
                </p>
              </div>
              <div className="px-6 py-4">
                <p className="text-[32px] leading-none">✦</p>
                <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
                  Streak updated
                </p>
              </div>
            </motion.div>

            {/* buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
              className="mt-6 flex gap-3 justify-center"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onExit}
                className="font-mono tracking-mono text-[12px] uppercase px-6 py-3 border border-absolute-black rounded-[3px] hover:bg-light-concrete/40 transition-colors"
              >
                Back to course
              </motion.button>

              {hasNext ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={onNext}
                  className="font-mono tracking-mono text-[12px] uppercase px-8 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors flex items-center gap-2"
                >
                  Next lesson <span>→</span>
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onExit}
                  className="font-mono tracking-mono text-[12px] uppercase px-8 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors"
                >
                  Course complete ✦
                </motion.button>
              )}
            </motion.div>

            {/* replay confetti */}
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              onClick={bigBurst}
              className="mt-6 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/30 hover:text-absolute-black transition-colors"
            >
              ✦ celebrate again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
