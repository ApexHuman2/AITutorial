"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

type Stats = {
  users: number;
  totalCourses: number;
  published: number;
  draft: number;
  totalLessons: number;
};

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [now, setNow] = useState("");

  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center justify-between">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">§ 01 — Admin Dashboard</p>
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 tabular-nums hidden md:block">{now}</p>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10 space-y-10">
        <motion.div {...fade(0)}>
          <h1 className="text-[40px] md:text-[54px] leading-[1.05] tracking-[-0.02em]">
            Admin panel.
          </h1>
          <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            Only you can see this. Manage courses, instructors, and content.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div {...fade(0.08)} className="grid grid-cols-2 md:grid-cols-5 border border-absolute-black divide-x divide-absolute-black">
          {[
            { label: "Total users", val: stats?.users },
            { label: "Total courses", val: stats?.totalCourses },
            { label: "Published", val: stats?.published },
            { label: "Draft", val: stats?.draft },
            { label: "Total lessons", val: stats?.totalLessons },
          ].map((s, i) => (
            <div key={s.label} className={`p-5 ${i >= 2 ? "col-span-1" : ""}`}>
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">{s.label}</p>
              <p className="mt-2 text-[32px] leading-none tabular-nums">
                {s.val ?? "—"}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div {...fade(0.14)}>
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-4">Quick actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "New course", href: "/admin/courses", icon: "+" },
              { label: "New instructor", href: "/admin/instructors", icon: "+" },
              { label: "View analytics", href: "/admin/analytics", icon: "∿" },
              { label: "Student view", href: "/dashboard", icon: "↗" },
            ].map((a) => (
              <motion.a
                key={a.label}
                href={a.href}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-5 py-4 border border-absolute-black rounded-[3px] font-mono tracking-mono text-[12px] uppercase hover:bg-off-black hover:text-pure-white transition-colors"
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
                <span className="ml-auto">→</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div {...fade(0.2)} className="border border-absolute-black/30 p-6 space-y-2">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-3">How to build a course</p>
          {[
            "1. Go to Instructors → create Maria or Marco first",
            "2. Go to Courses → New Course → fill in title, subject, pick instructor",
            '3. Hit "Generate with AI" to get lessons in seconds',
            "4. Review and tweak each lesson's steps in the editor",
            "5. Click Publish — students see it immediately",
          ].map((s) => (
            <p key={s} className="font-mono tracking-mono text-[12px] uppercase text-off-black/80">{s}</p>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
