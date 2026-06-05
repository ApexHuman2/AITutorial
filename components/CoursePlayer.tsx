"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Lesson, Step } from "@/lib/courseTypes";
import { WIDGETS, INTERACTIVE_TYPES } from "@/components/widgets";
import { speak, cancelSpeech, isVoiceEnabled, setVoiceEnabled } from "@/lib/speak";
import { celebrateBig } from "@/lib/confetti";

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1e1e&radius=50`;
}

type Instructor = { name: string; voiceId: string; avatarSeed: string; avatarStyle?: string; photoUrl?: string };

export default function CoursePlayer({
  lesson,
  instructor,
  onFinish,
  onNext,
  onExit,
  hasNext = true,
}: {
  lesson: Lesson;
  instructor?: Instructor;
  onFinish: () => void;   // fired once when the lesson is completed (record progress)
  onNext: () => void;     // go to the next lesson
  onExit: () => void;     // back to course detail
  hasNext?: boolean;
}) {
  const steps = lesson.steps ?? [];
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [voice, setVoice] = useState(true);
  const [done, setDone] = useState(false);
  const step = steps[idx];

  const voiceId = instructor?.voiceId ?? "af_heart";
  const tutorName = instructor?.name ?? "Maria";
  const avatar = instructor?.photoUrl || dicebearUrl(instructor?.avatarStyle ?? "lorelei", instructor?.avatarSeed ?? "maria");

  const isInteractive = step && INTERACTIVE_TYPES.includes(step.type);
  const canContinue = !isInteractive || solved;

  // Speak the tutor script whenever the step changes
  useEffect(() => {
    if (!step) return;
    setSolved(false);
    if (voice) speak(step.script, voiceId);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const next = () => {
    cancelSpeech();
    if (idx < steps.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setDone(true);
      celebrateBig();
      onFinish();
    }
  };

  const toggleVoice = () => {
    const nv = !voice;
    setVoice(nv);
    setVoiceEnabled(nv);
    if (nv && step) speak(step.script, voiceId);
    else cancelSpeech();
  };

  const replay = () => { if (step) speak(step.script, voiceId); };

  const progress = steps.length ? ((idx + (canContinue ? 1 : 0)) / steps.length) * 100 : 0;

  const Widget = step && WIDGETS[step.type];

  if (done) return <DoneScreen lesson={lesson} tutorName={tutorName} avatar={avatar} onNext={onNext} onExit={onExit} hasNext={hasNext} />;

  return (
    <div className="min-h-screen bg-pure-white text-absolute-black flex flex-col">
      {/* top bar */}
      <header className="border-b border-absolute-black h-12 flex items-center px-4 md:px-6 gap-4 shrink-0 sticky top-0 bg-pure-white/90 backdrop-blur-md z-10">
        <button onClick={() => { cancelSpeech(); onExit(); }} className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 hover:text-absolute-black">
          ← Exit
        </button>
        <p className="font-mono tracking-mono-sm text-[10px] uppercase truncate flex-1">{lesson.title}</p>
        <button onClick={toggleVoice} className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 hover:text-absolute-black">
          {voice ? "🔊 Voice on" : "🔇 Voice off"}
        </button>
        <span className="font-mono tracking-mono-sm text-[10px] uppercase tabular-nums shrink-0">
          {idx + 1} / {steps.length}
        </span>
      </header>

      {/* progress */}
      <div className="h-[3px] bg-absolute-black/10 shrink-0">
        <motion.div className="h-full bg-absolute-black" animate={{ width: `${progress}%` }} transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }} />
      </div>

      {/* body */}
      <div className="flex-1 flex flex-col items-center px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-[640px]">

          {/* tutor speech bubble */}
          <div className="flex items-start gap-3 mb-8">
            <img src={avatar} alt={tutorName} className={`w-12 h-12 rounded-full border border-absolute-black bg-off-black shrink-0 ${instructor?.photoUrl ? "object-cover grayscale" : "object-contain"}`} />
            <div className="flex-1">
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 flex items-center gap-2">
                {tutorName}
                <button onClick={replay} className="hover:text-absolute-black" title="Hear again">⟲</button>
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-1.5 text-[17px] leading-[1.35]"
                >
                  {step?.script}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* widget / content card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="border border-absolute-black rounded-[3px] p-5 md:p-7 bg-pure-white"
            >
              {Widget && isInteractive ? (
                <Widget step={step as Step} onSolved={() => setSolved(true)} />
              ) : (
                <NonInteractive step={step} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* continue */}
          <div className="mt-8 flex items-center justify-between">
            <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
              {isInteractive && !solved ? "Answer to continue" : "Ready"}
            </span>
            <motion.button
              whileTap={{ scale: canContinue ? 0.97 : 1 }}
              onClick={next}
              disabled={!canContinue}
              animate={canContinue ? { opacity: 1 } : { opacity: 0.4 }}
              className="font-mono tracking-mono text-[12px] uppercase px-8 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:cursor-not-allowed"
            >
              {idx === steps.length - 1 ? "Finish →" : "Continue →"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NonInteractive({ step }: { step?: Step }) {
  if (!step) return null;
  // intro / explainer — show a calm content block
  return (
    <div className="py-2">
      <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
        {step.type === "intro" ? "Let's begin" : "Concept"}
      </span>
      {step.prompt && <p className="mt-3 text-[19px] leading-[1.4]">{step.prompt}</p>}
      {!step.prompt && (
        <p className="mt-3 text-[15px] leading-[1.5] text-off-black/60">
          When you're ready, hit Continue.
        </p>
      )}
    </div>
  );
}

function DoneScreen({
  lesson, tutorName, avatar, onNext, onExit, hasNext,
}: {
  lesson: Lesson; tutorName: string; avatar: string; onNext: () => void; onExit: () => void; hasNext: boolean;
}) {
  return (
    <div className="min-h-screen bg-pure-white text-absolute-black flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-[460px]"
      >
        <img src={avatar} alt={tutorName} className="w-20 h-20 rounded-full border border-absolute-black bg-off-black object-contain mx-auto" />
        <p className="mt-6 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">Lesson complete</p>
        <h1 className="mt-3 text-[40px] leading-[1.05] tracking-[-0.02em]">Nice work.</h1>
        <p className="mt-3 text-[15px] leading-[1.5] text-off-black/70">
          You finished <b>{lesson.title}</b>. {tutorName} is proud of you.
        </p>
        <div className="mt-8 flex gap-2 justify-center">
          <button onClick={onExit} className="font-mono tracking-mono text-[12px] uppercase px-6 py-3 border border-absolute-black rounded-[3px] hover:bg-light-concrete/40 transition-colors">
            Back to course
          </button>
          {hasNext && (
            <button onClick={onNext} className="font-mono tracking-mono text-[12px] uppercase px-6 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors">
              Next lesson →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
