"use client";

import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Course, Lesson, Instructor } from "@/lib/courseTypes";

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1e1e&radius=50`;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cSnap = await getDoc(doc(db, "courses", id));
      if (!cSnap.exists()) { setLoading(false); return; }
      const c = { id: cSnap.id, ...cSnap.data() } as Course;
      setCourse(c);

      const [lSnap, iSnap] = await Promise.all([
        getDocs(query(collection(db, "courses", id, "lessons"), orderBy("order"))),
        c.instructorId ? getDoc(doc(db, "instructors", c.instructorId)) : Promise.resolve(null),
      ]);
      setLessons(lSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Lesson[]);
      if (iSnap && iSnap.exists()) setInstructor({ id: iSnap.id, ...iSnap.data() } as Instructor);
      setLoading(false);
    })();
  }, [id]);

  // live enrollment progress
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid, "enrollments", id), (snap) => {
      setCompleted((snap.data()?.completedLessonIds as string[]) ?? []);
    });
    return () => unsub();
  }, [user, id]);

  if (loading) {
    return <div className="flex-1 grid place-items-center"><p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 animate-pulse">Loading…</p></div>;
  }
  if (!course) {
    return (
      <div className="flex-1 grid place-items-center text-center">
        <div>
          <p className="text-[24px]">Course not found.</p>
          <a href="/dashboard/courses" className="mt-4 inline-block font-mono tracking-mono text-[12px] uppercase underline">← Back to catalog</a>
        </div>
      </div>
    );
  }

  const doneCount = lessons.filter((l) => completed.includes(l.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((l) => !completed.includes(l.id)) ?? lessons[0];
  const avatar = instructor?.photoUrl || (instructor ? dicebearUrl(instructor.avatarStyle ?? "lorelei", instructor.avatarSeed) : null);

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/courses")} className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 hover:text-absolute-black">
          ← Catalog
        </button>
        <span className="font-mono tracking-mono-sm text-[10px] uppercase truncate flex-1">{course.title}</span>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10 max-w-[820px]">
        {/* hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            <span>{course.subject}</span><span>·</span><span>Grade {course.gradeBand}</span>
            <span>·</span><span>{course.freeTier ? "Free" : "Pro"}</span>
          </div>
          <h1 className="mt-3 text-[40px] md:text-[48px] leading-[1.05] tracking-[-0.02em]">{course.title}</h1>
          {course.description && <p className="mt-4 text-[15px] leading-[1.6] text-off-black/80 max-w-[60ch]">{course.description}</p>}

          {/* instructor + progress */}
          <div className="mt-6 flex flex-wrap items-center gap-6">
            {instructor && (
              <div className="flex items-center gap-3">
                {avatar && <img src={avatar} alt={instructor.name} className={`w-10 h-10 rounded-full border border-absolute-black bg-off-black ${instructor.photoUrl ? "object-cover grayscale" : "object-contain"}`} />}
                <div>
                  <p className="text-[15px] leading-tight">{instructor.name}</p>
                  <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">{instructor.voiceId}</p>
                </div>
              </div>
            )}
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">
                <span>Progress</span><span className="tabular-nums">{doneCount}/{lessons.length} · {pct}%</span>
              </div>
              <div className="h-[3px] bg-absolute-black/10">
                <motion.div className="h-full bg-absolute-black" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          </div>

          {nextLesson && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/dashboard/courses/${id}/lessons/${nextLesson.id}`)}
              className="mt-8 font-mono tracking-mono text-[12px] uppercase px-8 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors"
            >
              {doneCount === 0 ? "Start lesson 1 →" : doneCount === lessons.length ? "Replay course →" : `Continue — ${nextLesson.title} →`}
            </motion.button>
          )}
        </motion.div>

        {/* lessons list */}
        <div className="mt-12">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-4">
            {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
          </p>
          {lessons.length === 0 ? (
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 border border-absolute-black/20 p-6 rounded-[3px]">
              This course has no lessons yet.
            </p>
          ) : (
            <div className="border border-absolute-black rounded-[3px] divide-y divide-absolute-black/20">
              {lessons.map((l, i) => {
                const isDone = completed.includes(l.id);
                const locked = i > 0 && !completed.includes(lessons[i - 1].id) && !isDone;
                return (
                  <motion.button
                    key={l.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    disabled={locked}
                    onClick={() => router.push(`/dashboard/courses/${id}/lessons/${l.id}`)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                      locked ? "opacity-40 cursor-not-allowed" : "hover:bg-light-concrete/30"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full shrink-0 grid place-items-center font-mono text-[12px] ${
                      isDone ? "bg-off-black text-pure-white" : "border border-absolute-black"
                    }`}>
                      {isDone ? "✓" : locked ? "🔒" : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] truncate">{l.title}</p>
                      {l.objective && <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 truncate">{l.objective}</p>}
                    </div>
                    <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 shrink-0">
                      {l.steps?.length ?? 0} steps
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
