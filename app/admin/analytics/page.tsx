"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

type Stats = { users: number; totalCourses: number; published: number; draft: number; totalLessons: number };

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  const metrics = stats
    ? [
        { label: "Registered users", value: stats.users, note: "Total accounts in Firebase Auth" },
        { label: "Total courses", value: stats.totalCourses, note: `${stats.published} published · ${stats.draft} draft` },
        { label: "Total lessons", value: stats.totalLessons, note: "Across all courses" },
        { label: "Avg lessons/course", value: stats.totalCourses ? (stats.totalLessons / stats.totalCourses).toFixed(1) : "—", note: "Target: 5–12 per course" },
        { label: "Publish rate", value: stats.totalCourses ? `${Math.round((stats.published / stats.totalCourses) * 100)}%` : "—", note: "Published / total" },
      ]
    : [];

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">§ 04 — Analytics</p>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10 space-y-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-[40px] leading-[1.05] tracking-[-0.02em]">Analytics.</h1>
          <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            Live from Firestore · Refreshes on load
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-absolute-black border border-absolute-black"
        >
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
              className="bg-pure-white p-6"
            >
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">{m.label}</p>
              <p className="mt-3 text-[44px] leading-none tabular-nums">{m.value ?? "—"}</p>
              <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">{m.note}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Roadmap notice */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="border border-absolute-black/20 p-6"
        >
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-3">Coming soon</p>
          {[
            "Daily active users chart",
            "Lesson completion funnel per course",
            "Average time-per-lesson heatmap",
            "Revenue / subscription breakdown",
            "Streak retention curve",
          ].map((t) => (
            <p key={t} className="font-mono tracking-mono text-[12px] uppercase text-off-black/40 py-1.5 border-b border-absolute-black/10 last:border-b-0">
              — {t}
            </p>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
