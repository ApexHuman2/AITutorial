"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection, doc, getDoc, getDocs,
  orderBy, query, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import LessonPlayer from "@/components/LessonPlayer";
import type { Lesson, Instructor } from "@/lib/courseTypes";

export default function LearnPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [lesson,       setLesson]       = useState<Lesson | null>(null);
  const [instructor,   setInstructor]   = useState<Instructor | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [courseTitle,  setCourseTitle]  = useState("");
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    (async () => {
      const lSnap = await getDoc(doc(db, "courses", courseId, "lessons", lessonId));
      if (!lSnap.exists()) { setLoading(false); return; }
      setLesson({ id: lSnap.id, ...lSnap.data() } as Lesson);

      const cSnap = await getDoc(doc(db, "courses", courseId));
      if (cSnap.exists()) {
        const cData = cSnap.data();
        setCourseTitle(cData?.title ?? "");
        if (cData?.instructorId) {
          const iSnap = await getDoc(doc(db, "instructors", cData.instructorId));
          if (iSnap.exists()) setInstructor({ id: iSnap.id, ...iSnap.data() } as Instructor);
        }
      }

      const allSnap = await getDocs(
        query(collection(db, "courses", courseId, "lessons"), orderBy("order"))
      );
      const ordered = allSnap.docs.map((d) => d.id);
      const pos = ordered.indexOf(lessonId);
      setNextLessonId(pos >= 0 && pos < ordered.length - 1 ? ordered[pos + 1] : null);
      setLoading(false);
    })();
  }, [courseId, lessonId]);

  const recordCompletion = async () => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "enrollments", courseId);
    const snap = await getDoc(ref);
    const data = snap.data() ?? {};
    const prev: string[] = data.completedLessonIds ?? [];
    const completedLessonIds = prev.includes(lessonId) ? prev : [...prev, lessonId];

    const today = new Date().toISOString().slice(0, 10);
    const last  = data.lastCompletionDate as string | undefined;
    let streak  = data.streak ?? 0;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = last === yesterday ? streak + 1 : 1;
    }

    await setDoc(ref, {
      completedLessonIds,
      currentLessonId: nextLessonId ?? lessonId,
      streak,
      lastCompletionDate: today,
      lastVisitedAt: serverTimestamp(),
      lessons: { [lessonId]: { completed: true, completedAt: serverTimestamp() } },
    }, { merge: true });
  };

  if (loading) return <LoadingScreen />;

  if (!lesson) return (
    <div className="min-h-screen bg-pure-white grid place-items-center">
      <div className="text-center">
        <p className="text-[24px]">Lesson not found.</p>
        <a href={`/dashboard/courses/${courseId}`}
          className="mt-4 inline-block font-mono tracking-mono text-[12px] uppercase underline">
          ← Back to course
        </a>
      </div>
    </div>
  );

  if (!lesson.steps?.length) return (
    <div className="min-h-screen bg-pure-white grid place-items-center px-6">
      <div className="text-center">
        <p className="text-[24px]">This lesson has no steps yet.</p>
        <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
          The admin is still building it.
        </p>
        <a href={`/dashboard/courses/${courseId}`}
          className="mt-4 inline-block font-mono tracking-mono text-[12px] uppercase underline">
          ← Back to course
        </a>
      </div>
    </div>
  );

  return (
    <LessonPlayer
      lesson={lesson}
      instructor={instructor ?? undefined}
      courseTitle={courseTitle}
      hasNext={Boolean(nextLessonId)}
      onFinish={recordCompletion}
      onNext={() => nextLessonId
        ? router.push(`/learn/${courseId}/${nextLessonId}`)
        : router.push(`/dashboard/courses/${courseId}`)
      }
      onExit={() => router.push(`/dashboard/courses/${courseId}`)}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-pure-white flex flex-col items-center justify-center gap-4">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-off-black animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
        Loading lesson…
      </p>
    </div>
  );
}
