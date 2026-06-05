"use client";

import { motion } from "motion/react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

type Profile = {
  studentName: string;
  avatarSeed: string;
  avatarStyle: string;
};

type Subscription = {
  plan: "free" | "starter" | "family";
  status: string;
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₱0",
    cadence: "forever",
    perks: ["3 starter courses", "Maria and Marco", "Voice-led lessons"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "₱199",
    cadence: "/ month",
    perks: ["Every course in the catalog", "1 student profile", "Full replays"],
    featured: true,
  },
  {
    id: "family",
    name: "Family",
    price: "₱399",
    cadence: "/ month",
    perks: ["Up to 4 student profiles", "Priority generation", "Early access"],
  },
];

export default function AccountClient({
  uid,
  email,
  name,
}: {
  uid: string;
  email: string;
  name: string;
}) {
  const [profile, setProfile] = useState<Profile>({
    studentName: name,
    avatarSeed: uid.slice(0, 8),
    avatarStyle: "bottts",
  });
  const [subscription, setSubscription] = useState<Subscription>({ plan: "free", status: "active" });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [studentName, setStudentName] = useState(name);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      const d = snap.data();
      if (d?.profile) {
        setProfile(d.profile as Profile);
        setStudentName(d.profile.studentName);
      }
      if (d?.subscription) setSubscription(d.subscription as Subscription);
    });
    return () => unsub();
  }, [uid]);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          profile: {
            ...profile,
            studentName: studentName.trim() || "Student",
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

  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${profile.avatarSeed}&backgroundColor=1e1e1e&radius=50`;
  const currentPlan = subscription.plan ?? "free";

  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
          § 03 — Account
        </p>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10 space-y-12 max-w-[900px]">

        {/* Profile section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="text-[40px] leading-[1.05] tracking-[-0.02em]">
            Your profile.
          </h1>

          <div className="mt-8 border border-absolute-black">
            {/* Avatar + identity */}
            <div className="p-6 border-b border-absolute-black flex items-center gap-6">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Your avatar"
                  className="w-16 h-16 rounded-full border border-absolute-black bg-off-black"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-off-black border-2 border-pure-white" />
              </div>
              <div>
                <p className="text-[19px]">{studentName}</p>
                <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                  {email}
                </p>
                <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
                  UID {uid.slice(0, 12)}…
                </p>
              </div>
            </div>

            {/* Edit name */}
            <div className="p-6 border-b border-absolute-black">
              <label className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 block mb-3">
                Name — how the tutor will greet you
              </label>
              <div className="flex gap-2">
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                  className="flex-1 text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-1 focus:ring-absolute-black font-mono"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={save}
                  disabled={saving}
                  className="font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] bg-off-black text-pure-white disabled:opacity-40 hover:bg-absolute-black transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </motion.button>
              </div>
              {savedAt && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60"
                >
                  ✓ Saved at {savedAt}
                </motion.p>
              )}
            </div>

            {/* Avatar seed tweaker */}
            <div className="p-6">
              <label className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 block mb-3">
                Avatar seed — changes your bot portrait
              </label>
              <div className="flex items-center gap-3">
                <input
                  value={profile.avatarSeed}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, avatarSeed: e.target.value }))
                  }
                  className="w-40 text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] bg-pure-white focus:outline-none focus:ring-1 focus:ring-absolute-black font-mono"
                />
                <img
                  src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${profile.avatarSeed}&backgroundColor=1e1e1e&radius=50`}
                  alt="preview"
                  className="w-10 h-10 rounded-full border border-absolute-black bg-off-black"
                />
                <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50">
                  ← live preview
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plan section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <h2 className="text-[32px] leading-[1.05] tracking-[-0.02em]">
            Your plan.
          </h2>
          <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            Currently on <span className="text-absolute-black">{currentPlan}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 border border-absolute-black divide-y md:divide-y-0 md:divide-x divide-absolute-black">
            {PLANS.map((plan, i) => {
              const active = currentPlan === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className={`p-6 flex flex-col ${active ? "bg-off-black text-pure-white" : "bg-pure-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono tracking-mono text-[12px] uppercase">{plan.name}</p>
                    {active && (
                      <span className="font-mono tracking-mono-sm text-[10px] uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pure-white animate-pulse" />
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-[32px] leading-none">{plan.price}</p>
                  <p className={`mt-1 font-mono tracking-mono-sm text-[10px] uppercase ${active ? "opacity-60" : "text-off-black/60"}`}>
                    {plan.cadence}
                  </p>
                  <ul className={`mt-5 space-y-2 border-t pt-4 ${active ? "border-pure-white/30" : "border-absolute-black/20"}`}>
                    {plan.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 font-mono tracking-mono text-[12px] uppercase">
                        <span className="opacity-40 mt-0.5">→</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  {!active && (
                    <button className={`mt-6 self-start font-mono tracking-mono text-[12px] uppercase px-5 py-2 rounded-[3px] border transition-colors ${
                      plan.featured
                        ? "bg-off-black text-pure-white border-off-black hover:bg-absolute-black"
                        : "border-absolute-black hover:bg-off-black hover:text-pure-white"
                    }`}>
                      Switch to {plan.name} →
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="border border-absolute-black/30 p-6"
        >
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-4">
            Account actions
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="font-mono tracking-mono text-[12px] uppercase px-5 py-2 rounded-[3px] border border-absolute-black/40 text-off-black/60 hover:border-absolute-black hover:text-absolute-black transition-colors">
              Export my data
            </button>
            <button className="font-mono tracking-mono text-[12px] uppercase px-5 py-2 rounded-[3px] border border-absolute-black/20 text-off-black/40 hover:border-red-400 hover:text-red-600 transition-colors">
              Delete account
            </button>
          </div>
        </motion.div>

      </main>

      <footer className="border-t border-absolute-black px-6 md:px-10 py-3">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
          Data stored securely in Firebase · Changes sync in real time
        </p>
      </footer>
    </div>
  );
}
