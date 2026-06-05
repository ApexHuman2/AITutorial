"use client";

import { motion, AnimatePresence, Reorder } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Course, Lesson, Step, Instructor } from "@/lib/courseTypes";

const STEP_TYPES: Step["type"][] = [
  "intro", "explainer", "quiz", "fill-blank", "true-false",
  "match-pairs", "sort-sequence", "fraction-bar", "pie-divider",
  "number-line", "tap-label",
];

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);

  const load = async () => {
    const [courseRes, instrRes] = await Promise.all([
      fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
      fetch("/api/admin/instructors").then((r) => r.json()),
    ]);
    setCourse(courseRes.course);
    setLessons(courseRes.lessons ?? []);
    setInstructors(instrRes.instructors ?? []);
  };

  useEffect(() => { load(); }, [id]);

  const saveCourse = async () => {
    if (!course) return;
    setSaving(true);
    await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: course.title,
        subject: course.subject,
        description: course.description,
        overview: course.overview,
        gradeBand: course.gradeBand,
        instructorId: course.instructorId,
        freeTier: course.freeTier,
      }),
    });
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const togglePublish = async () => {
    const res = await fetch(`/api/admin/courses/${id}/publish`, { method: "POST" });
    const { status } = await res.json();
    setCourse((c) => c ? { ...c, status } : c);
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/admin/courses/${id}/lessons/${lessonId}`, { method: "DELETE" });
    setLessons((ls) => ls.filter((l) => l.id !== lessonId));
    if (activeLesson === lessonId) setActiveLesson(null);
  };

  const regenerateWithAI = async () => {
    if (!course) return;
    if (!confirm("This will generate new lessons and add them to this course. Continue?")) return;
    const gen = await fetch("/api/admin/generate-lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: course.title, subject: course.subject, description: course.description, gradeBand: course.gradeBand }),
    });
    const { lessons: generated, error } = await gen.json();
    if (error) { alert("AI generation failed: " + error); return; }
    await Promise.all(
      (generated ?? []).map((l: Omit<Lesson, "id" | "order">) =>
        fetch(`/api/admin/courses/${id}/lessons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(l),
        })
      )
    );
    load();
  };

  if (!course) return <Loading />;

  const instructor = instructors.find((i) => i.id === course.instructorId);
  const expandedLesson = lessons.find((l) => l.id === activeLesson);

  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <header className="border-b border-absolute-black px-4 md:px-6 h-12 flex items-center gap-3">
        <button onClick={() => router.push("/admin/courses")} className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 hover:text-absolute-black">
          ← Courses
        </button>
        <span className="text-off-black/30">/</span>
        <p className="font-mono tracking-mono-sm text-[10px] uppercase truncate flex-1">{course.title}</p>
        <span className={`font-mono tracking-mono-sm text-[10px] uppercase px-2 py-0.5 rounded-[2px] border shrink-0 ${
          course.status === "published" ? "bg-off-black text-pure-white border-off-black" : "border-absolute-black/40 text-off-black/60"
        }`}>
          {course.status}
        </span>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">

        {/* LEFT: Course fields + lesson list */}
        <div className="w-full md:w-[340px] shrink-0 border-r border-absolute-black flex flex-col overflow-y-auto">

          {/* Course meta */}
          <div className="px-5 py-6 border-b border-absolute-black space-y-4">
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">Title</label>
              <input
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full font-mono text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-1 focus:ring-absolute-black"
              />
            </div>
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">Description</label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                rows={2}
                className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-1 focus:ring-absolute-black resize-none"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">Subject</label>
                <select
                  value={course.subject}
                  onChange={(e) => setCourse({ ...course, subject: e.target.value as Course["subject"] })}
                  className="font-mono tracking-mono text-[12px] uppercase px-2 py-1.5 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none"
                >
                  {["Math", "Science", "Language Arts"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">Grade</label>
                <select
                  value={course.gradeBand}
                  onChange={(e) => setCourse({ ...course, gradeBand: e.target.value })}
                  className="font-mono tracking-mono text-[12px] uppercase px-2 py-1.5 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none"
                >
                  {["4-6", "5-8", "6-9", "7-10", "9-12"].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => setCourse({ ...course, freeTier: !course.freeTier })}
                  className={`w-9 h-5 rounded-full border-2 transition-colors relative mt-auto ${course.freeTier ? "bg-off-black border-off-black" : "border-absolute-black"}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-pure-white transition-transform ${course.freeTier ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <label className="font-mono tracking-mono-sm text-[10px] uppercase mb-1">Free</label>
              </div>
            </div>

            {/* Instructor mini-card */}
            {instructor && (
              <div className="flex items-center gap-3 border border-absolute-black/30 px-3 py-2 rounded-[3px]">
                <img
                  src={instructor.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${instructor.avatarSeed}&backgroundColor=1e1e1e&radius=50`}
                  className="w-7 h-7 rounded-full object-cover"
                  alt={instructor.name}
                />
                <div>
                  <p className="font-mono tracking-mono text-[12px] uppercase">{instructor.name}</p>
                  <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">{instructor.voiceId}</p>
                </div>
              </div>
            )}

            {/* Save / Publish */}
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={saveCourse} disabled={saving}
                className="flex-1 font-mono tracking-mono text-[12px] uppercase px-3 py-2 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={togglePublish}
                className={`flex-1 font-mono tracking-mono text-[12px] uppercase px-3 py-2 rounded-[3px] border transition-colors ${
                  course.status === "published"
                    ? "border-absolute-black hover:bg-off-black hover:text-pure-white"
                    : "bg-off-black text-pure-white border-off-black hover:bg-absolute-black"
                }`}
              >
                {course.status === "published" ? "Unpublish" : "Publish"}
              </motion.button>
            </div>
            {savedAt && (
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">✓ Saved {savedAt}</p>
            )}
          </div>

          {/* Lesson list */}
          <div className="flex-1">
            <div className="flex items-center justify-between px-5 py-3 border-b border-absolute-black">
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={regenerateWithAI}
                  className="font-mono tracking-mono-sm text-[10px] uppercase px-2 py-1 border border-absolute-black/40 rounded-[2px] text-off-black/60 hover:border-absolute-black hover:text-absolute-black transition-colors"
                >
                  ✦ AI
                </button>
                <button
                  onClick={() => setShowAddLesson(true)}
                  className="font-mono tracking-mono-sm text-[10px] uppercase px-2 py-1 bg-off-black text-pure-white rounded-[2px] hover:bg-absolute-black transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>

            {lessons.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">No lessons yet</p>
                <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">Use "+ Add" or "✦ AI"</p>
              </div>
            ) : (
              <ul>
                {lessons.map((lesson, i) => (
                  <motion.li
                    key={lesson.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b border-absolute-black/20 hover:bg-light-concrete/30 transition-colors ${
                      activeLesson === lesson.id ? "bg-off-black text-pure-white hover:bg-off-black" : ""
                    }`}
                    onClick={() => setActiveLesson(activeLesson === lesson.id ? null : lesson.id)}
                  >
                    <span className={`font-mono tracking-mono-sm text-[10px] tabular-nums shrink-0 ${activeLesson === lesson.id ? "text-pure-white/60" : "text-off-black/40"}`}>
                      {String(lesson.order).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[15px] truncate">{lesson.title}</span>
                    <span className={`font-mono tracking-mono-sm text-[10px] shrink-0 ${activeLesson === lesson.id ? "text-pure-white/60" : "text-off-black/40"}`}>
                      {lesson.steps?.length ?? 0} steps
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}
                      className={`shrink-0 text-[12px] hover:text-red-500 transition-colors ${activeLesson === lesson.id ? "text-pure-white/50" : "text-off-black/30"}`}
                    >
                      ×
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT: Lesson step editor */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {expandedLesson ? (
              <LessonEditor
                key={expandedLesson.id}
                courseId={id}
                lesson={expandedLesson}
                onSaved={(updated) => {
                  setLessons((ls) => ls.map((l) => l.id === updated.id ? updated : l));
                }}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px] text-center px-8"
              >
                <div>
                  <p className="text-[32px] leading-none tracking-[-0.02em]">Select a lesson.</p>
                  <p className="mt-3 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
                    Click a lesson on the left to edit its steps.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {showAddLesson && (
          <AddLessonModal
            courseId={id}
            nextOrder={lessons.length + 1}
            onClose={() => setShowAddLesson(false)}
            onAdded={(lesson) => {
              setLessons((ls) => [...ls, lesson]);
              setActiveLesson(lesson.id);
              setShowAddLesson(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- LESSON STEP EDITOR ---------- */
function LessonEditor({
  courseId,
  lesson,
  onSaved,
}: {
  courseId: string;
  lesson: Lesson;
  onSaved: (l: Lesson) => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [objective, setObjective] = useState(lesson.objective);
  const [steps, setSteps] = useState<Step[]>(lesson.steps ?? []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/admin/courses/${courseId}/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, objective, steps }),
    });
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
    onSaved({ ...lesson, title, objective, steps });
  };

  const addStep = (type: Step["type"]) => {
    const defaultsByType: Partial<Record<Step["type"], Partial<Step>>> = {
      quiz: { choices: ["Option A", "Option B", "Option C", "Option D"], answer: 0 },
      "fill-blank": { answer: "" },
      "true-false": { answer: "true" },
      "match-pairs": { pairs: [{ left: "", right: "" }, { left: "", right: "" }] },
      "sort-sequence": { items: ["", "", ""] },
      "fraction-bar": { numerator: 1, denominator: 4 },
      "pie-divider": { numerator: 1, denominator: 4 },
      "number-line": { min: 0, max: 10, target: 5 },
      "tap-label": { labels: [{ x: 50, y: 50, text: "" }] },
    };
    const defaults = defaultsByType[type] ?? {};
    setSteps([...steps, { type, script: "", prompt: "", ...defaults } as Step]);
  };

  const updateStep = (i: number, patch: Partial<Step>) => {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } as Step : s)));
  };

  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3 }}
      className="px-6 md:px-8 py-8 space-y-8"
    >
      {/* Lesson meta */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">Lesson {lesson.order}</span>
          <div className="flex-1 h-[1px] bg-absolute-black/10" />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-[24px] leading-tight border-b border-absolute-black/30 bg-transparent focus:outline-none focus:border-absolute-black pb-1"
          placeholder="Lesson title"
        />
        <input
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Learning objective — one sentence"
          className="w-full font-mono tracking-mono text-[12px] uppercase bg-transparent border-b border-absolute-black/20 focus:outline-none focus:border-absolute-black pb-1 text-off-black/70"
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">{steps.length} step{steps.length !== 1 ? "s" : ""}</p>
        </div>

        <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-3">
          {steps.map((step, i) => (
            <Reorder.Item key={`${i}-${step.type}`} value={step}>
              <StepCard
                step={step}
                index={i}
                onChange={(patch) => updateStep(i, patch)}
                onRemove={() => removeStep(i)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Add step */}
        <div className="border border-dashed border-absolute-black/30 rounded-[3px] p-4">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-3">Add step</p>
          <div className="flex flex-wrap gap-1.5">
            {STEP_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => addStep(t)}
                className="font-mono tracking-mono-sm text-[10px] uppercase px-3 py-1.5 border border-absolute-black/40 rounded-[2px] hover:bg-off-black hover:text-pure-white hover:border-off-black transition-colors"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 sticky bottom-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving}
          className="font-mono tracking-mono text-[12px] uppercase px-8 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40 shadow-lg"
        >
          {saving ? "Saving…" : "Save lesson"}
        </motion.button>
        {savedAt && (
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">✓ Saved {savedAt}</span>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- STEP CARD ---------- */
function StepCard({ step, index, onChange, onRemove }: {
  step: Step;
  index: number;
  onChange: (p: Partial<Step>) => void;
  onRemove: () => void;
}) {
  const bg: Record<string, string> = {
    intro: "bg-off-black/5",
    explainer: "bg-off-black/5",
    quiz: "bg-off-black/[0.03]",
    "fill-blank": "bg-off-black/[0.03]",
    "true-false": "bg-off-black/[0.03]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border border-absolute-black rounded-[3px] ${bg[step.type] ?? ""}`}
    >
      {/* Step header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-absolute-black/20 cursor-grab active:cursor-grabbing">
        <span className="font-mono tracking-mono-sm text-[10px] text-off-black/40 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <span className="font-mono tracking-mono text-[12px] uppercase flex-1">{step.type}</span>
        <button onClick={onRemove} className="text-off-black/30 hover:text-red-500 text-[16px] transition-colors">×</button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Script — always present */}
        <div>
          <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-1">Tutor script (spoken aloud)</label>
          <textarea
            value={step.script}
            onChange={(e) => onChange({ script: e.target.value })}
            rows={2}
            placeholder="What Maria or Marco will say…"
            className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black/40 rounded-[3px] bg-pure-white/80 focus:outline-none focus:ring-1 focus:ring-absolute-black resize-none"
          />
        </div>

        {/* Type-specific fields */}
        {(step.type === "quiz" || step.type === "fill-blank" || step.type === "true-false") && (
          <div>
            <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-1">Question / prompt</label>
            <input
              value={step.prompt ?? ""}
              onChange={(e) => onChange({ prompt: e.target.value })}
              className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black/40 rounded-[3px] bg-pure-white/80 focus:outline-none focus:ring-1 focus:ring-absolute-black"
            />
          </div>
        )}

        {step.type === "quiz" && (
          <>
            <div className="space-y-1.5">
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">Choices (click ✓ to mark correct)</label>
              {(step.choices ?? ["", "", "", ""]).map((c, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <button
                    onClick={() => onChange({ answer: ci })}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${step.answer === ci ? "border-off-black bg-off-black" : "border-absolute-black/30"}`}
                  />
                  <input
                    value={c}
                    onChange={(e) => {
                      const next = [...(step.choices ?? ["", "", "", ""])];
                      next[ci] = e.target.value;
                      onChange({ choices: next });
                    }}
                    placeholder={`Choice ${ci + 1}`}
                    className="flex-1 font-mono text-[13px] px-3 py-1.5 border border-absolute-black/30 rounded-[3px] bg-pure-white/80 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {step.type === "fill-blank" && (
          <div>
            <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-1">Correct answer</label>
            <input
              value={step.answer as string ?? ""}
              onChange={(e) => onChange({ answer: e.target.value })}
              placeholder="The answer the student must type"
              className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black/40 rounded-[3px] bg-pure-white/80 focus:outline-none"
            />
          </div>
        )}

        {step.type === "true-false" && (
          <div className="flex gap-2">
            {["true", "false"].map((v) => (
              <button
                key={v}
                onClick={() => onChange({ answer: v })}
                className={`font-mono tracking-mono text-[12px] uppercase px-4 py-1.5 rounded-[3px] border transition-colors ${
                  step.answer === v ? "bg-off-black text-pure-white border-off-black" : "border-absolute-black/40 hover:bg-light-concrete/40"
                }`}
              >
                {v === "true" ? "✓ True" : "✗ False"}
              </button>
            ))}
            <span className="ml-2 font-mono tracking-mono-sm text-[10px] uppercase self-center text-off-black/50">
              = correct answer
            </span>
          </div>
        )}

        {(step.type === "fraction-bar" || step.type === "pie-divider") && (
          <div className="flex gap-4 items-end">
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-1">Numerator</label>
              <input type="number" min={1} value={step.numerator ?? 1} onChange={(e) => onChange({ numerator: +e.target.value })}
                className="w-20 font-mono text-[15px] px-3 py-2 border border-absolute-black/40 rounded-[3px] bg-pure-white/80 focus:outline-none" />
            </div>
            <span className="text-[24px] pb-1">/</span>
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-1">Denominator</label>
              <input type="number" min={1} value={step.denominator ?? 4} onChange={(e) => onChange({ denominator: +e.target.value })}
                className="w-20 font-mono text-[15px] px-3 py-2 border border-absolute-black/40 rounded-[3px] bg-pure-white/80 focus:outline-none" />
            </div>
          </div>
        )}

        {step.type === "number-line" && (
          <div className="flex gap-3 items-end flex-wrap">
            {([["min", "Min"], ["max", "Max"], ["target", "Target"]] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-1">{label}</label>
                <input
                  type="number"
                  value={(step[key] as number) ?? 0}
                  onChange={(e) => onChange({ [key]: +e.target.value } as Partial<Step>)}
                  className="w-24 font-mono text-[15px] px-3 py-2 border border-absolute-black/40 rounded-[3px] bg-pure-white/80 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {step.type === "match-pairs" && (
          <div className="space-y-2">
            <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">Pairs (left ↔ right)</label>
            {(step.pairs ?? []).map((p, pi) => (
              <div key={pi} className="flex items-center gap-2">
                <input
                  value={p.left}
                  onChange={(e) => {
                    const next = [...(step.pairs ?? [])];
                    next[pi] = { ...next[pi], left: e.target.value };
                    onChange({ pairs: next });
                  }}
                  placeholder="Term"
                  className="flex-1 font-mono text-[13px] px-3 py-1.5 border border-absolute-black/30 rounded-[3px] bg-pure-white/80 focus:outline-none"
                />
                <span className="text-off-black/40">↔</span>
                <input
                  value={p.right}
                  onChange={(e) => {
                    const next = [...(step.pairs ?? [])];
                    next[pi] = { ...next[pi], right: e.target.value };
                    onChange({ pairs: next });
                  }}
                  placeholder="Match"
                  className="flex-1 font-mono text-[13px] px-3 py-1.5 border border-absolute-black/30 rounded-[3px] bg-pure-white/80 focus:outline-none"
                />
                <button onClick={() => onChange({ pairs: (step.pairs ?? []).filter((_, idx) => idx !== pi) })}
                  className="text-off-black/30 hover:text-red-500 text-[14px]">×</button>
              </div>
            ))}
            <button
              onClick={() => onChange({ pairs: [...(step.pairs ?? []), { left: "", right: "" }] })}
              className="font-mono tracking-mono-sm text-[10px] uppercase px-3 py-1 border border-absolute-black/40 rounded-[2px] hover:bg-off-black hover:text-pure-white transition-colors"
            >
              + Add pair
            </button>
          </div>
        )}

        {step.type === "sort-sequence" && (
          <div className="space-y-2">
            <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
              Items in the CORRECT order (shuffled for the student)
            </label>
            {(step.items ?? []).map((it, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <span className="font-mono tracking-mono-sm text-[10px] text-off-black/40 tabular-nums w-5">{ii + 1}</span>
                <input
                  value={it}
                  onChange={(e) => {
                    const next = [...(step.items ?? [])];
                    next[ii] = e.target.value;
                    onChange({ items: next });
                  }}
                  className="flex-1 font-mono text-[13px] px-3 py-1.5 border border-absolute-black/30 rounded-[3px] bg-pure-white/80 focus:outline-none"
                />
                <button onClick={() => onChange({ items: (step.items ?? []).filter((_, idx) => idx !== ii) })}
                  className="text-off-black/30 hover:text-red-500 text-[14px]">×</button>
              </div>
            ))}
            <button
              onClick={() => onChange({ items: [...(step.items ?? []), ""] })}
              className="font-mono tracking-mono-sm text-[10px] uppercase px-3 py-1 border border-absolute-black/40 rounded-[2px] hover:bg-off-black hover:text-pure-white transition-colors"
            >
              + Add item
            </button>
          </div>
        )}

        {step.type === "tap-label" && (
          <div className="space-y-3">
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-1">Image URL (optional)</label>
              <input
                value={step.imageUrl ?? ""}
                onChange={(e) => onChange({ imageUrl: e.target.value })}
                placeholder="https://…"
                className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black/40 rounded-[3px] bg-pure-white/80 focus:outline-none"
              />
            </div>
            <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
              Tap targets — x / y are 0–100% of the image
            </label>
            {(step.labels ?? []).map((lab, li) => (
              <div key={li} className="flex items-center gap-2">
                <input value={lab.text}
                  onChange={(e) => { const next = [...(step.labels ?? [])]; next[li] = { ...next[li], text: e.target.value }; onChange({ labels: next }); }}
                  placeholder="Label" className="flex-1 font-mono text-[13px] px-3 py-1.5 border border-absolute-black/30 rounded-[3px] bg-pure-white/80 focus:outline-none" />
                <input type="number" min={0} max={100} value={lab.x}
                  onChange={(e) => { const next = [...(step.labels ?? [])]; next[li] = { ...next[li], x: +e.target.value }; onChange({ labels: next }); }}
                  className="w-16 font-mono text-[13px] px-2 py-1.5 border border-absolute-black/30 rounded-[3px] bg-pure-white/80 focus:outline-none" />
                <input type="number" min={0} max={100} value={lab.y}
                  onChange={(e) => { const next = [...(step.labels ?? [])]; next[li] = { ...next[li], y: +e.target.value }; onChange({ labels: next }); }}
                  className="w-16 font-mono text-[13px] px-2 py-1.5 border border-absolute-black/30 rounded-[3px] bg-pure-white/80 focus:outline-none" />
                <button onClick={() => onChange({ labels: (step.labels ?? []).filter((_, idx) => idx !== li) })}
                  className="text-off-black/30 hover:text-red-500 text-[14px]">×</button>
              </div>
            ))}
            <button
              onClick={() => onChange({ labels: [...(step.labels ?? []), { x: 50, y: 50, text: "" }] })}
              className="font-mono tracking-mono-sm text-[10px] uppercase px-3 py-1 border border-absolute-black/40 rounded-[2px] hover:bg-off-black hover:text-pure-white transition-colors"
            >
              + Add target
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- ADD LESSON MODAL ---------- */
function AddLessonModal({
  courseId,
  nextOrder,
  onClose,
  onAdded,
}: {
  courseId: string;
  nextOrder: number;
  onClose: () => void;
  onAdded: (lesson: Lesson) => void;
}) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/admin/courses/${courseId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, objective, steps: [] }),
    });
    const { id, order } = await res.json();
    setBusy(false);
    onAdded({ id, title, objective, order: order ?? nextOrder, steps: [] });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-absolute-black/40" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[440px] bg-pure-white border border-absolute-black rounded-[3px] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="font-mono tracking-mono text-[12px] uppercase">New lesson — #{nextOrder}</p>
          <button onClick={onClose} className="text-[18px] hover:opacity-60">×</button>
        </div>
        <div>
          <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            autoFocus placeholder="e.g. What is a fraction?"
            className="w-full font-mono text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] focus:outline-none focus:ring-1 focus:ring-absolute-black" />
        </div>
        <div>
          <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">Objective</label>
          <input value={objective} onChange={(e) => setObjective(e.target.value)}
            placeholder="Students will be able to…"
            className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black/50 rounded-[3px] focus:outline-none focus:ring-1 focus:ring-absolute-black" />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={add} disabled={busy || !title.trim()}
          className="w-full font-mono tracking-mono text-[12px] uppercase px-4 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add lesson →"}
        </motion.button>
      </motion.div>
    </>
  );
}

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 animate-pulse">Loading…</p>
    </div>
  );
}
