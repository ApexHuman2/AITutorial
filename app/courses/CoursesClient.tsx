"use client";

import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { signOut } from "@/lib/auth";

type Profile = {
  studentName: string;
  avatarSeed: string;
  avatarStyle: string;
};

const CATALOG = [
  { id: "math-fractions", subject: "MATH", title: "Fractions of a whole", instructor: "Maria", lessons: 7, free: true },
  { id: "math-decimals", subject: "MATH", title: "Decimals & place value", instructor: "Maria", lessons: 6, free: true },
  { id: "math-prealgebra", subject: "MATH", title: "Pre-Algebra", instructor: "Maria", lessons: 8, free: false },
  { id: "sci-matter", subject: "SCIENCE", title: "States of matter", instructor: "Marco", lessons: 5, free: true },
  { id: "sci-forces", subject: "SCIENCE", title: "Forces & motion", instructor: "Marco", lessons: 6, free: false },
  { id: "sci-cell", subject: "SCIENCE", title: "The cell", instructor: "Marco", lessons: 7, free: false },
];

export default function CoursesClient({
  uid,
  email,
  name,
}: {
  uid: string;
  email: string;
  name: string;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentName, setStudentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data?.profile) {
        setProfile(data.profile as Profile);
        setStudentName((data.profile as Profile).studentName);
      } else {
        setStudentName(name);
      }
    });
    return () => unsub();
  }, [uid, name]);

  const saveName = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          profile: {
            studentName: studentName.trim() || "Student",
            avatarStyle: profile?.avatarStyle ?? "bottts",
            avatarSeed: profile?.avatarSeed ?? uid.slice(0, 8),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-pure-white text-absolute-black">
      <header className="sticky top-0 z-50 bg-pure-white/90 backdrop-blur-md border-b border-absolute-black">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between px-6 h-12">
          <a href="/" className="font-mono tracking-mono text-[12px] uppercase">
            Apex Tutor / 001
          </a>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              {email}
            </span>
            <button
              onClick={() => signOut()}
              className="font-mono tracking-mono text-[12px] uppercase px-6 py-2 border border-absolute-black rounded-[3px] bg-pure-white text-absolute-black hover:bg-absolute-black hover:text-pure-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Hello + profile */}
      <section className="border-b border-absolute-black">
        <div className="mx-auto max-w-[1400px] grid grid-cols-12 px-6 py-12 md:py-16 gap-6">
          <div className="col-span-12 md:col-span-7">
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              § 01 — Signed in
            </p>
            <h1 className="mt-4 text-[40px] md:text-[54px] leading-[1.05] tracking-[-0.02em]">
              Hello, {studentName || "Student"}.
            </h1>
            <p className="mt-4 font-mono tracking-mono text-[12px] uppercase text-off-black/70">
              Your data lives in Firebase. Changes save in real time.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 border border-absolute-black p-6">
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              Profile — your name as the tutor will say it
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="flex-1 font-mono text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-2 focus:ring-absolute-black"
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] bg-off-black text-pure-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {savedAt && (
              <p className="mt-3 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                ✓ Saved at {savedAt}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="border-b border-absolute-black">
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:py-16">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            § 02 — Catalog
          </p>
          <h2 className="mt-4 text-[32px] leading-[1.05] tracking-[-0.02em]">
            Pick a course.
          </h2>
        </div>
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-3 border-t border-absolute-black">
          {CATALOG.map((c, i) => (
            <div
              key={c.id}
              className={`p-6 md:p-8 border-b md:border-b-0 ${i % 3 !== 2 ? "md:border-r" : ""} border-absolute-black hover:bg-off-black hover:text-pure-white transition-colors cursor-pointer group`}
            >
              <div className="flex items-center justify-between font-mono tracking-mono-sm text-[10px] uppercase">
                <span>{c.subject}</span>
                <span className="opacity-60">{c.free ? "FREE" : "PRO"}</span>
              </div>
              <h3 className="mt-8 text-[19px]">{c.title}</h3>
              <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase opacity-70">
                {c.instructor} · {c.lessons} lessons
              </p>
              <p className="mt-8 font-mono tracking-mono text-[12px] uppercase group-hover:translate-x-1 transition-transform">
                Start →
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-off-black text-pure-white">
        <div className="mx-auto max-w-[1400px] px-6 py-6 flex items-center justify-between font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/60">
          <span>© 2026 Apex Tutor</span>
          <span>UID {uid.slice(0, 8)}…</span>
        </div>
      </footer>
    </main>
  );
}
