"use client";

import { motion } from "motion/react";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

type Enrollment = {
  completedLessonIds: string[];
  streak: number;
  lastCompletionDate: string | null;
};

const CATALOG = [
  { id: "math-fractions", subject: "MATH", title: "Fractions of a whole", instructor: "Maria", lessons: 7, free: true },
  { id: "math-decimals", subject: "MATH", title: "Decimals & place value", instructor: "Maria", lessons: 6, free: true },
  { id: "sci-matter", subject: "SCIENCE", title: "States of matter", instructor: "Marco", lessons: 5, free: true },
];

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export default function DashboardClient({
  uid,
  name,
}: {
  uid: string;
  email: string;
  name: string;
}) {
  const [studentName, setStudentName] = useState(name);
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment>>({});
  const [now, setNow] = useState("");

  useEffect(() => {
    // Live clock
    const tick = () => {
      setNow(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // User profile
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      const d = snap.data();
      if (d?.profile?.studentName) setStudentName(d.profile.studentName);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    // Enrollments
    const unsubs = CATALOG.map((c) =>
      onSnapshot(doc(db, "users", uid, "enrollments", c.id), (snap) => {
        if (snap.exists()) {
          setEnrollments((prev) => ({ ...prev, [c.id]: snap.data() as Enrollment }));
        }
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const totalCompleted = Object.values(enrollments).reduce(
    (acc, e) => acc + (e.completedLessonIds?.length ?? 0),
    0
  );
  const maxStreak = Math.max(0, ...Object.values(enrollments).map((e) => e.streak ?? 0));
  const activeCourses = Object.keys(enrollments).length;

  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            § 01 — Dashboard
          </p>
        </div>
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 tabular-nums hidden md:block">
          MNL {now}
        </p>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10 space-y-12">

        {/* Hero greeting */}
        <motion.div {...fade(0)}>
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            Welcome back
          </p>
          <h1 className="mt-2 text-[40px] md:text-[54px] leading-[1.05] tracking-[-0.02em]">
            Hello,<br />{studentName}.
          </h1>
        </motion.div>

        {/* Stats row */}
        <motion.div
          {...fade(0.1)}
          className="grid grid-cols-2 md:grid-cols-4 border border-absolute-black divide-x divide-absolute-black"
        >
          <Stat n={totalCompleted} label="Lessons done" />
          <Stat n={maxStreak} label="Day streak" suffix="🔥" />
          <Stat n={activeCourses} label="Active courses" />
          <Stat n={0} label="Minutes today" suffix=" min" />
        </motion.div>

        {/* Continue learning */}
        <motion.div {...fade(0.15)}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              Continue learning
            </p>
            <a
              href="/dashboard/courses"
              className="font-mono tracking-mono-sm text-[10px] uppercase underline underline-offset-2 hover:opacity-60"
            >
              See all →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border border-absolute-black divide-y md:divide-y-0 md:divide-x divide-absolute-black">
            {CATALOG.map((c, i) => {
              const enroll = enrollments[c.id];
              const done = enroll?.completedLessonIds?.length ?? 0;
              const pct = Math.round((done / c.lessons) * 100);
              return (
                <motion.a
                  key={c.id}
                  href={`/dashboard/courses`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  whileHover={{ backgroundColor: "#1e1e1e", color: "#ffffff" }}
                  className="p-6 flex flex-col group cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between font-mono tracking-mono-sm text-[10px] uppercase">
                    <span>{c.subject}</span>
                    <span className="opacity-50">{c.free ? "FREE" : "PRO"}</span>
                  </div>
                  <h3 className="mt-4 text-[19px] leading-[1.2] flex-1">{c.title}</h3>
                  <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase opacity-60">
                    {c.instructor} · {c.lessons} lessons
                  </p>
                  {/* Progress bar */}
                  <div className="mt-5 h-[2px] w-full bg-absolute-black/10 group-hover:bg-pure-white/20">
                    <motion.div
                      className="h-full bg-absolute-black group-hover:bg-pure-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase opacity-60 tabular-nums">
                    {done} / {c.lessons} · {pct}%
                  </p>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Streak calendar */}
        <motion.div {...fade(0.25)}>
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-4">
            This week
          </p>
          <div className="border border-absolute-black p-6 grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
              const filled = i < (maxStreak % 7 || 0);
              return (
                <div key={d} className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.35 }}
                    style={{ transformOrigin: "bottom" }}
                    className={`w-full h-8 rounded-[2px] ${filled ? "bg-off-black" : "border border-absolute-black"}`}
                  />
                  <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
                    {d}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div {...fade(0.3)}>
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-4">
            Quick actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Browse all courses", href: "/dashboard/courses", icon: "◫" },
              { label: "Edit my profile", href: "/dashboard/account", icon: "◯" },
              { label: "Upgrade plan", href: "/dashboard/account", icon: "↑" },
            ].map((a) => (
              <motion.a
                key={a.label}
                href={a.href}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-5 py-4 border border-absolute-black rounded-[3px] font-mono tracking-mono text-[12px] uppercase hover:bg-off-black hover:text-pure-white transition-colors"
              >
                <span className="text-[16px]">{a.icon}</span>
                <span>{a.label}</span>
                <span className="ml-auto">→</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

      </main>

      {/* Footer strip */}
      <footer className="border-t border-absolute-black px-6 md:px-10 py-3">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
          UID {uid.slice(0, 12)}… · Data syncs live from Firestore
        </p>
      </footer>
    </div>
  );
}

function Stat({
  n,
  label,
  suffix = "",
}: {
  n: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="p-5 md:p-6">
      <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
        {label}
      </p>
      <p className="mt-2 text-[32px] leading-none tabular-nums">
        {n}
        {suffix}
      </p>
    </div>
  );
}
