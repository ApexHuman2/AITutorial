"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserProfile = {
  studentName: string;
  avatarSeed: string;
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/dashboard/courses", label: "Courses", icon: "◫" },
  { href: "/dashboard/account", label: "Account", icon: "◯" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Live-listen to the user's Firestore profile
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const d = snap.data();
      if (d?.profile) setProfile(d.profile as UserProfile);
    });
    return () => unsub();
  }, [user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/");
  };

  const displayName =
    profile?.studentName || user?.displayName || user?.email?.split("@")[0] || "Student";
  const seed = profile?.avatarSeed || user?.uid?.slice(0, 8) || "default";
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&backgroundColor=1e1e1e&radius=50`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-absolute-black">
        <a
          href="/"
          className="font-mono tracking-mono text-[12px] uppercase hover:opacity-60 transition-opacity"
        >
          Apex Tutor / 001
        </a>
      </div>

      {/* Profile */}
      <div className="px-5 py-6 border-b border-absolute-black">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0">
            <img
              src={user?.photoURL || avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full border border-absolute-black bg-off-black object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-off-black border-2 border-pure-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] leading-tight truncate">{displayName}</p>
            <p className="mt-0.5 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-2 mb-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
          Menu
        </p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <motion.a
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[3px] font-mono tracking-mono text-[12px] uppercase transition-colors ${
                    active
                      ? "bg-off-black text-pure-white"
                      : "text-absolute-black hover:bg-light-concrete/50"
                  }`}
                >
                  <span className="text-[14px] opacity-70">{item.icon}</span>
                  <span>{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="active-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-pure-white"
                    />
                  )}
                </motion.a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Status strip */}
      <div className="px-5 py-3 border-t border-absolute-black">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-off-black animate-pulse" />
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            Free plan
          </span>
          <a
            href="/dashboard/account"
            className="ml-auto font-mono tracking-mono-sm text-[10px] uppercase underline underline-offset-2 hover:opacity-60"
          >
            Upgrade
          </a>
        </div>
      </div>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-absolute-black pt-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[3px] font-mono tracking-mono text-[12px] uppercase text-off-black/70 hover:bg-absolute-black hover:text-pure-white transition-colors disabled:opacity-40"
        >
          <span className="text-[14px]">→</span>
          <span>{signingOut ? "Signing out…" : "Sign out"}</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-absolute-black min-h-screen sticky top-0 bg-pure-white">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-50 bg-pure-white/90 backdrop-blur-md border-b border-absolute-black flex items-center justify-between px-4 h-12">
        <a href="/" className="font-mono tracking-mono text-[12px] uppercase">
          Apex Tutor / 001
        </a>
        <button
          onClick={() => setMobileOpen(true)}
          className="font-mono tracking-mono text-[12px] uppercase"
        >
          Menu ☰
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-absolute-black/40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-pure-white border-r border-absolute-black"
            >
              <div className="flex items-center justify-between px-5 h-12 border-b border-absolute-black">
                <span className="font-mono tracking-mono text-[12px] uppercase">
                  Apex Tutor / 001
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="font-mono text-[18px]"
                >
                  ×
                </button>
              </div>
              <div className="h-[calc(100%-48px)]">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
