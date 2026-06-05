"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import type { Course, Instructor } from "@/lib/courseTypes";

/* ─── helpers ────────────────────────────────────────────────────────────── */

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1e1e&radius=50`;
}

const GRADE_BANDS = ["4-6", "5-8", "6-9", "7-10", "9-12"];
const SUBJECTS    = ["Math", "Science", "Language Arts"];

const SUBJECT_META: Record<string, { label: string; icon: string }> = {
  Math:            { label: "Mathematics", icon: "∑" },
  Science:         { label: "Science",     icon: "⬡" },
  "Language Arts": { label: "Language",    icon: "Aa" },
};

/* ─── page ───────────────────────────────────────────────────────────────── */

export default function AdminCoursesPage() {
  const [courses,     setCourses]     = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [drawer,      setDrawer]      = useState<{ open: boolean; course?: Course }>({ open: false });
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [publishing,  setPublishing]  = useState<string | null>(null);
  const [filter,      setFilter]      = useState<"all" | "published" | "draft">("all");

  const load = async () => {
    const [c, i] = await Promise.all([
      fetch("/api/admin/courses").then((r) => r.json()),
      fetch("/api/admin/instructors").then((r) => r.json()),
    ]);
    setCourses(c.courses ?? []);
    setInstructors(i.instructors ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (id: string) => {
    setPublishing(id);
    await fetch(`/api/admin/courses/${id}/publish`, { method: "POST" });
    await load();
    setPublishing(null);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Delete this course and all its lessons? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  const getInstructor = (id: string) => instructors.find((i) => i.id === id);

  const visible = courses.filter((c) =>
    filter === "all" ? true : c.status === filter
  );

  const published = courses.filter((c) => c.status === "published").length;
  const draft     = courses.filter((c) => c.status === "draft").length;

  return (
    <div className="flex flex-col flex-1">

      {/* ── top bar ── */}
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 shrink-0">
            § 02 — Courses
          </p>
          {/* filter pills */}
          <div className="hidden sm:flex gap-1">
            {(["all", "published", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-mono tracking-mono-sm text-[10px] uppercase px-3 py-1 rounded-[3px] border transition-colors ${
                  filter === f
                    ? "bg-off-black text-pure-white border-off-black"
                    : "border-absolute-black/30 text-off-black/60 hover:border-absolute-black"
                }`}
              >
                {f === "all" ? `All (${courses.length})` : f === "published" ? `Live (${published})` : `Draft (${draft})`}
              </button>
            ))}
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setDrawer({ open: true })}
          className="font-mono tracking-mono text-[12px] uppercase px-4 py-1.5 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors flex items-center gap-2 shrink-0"
        >
          <span>+</span> New course
        </motion.button>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10">

        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-[40px] leading-[1.05] tracking-[-0.02em]">Course catalog.</h1>
          <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            {courses.length} course{courses.length !== 1 ? "s" : ""} · {published} published · {draft} draft
          </p>
        </motion.div>

        {/* ── loading ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-absolute-black/20 rounded-[3px] h-72 animate-pulse bg-light-concrete/20" />
            ))}
          </div>
        )}

        {/* ── empty state ── */}
        {!loading && courses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="border border-absolute-black/30 rounded-[3px] p-12 text-center"
          >
            <p className="text-[24px] leading-none">No courses yet.</p>
            <p className="mt-3 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 max-w-[34ch] mx-auto">
              Click "+ New course" to create your first one. Make sure you have an instructor set up first.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setDrawer({ open: true })}
              className="mt-8 font-mono tracking-mono text-[12px] uppercase px-6 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors"
            >
              + Create first course
            </motion.button>
          </motion.div>
        )}

        {/* ── course cards ── */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                instructor={getInstructor(course.instructorId)}
                index={i}
                publishing={publishing === course.id}
                deleting={deleting === course.id}
                onEdit={() => setDrawer({ open: true, course })}
                onTogglePublish={() => togglePublish(course.id)}
                onDelete={() => deleteCourse(course.id)}
              />
            ))}

            {/* add another card */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: visible.length * 0.06 }}
              onClick={() => setDrawer({ open: true })}
              className="border border-dashed border-absolute-black/40 rounded-[3px] min-h-[280px] flex flex-col items-center justify-center gap-3 hover:border-absolute-black hover:bg-light-concrete/20 transition-colors group"
            >
              <span className="text-[32px] text-off-black/30 group-hover:text-absolute-black transition-colors">+</span>
              <span className="font-mono tracking-mono text-[12px] uppercase text-off-black/50 group-hover:text-absolute-black transition-colors">
                New course
              </span>
            </motion.button>
          </div>
        )}

        {/* ── empty filter state ── */}
        {!loading && courses.length > 0 && visible.length === 0 && (
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 text-center py-16">
            No {filter} courses.
          </p>
        )}

      </main>

      {/* ── drawer ── */}
      <AnimatePresence>
        {drawer.open && (
          <CourseDrawer
            course={drawer.course}
            instructors={instructors}
            onClose={() => setDrawer({ open: false })}
            onSaved={(id, goToEditor) => {
              setDrawer({ open: false });
              if (goToEditor) {
                window.location.href = `/admin/courses/${id}`;
              } else {
                load();
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── course card ─────────────────────────────────────────────────────────── */

function CourseCard({
  course,
  instructor,
  index,
  publishing,
  deleting,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  course: Course;
  instructor?: Instructor;
  index: number;
  publishing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const meta = SUBJECT_META[course.subject] ?? { label: course.subject, icon: "◫" };
  const avatarStyle = (instructor as (Instructor & { avatarStyle?: string }) | undefined)?.avatarStyle ?? "lorelei";
  const avatarSrc = instructor?.photoUrl
    ? instructor.photoUrl
    : instructor
      ? dicebearUrl(avatarStyle, instructor.avatarSeed)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="border border-absolute-black rounded-[3px] overflow-hidden flex flex-col group"
    >
      {/* colour band — subject indicator */}
      <div className={`h-1 w-full ${course.subject === "Math" ? "bg-off-black" : course.subject === "Science" ? "bg-light-concrete" : "bg-absolute-black/40"}`} />

      {/* card body */}
      <div className="flex-1 p-6 flex flex-col gap-4">

        {/* top row: subject + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono tracking-mono text-[14px]">{meta.icon}</span>
            <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              {meta.label}
            </span>
          </div>
          <span className={`font-mono tracking-mono-sm text-[10px] uppercase px-2 py-0.5 rounded-[2px] border ${
            course.status === "published"
              ? "bg-off-black text-pure-white border-off-black"
              : "border-absolute-black/40 text-off-black/50"
          }`}>
            {course.status}
          </span>
        </div>

        {/* title */}
        <h3 className="text-[22px] leading-[1.15] tracking-[-0.01em] flex-1">
          {course.title}
        </h3>

        {/* description excerpt */}
        {course.description && (
          <p className="text-[13px] leading-[1.5] text-off-black/70 line-clamp-3">
            {course.description}
          </p>
        )}

        {/* meta strip */}
        <div className="flex items-center gap-3 pt-2 border-t border-absolute-black/10">
          {/* instructor */}
          {instructor && (
            <div className="flex items-center gap-2 min-w-0">
              {avatarSrc && (
                <img
                  src={avatarSrc}
                  alt={instructor.name}
                  className={`w-7 h-7 rounded-full border border-absolute-black/20 bg-off-black shrink-0 ${instructor.photoUrl ? "object-cover grayscale" : "object-contain"}`}
                />
              )}
              <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/70 truncate">
                {instructor.name}
              </span>
            </div>
          )}
          <span className="ml-auto font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 shrink-0">
            Gr {course.gradeBand} · {course.lessonCount ?? 0} lessons
          </span>
        </div>

        {/* free badge */}
        {course.freeTier && (
          <span className="self-start font-mono tracking-mono-sm text-[10px] uppercase px-2 py-0.5 border border-absolute-black/30 rounded-[2px] text-off-black/50">
            Free tier
          </span>
        )}
      </div>

      {/* action bar */}
      <div className="border-t border-absolute-black/20 grid grid-cols-4 divide-x divide-absolute-black/20">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onEdit}
          className="py-2.5 font-mono tracking-mono-sm text-[10px] uppercase text-center hover:bg-off-black hover:text-pure-white transition-colors"
        >
          Edit
        </motion.button>
        <motion.a
          href={`/admin/courses/${course.id}`}
          whileTap={{ scale: 0.97 }}
          className="py-2.5 font-mono tracking-mono-sm text-[10px] uppercase text-center hover:bg-off-black hover:text-pure-white transition-colors"
        >
          Lessons
        </motion.a>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onTogglePublish}
          disabled={publishing}
          className="py-2.5 font-mono tracking-mono-sm text-[10px] uppercase text-center hover:bg-off-black hover:text-pure-white transition-colors disabled:opacity-40"
        >
          {publishing ? "…" : course.status === "published" ? "Unpublish" : "Publish"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDelete}
          disabled={deleting}
          className="py-2.5 font-mono tracking-mono-sm text-[10px] uppercase text-center text-off-black/40 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          {deleting ? "…" : "Delete"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── create / edit drawer ───────────────────────────────────────────────── */

function CourseDrawer({
  course,
  instructors,
  onClose,
  onSaved,
}: {
  course?: Course;
  instructors: Instructor[];
  onClose: () => void;
  onSaved: (id: string, goToEditor: boolean) => void;
}) {
  const isEdit = Boolean(course);

  const [title,        setTitle]        = useState(course?.title        ?? "");
  const [subject,      setSubject]      = useState(course?.subject      ?? "Math");
  const [gradeBand,    setGradeBand]    = useState(course?.gradeBand    ?? "5-8");
  const [instructorId, setInstructorId] = useState(course?.instructorId ?? instructors[0]?.id ?? "");
  const [description,  setDescription]  = useState(course?.description  ?? "");
  const [freeTier,     setFreeTier]     = useState(course?.freeTier     ?? false);
  const [busy,         setBusy]         = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [err,          setErr]          = useState<string | null>(null);

  // ── AI generation controls (new courses only) ──
  const [lessonCount,  setLessonCount]  = useState(6);
  const [topicInput,   setTopicInput]   = useState("");
  const [topics,       setTopics]       = useState<string[]>(course?.topics ?? []);

  const addTopic = () => {
    const t = topicInput.trim();
    if (!t) return;
    setTopics((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTopicInput("");
  };
  const removeTopic = (t: string) => setTopics((prev) => prev.filter((x) => x !== t));

  // keep instructorId in sync when instructors load
  useEffect(() => {
    if (!instructorId && instructors.length > 0) setInstructorId(instructors[0].id);
  }, [instructors, instructorId]);

  const validate = () => {
    if (!title.trim())   { setErr("Course title is required."); return false; }
    if (!instructorId)   { setErr("Please choose an instructor."); return false; }
    if (!description.trim()) { setErr("Please write a course description."); return false; }
    setErr(null);
    return true;
  };

  const save = async (withAI = false) => {
    if (!validate()) return;
    setBusy(true);

    if (isEdit && course) {
      // ── edit existing ──
      await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, description, instructorId, gradeBand, freeTier, topics }),
      });
      setBusy(false);
      onSaved(course.id, false);
      return;
    }

    // ── create new ──
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, description, instructorId, gradeBand, freeTier }),
    });
    const { id, error } = await res.json();
    if (error || !id) { setErr(error ?? "Something went wrong."); setBusy(false); return; }

    if (withAI) {
      setGenerating(true);
      const gen = await fetch("/api/admin/generate-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, description, gradeBand, lessonCount, topics }),
      });
      const { lessons, error: genErr } = await gen.json();
      if (!genErr && lessons?.length) {
        await Promise.all(
          lessons.map((l: { title: string; objective: string; steps: unknown[] }) =>
            fetch(`/api/admin/courses/${id}/lessons`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(l),
            })
          )
        );
      }
      setGenerating(false);
    }

    setBusy(false);
    onSaved(id, true);
  };

  const selectedInstructor = instructors.find((i) => i.id === instructorId);
  const avatarStyle = (selectedInstructor as (Instructor & { avatarStyle?: string }) | undefined)?.avatarStyle ?? "lorelei";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-absolute-black/40"
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[560px] bg-pure-white border-l border-absolute-black flex flex-col shadow-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 h-12 border-b border-absolute-black shrink-0">
          <p className="font-mono tracking-mono text-[12px] uppercase">
            {isEdit ? `Editing — ${course!.title}` : "New course"}
          </p>
          <button onClick={onClose} className="text-[20px] hover:opacity-60 leading-none">×</button>
        </div>

        {/* form */}
        <div className="flex-1 overflow-y-auto">

          {/* ── preview band ── */}
          <div className="bg-off-black px-6 py-5 flex items-center gap-4">
            {selectedInstructor ? (
              <>
                <img
                  src={selectedInstructor.photoUrl || dicebearUrl(avatarStyle, selectedInstructor.avatarSeed)}
                  alt={selectedInstructor.name}
                  className={`w-12 h-12 rounded-full border border-pure-white/20 bg-off-black shrink-0 ${selectedInstructor.photoUrl ? "object-cover grayscale" : "object-contain"}`}
                />
                <div className="min-w-0">
                  <p className="text-pure-white text-[19px] leading-tight truncate">
                    {title || "Course title…"}
                  </p>
                  <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/60 flex items-center gap-3">
                    <span>{SUBJECT_META[subject]?.icon} {subject}</span>
                    <span>·</span>
                    <span>{selectedInstructor.name}</span>
                    <span>·</span>
                    <span>Gr {gradeBand}</span>
                  </p>
                </div>
              </>
            ) : (
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/50">
                Fill in the form below — preview appears here.
              </p>
            )}
          </div>

          <div className="px-6 py-7 space-y-7">

            {/* title */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">
                Course title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fractions of a whole"
                autoFocus
                className="w-full text-[19px] leading-tight px-3 py-2.5 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-2 focus:ring-absolute-black"
              />
            </div>

            {/* subject */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">
                Subject *
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`flex items-center gap-2 font-mono tracking-mono text-[12px] uppercase px-4 py-2 rounded-[3px] border transition-colors ${
                      subject === s
                        ? "bg-off-black text-pure-white border-off-black"
                        : "border-absolute-black hover:bg-light-concrete/40"
                    }`}
                  >
                    <span>{SUBJECT_META[s]?.icon}</span>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* grade band */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">
                Recommended grade level *
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {GRADE_BANDS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGradeBand(g)}
                    className={`font-mono tracking-mono text-[12px] uppercase px-4 py-2 rounded-[3px] border transition-colors ${
                      gradeBand === g
                        ? "bg-off-black text-pure-white border-off-black"
                        : "border-absolute-black hover:bg-light-concrete/40"
                    }`}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>

            {/* instructor */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">
                Tutor *
              </label>
              {instructors.length === 0 ? (
                <div className="border border-absolute-black/30 rounded-[3px] px-4 py-3">
                  <p className="font-mono tracking-mono text-[12px] uppercase text-off-black/60">
                    No instructors yet —{" "}
                    <a href="/admin/instructors" className="underline hover:opacity-70">
                      create one first
                    </a>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {instructors.map((ins) => {
                    const style = (ins as Instructor & { avatarStyle?: string }).avatarStyle ?? "lorelei";
                    const src = ins.photoUrl || dicebearUrl(style, ins.avatarSeed);
                    const active = instructorId === ins.id;
                    return (
                      <motion.button
                        key={ins.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setInstructorId(ins.id)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-[3px] border text-left transition-colors ${
                          active
                            ? "bg-off-black text-pure-white border-off-black"
                            : "border-absolute-black hover:bg-light-concrete/30"
                        }`}
                      >
                        <img
                          src={src}
                          alt={ins.name}
                          className={`w-10 h-10 rounded-full shrink-0 bg-off-black ${ins.photoUrl ? "object-cover grayscale" : "object-contain"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] leading-tight">{ins.name}</p>
                          <p className={`mt-0.5 font-mono tracking-mono-sm text-[10px] uppercase ${active ? "text-pure-white/60" : "text-off-black/50"}`}>
                            {ins.subject} · {ins.voiceId}
                          </p>
                          {ins.bio && (
                            <p className={`mt-1 text-[12px] leading-tight truncate ${active ? "text-pure-white/70" : "text-off-black/60"}`}>
                              {ins.bio}
                            </p>
                          )}
                        </div>
                        <span className={`text-[16px] shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-0"}`}>✓</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* description */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">
                Course description * <span className="text-off-black/40 normal-case">— 1 or 2 paragraphs</span>
              </label>
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 mb-2">
                This is shown to students and parents on the course page.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder={"Paragraph 1 — what this course covers and why it matters.\n\nParagraph 2 — what the student will be able to do by the end."}
                className="w-full font-mono text-[14px] leading-[1.6] px-3 py-3 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-2 focus:ring-absolute-black resize-none"
              />
              <p className={`mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-right tabular-nums ${description.length > 600 ? "text-red-500" : "text-off-black/30"}`}>
                {description.length} / 600
              </p>
            </div>

            {/* ── AI generation options (new courses only) ── */}
            {!isEdit && (
              <div className="border border-absolute-black rounded-[3px] p-4 space-y-5 bg-off-black/[0.03]">
                <div className="flex items-center gap-2">
                  <span className="font-mono tracking-mono text-[12px]">✦</span>
                  <p className="font-mono tracking-mono-sm text-[10px] uppercase">AI generation options</p>
                </div>

                {/* lesson count */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                      Number of lessons
                    </label>
                    <span className="font-mono tracking-mono text-[15px] tabular-nums">{lessonCount}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={lessonCount}
                    onChange={(e) => setLessonCount(Number(e.target.value))}
                    className="w-full accent-[#1e1e1e]"
                  />
                  <div className="flex justify-between font-mono tracking-mono-sm text-[10px] text-off-black/40 mt-1">
                    <span>1</span><span>12</span>
                  </div>
                </div>

                {/* topics */}
                <div>
                  <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">
                    Topics to cover <span className="text-off-black/40 normal-case">— one per lesson, optional</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }}
                      placeholder="e.g. Adding fractions"
                      className="flex-1 font-mono text-[13px] px-3 py-2 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-1 focus:ring-absolute-black"
                    />
                    <button
                      onClick={addTopic}
                      className="font-mono tracking-mono text-[12px] uppercase px-4 py-2 border border-absolute-black rounded-[3px] hover:bg-off-black hover:text-pure-white transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {topics.map((t, i) => (
                        <motion.span
                          key={t}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1.5 font-mono tracking-mono-sm text-[10px] uppercase pl-2.5 pr-1.5 py-1 bg-off-black text-pure-white rounded-[2px]"
                        >
                          <span className="opacity-50 tabular-nums">{i + 1}</span>
                          <span>{t}</span>
                          <button onClick={() => removeTopic(t)} className="hover:text-red-400 text-[12px] leading-none">×</button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
                    {topics.length > 0
                      ? `${topics.length} topic${topics.length !== 1 ? "s" : ""} · AI follows this order`
                      : "Leave empty and AI will choose the topic sequence."}
                  </p>
                </div>
              </div>
            )}

            {/* free tier */}
            <div className="flex items-center gap-4 py-3 border-t border-b border-absolute-black/10">
              <div className="flex-1">
                <p className="font-mono tracking-mono text-[12px] uppercase">Free tier</p>
                <p className="mt-0.5 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
                  Free accounts can access this course without a subscription.
                </p>
              </div>
              <button
                onClick={() => setFreeTier(!freeTier)}
                className={`w-11 h-6 rounded-full border-2 transition-colors relative shrink-0 ${
                  freeTier ? "bg-off-black border-off-black" : "border-absolute-black/40"
                }`}
              >
                <motion.span
                  animate={{ x: freeTier ? 20 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-pure-white block"
                />
              </button>
            </div>

            {/* error */}
            {err && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono tracking-mono text-[12px] uppercase border border-absolute-black p-3"
              >
                ⚠ {err}
              </motion.p>
            )}

          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 border-t border-absolute-black px-6 py-4 space-y-2">
          {generating && (
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 animate-pulse text-center">
              ✦ AI is generating lessons — this takes ~10 seconds…
            </p>
          )}
          {isEdit ? (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => save(false)}
                disabled={busy}
                className="flex-1 font-mono tracking-mono text-[12px] uppercase px-4 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save changes"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="font-mono tracking-mono text-[12px] uppercase px-4 py-3 border border-absolute-black rounded-[3px] hover:bg-light-concrete/40 transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => save(true)}
                disabled={busy}
                className="flex-1 font-mono tracking-mono text-[12px] uppercase px-4 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40"
              >
                {generating ? "Generating…" : "✦ Create + AI lessons"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => save(false)}
                disabled={busy}
                className="font-mono tracking-mono text-[12px] uppercase px-4 py-3 border border-absolute-black rounded-[3px] hover:bg-light-concrete/40 transition-colors disabled:opacity-40"
              >
                {busy && !generating ? "Creating…" : "Create empty"}
              </motion.button>
            </div>
          )}
          {!isEdit && (
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-center text-off-black/40">
              ✦ AI needs a Groq API key · "Create empty" works without one
            </p>
          )}
        </div>
      </motion.aside>
    </>
  );
}
