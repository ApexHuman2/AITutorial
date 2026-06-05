"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "⊞", exact: true },
  { href: "/admin/courses", label: "Courses", icon: "◫", exact: false },
  { href: "/admin/instructors", label: "Instructors", icon: "◯", exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: "∿", exact: false },
];

export default function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (item: typeof NAV[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/");
  };

  const Content = () => (
    <div className="flex flex-col h-full">
      {/* Brand + badge */}
      <div className="px-5 py-4 border-b border-absolute-black">
        <a href="/" className="font-mono tracking-mono text-[12px] uppercase hover:opacity-60">
          Apex Tutor / 001
        </a>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-off-black text-pure-white rounded-[2px]">
          <span className="w-1.5 h-1.5 rounded-full bg-pure-white animate-pulse" />
          <span className="font-mono tracking-mono-sm text-[10px] uppercase">Admin</span>
        </div>
      </div>

      {/* Admin identity */}
      <div className="px-5 py-4 border-b border-absolute-black">
        <div className="w-8 h-8 rounded-full bg-off-black grid place-items-center text-pure-white font-mono text-[12px] mb-2">
          {adminEmail[0]?.toUpperCase()}
        </div>
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 truncate">
          {adminEmail}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-2 mb-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
          Admin area
        </p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item);
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
                      layoutId="admin-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-pure-white"
                    />
                  )}
                </motion.a>
              </li>
            );
          })}
        </ul>

        {/* Divider back to student area */}
        <div className="mt-6 pt-4 border-t border-absolute-black/20">
          <p className="px-2 mb-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
            Student area
          </p>
          <motion.a
            href="/dashboard"
            whileHover={{ x: 2 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] font-mono tracking-mono text-[12px] uppercase text-off-black/60 hover:bg-light-concrete/50 transition-colors"
          >
            <span className="text-[14px] opacity-70">↗</span>
            <span>Go to dashboard</span>
          </motion.a>
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-absolute-black pt-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[3px] font-mono tracking-mono text-[12px] uppercase text-off-black/70 hover:bg-absolute-black hover:text-pure-white transition-colors disabled:opacity-40"
        >
          <span>→</span>
          <span>{signingOut ? "Signing out…" : "Sign out"}</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-absolute-black min-h-screen sticky top-0 bg-pure-white">
        <Content />
      </aside>

      {/* Mobile bar */}
      <div className="md:hidden sticky top-0 z-50 bg-pure-white/90 backdrop-blur-md border-b border-absolute-black flex items-center justify-between px-4 h-12">
        <span className="font-mono tracking-mono text-[12px] uppercase">Admin</span>
        <button onClick={() => setMobileOpen(true)} className="font-mono tracking-mono text-[12px] uppercase">
          Menu ☰
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-absolute-black/40"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-pure-white border-r border-absolute-black"
            >
              <div className="flex items-center justify-between px-5 h-12 border-b border-absolute-black">
                <span className="font-mono tracking-mono text-[12px] uppercase">Admin</span>
                <button onClick={() => setMobileOpen(false)} className="text-[18px]">×</button>
              </div>
              <div className="h-[calc(100%-48px)] overflow-y-auto">
                <Content />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
