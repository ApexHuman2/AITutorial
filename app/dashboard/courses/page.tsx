"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course, Instructor } from "@/lib/courseTypes";

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1e1e&radius=50`;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Record<string, Instructor>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    (async () => {
      try {
        const [cSnap, iSnap] = await Promise.all([
          getDocs(query(collection(db, "courses"), where("status", "==", "published"))),
          getDocs(collection(db, "instructors")),
        ]);
        const cs = cSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[];
        cs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const imap: Record<string, Instructor> = {};
        iSnap.docs.forEach((d) => { imap[d.id] = { id: d.id, ...d.data() } as Instructor; });
        setCourses(cs);
        setInstructors(imap);
        setError(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.includes("permission") || msg.includes("PERMISSION")
          ? "permissions"
          : "fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subjects = ["ALL", ...Array.from(new Set(courses.map((c) => c.subject)))];
  const visible = courses.filter((c) => filter === "ALL" || c.subject === filter);

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center gap-6">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">§ 02 — Courses</p>
        <div className="flex items-center gap-1 ml-auto">
          {subjects.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`font-mono tracking-mono text-[12px] uppercase px-4 py-1 rounded-[3px] transition-colors ${
                filter === s ? "bg-off-black text-pure-white" : "text-absolute-black hover:bg-light-concrete/50"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="text-[40px] leading-[1.05] tracking-[-0.02em]">Course catalog.</h1>
          <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            {visible.length} course{visible.length !== 1 ? "s" : ""} available
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => <div key={n} className="border border-absolute-black/20 rounded-[3px] h-60 animate-pulse bg-light-concrete/20" />)}
          </div>
        ) : error === "permissions" ? (
          <div className="border border-absolute-black/30 rounded-[3px] p-10 space-y-3">
            <p className="text-[19px]">Firestore rules need updating.</p>
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              Go to Firebase Console → Firestore Database → Rules and publish the rules from your <code className="bg-light-concrete/40 px-1">firestore.rules</code> file, then refresh.
            </p>
          </div>
        ) : error ? (
          <div className="border border-absolute-black/30 rounded-[3px] p-10 space-y-2">
            <p className="text-[19px]">Couldn't load courses.</p>
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">{error}</p>
            <button onClick={() => window.location.reload()} className="font-mono tracking-mono text-[12px] uppercase underline">Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="border border-absolute-black/30 rounded-[3px] p-12 text-center space-y-3">
            <p className="text-[24px]">No courses available yet.</p>
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              The admin needs to create and publish courses first.
            </p>
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
              Admin → Courses → New course → Publish
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((c, i) => {
              const ins = instructors[c.instructorId];
              const avatar = ins?.photoUrl || (ins ? dicebearUrl(ins.avatarStyle ?? "lorelei", ins.avatarSeed) : null);
              return (
                <motion.a
                  key={c.id}
                  href={`/dashboard/courses/${c.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="border border-absolute-black rounded-[3px] overflow-hidden flex flex-col group"
                >
                  <div className={`h-1 w-full ${c.subject === "Math" ? "bg-off-black" : c.subject === "Science" ? "bg-light-concrete" : "bg-absolute-black/40"}`} />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between font-mono tracking-mono-sm text-[10px] uppercase">
                      <span className="opacity-60">{c.subject}</span>
                      <span className={`px-2 py-0.5 rounded-[2px] border ${c.freeTier ? "border-absolute-black" : "border-absolute-black/30 opacity-50"}`}>
                        {c.freeTier ? "FREE" : "PRO"}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[22px] leading-[1.15] flex-1">{c.title}</h3>
                    {c.description && <p className="mt-2 text-[13px] leading-[1.5] text-off-black/70 line-clamp-3">{c.description}</p>}
                    <div className="mt-6 pt-4 border-t border-absolute-black/10 flex items-center gap-2">
                      {avatar && <img src={avatar} alt={ins?.name} className={`w-7 h-7 rounded-full bg-off-black ${ins?.photoUrl ? "object-cover grayscale" : "object-contain"}`} />}
                      <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/70">{ins?.name ?? "Tutor"}</span>
                      <span className="ml-auto font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 group-hover:translate-x-1 transition-transform">
                        {c.lessonCount ?? 0} lessons →
                      </span>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
