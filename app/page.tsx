"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-pure-white text-absolute-black overflow-x-hidden">
      <CursorDot />
      <Nav />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Subjects />
      <Showcase />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}

/* ---------- CURSOR DOT ---------- */
function CursorDot() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    // Skip entirely on touch / coarse pointers — no cursor to follow there.
    if (typeof window === "undefined" || !window.matchMedia?.("(pointer: fine)").matches) return;
    let raf = 0;
    const move = (e: MouseEvent) => {
      if (raf) return;                       // coalesce to one update per frame
      raf = requestAnimationFrame(() => {
        x.set(e.clientX - 6);
        y.set(e.clientY - 6);
        raf = 0;
      });
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => { window.removeEventListener("mousemove", move); if (raf) cancelAnimationFrame(raf); };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] w-3 h-3 rounded-full bg-absolute-black mix-blend-difference hidden md:block"
      style={{ x: sx, y: sy, willChange: "transform" }}
    />
  );
}

/* ---------- NAV ---------- */
function Nav() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 bg-pure-white/90 backdrop-blur-md border-b border-absolute-black"
    >
      <div className="mx-auto max-w-[1400px] flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-6">
          <a href="/" className="font-mono tracking-mono text-[12px] uppercase">
            Apex Tutor / 001
          </a>
          <Clock />
        </div>
        <nav className="hidden md:flex items-center gap-6 font-mono tracking-mono text-[12px] uppercase">
          {[
            ["How", "#how"],
            ["Subjects", "#subjects"],
            ["Pricing", "#pricing"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="relative group"
            >
              {label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-absolute-black transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>
        <AuthNav />
      </div>
    </motion.header>
  );
}

function AuthNav() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
        …
      </div>
    );
  }
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href="/courses"
          className="hidden sm:inline font-mono tracking-mono-sm text-[10px] uppercase text-off-black/70 hover:text-absolute-black"
        >
          {user.displayName || user.email}
        </a>
        <button
          onClick={() => signOut()}
          className="font-mono tracking-mono text-[12px] uppercase px-6 py-2 border border-absolute-black rounded-[3px] bg-pure-white text-absolute-black hover:bg-absolute-black hover:text-pure-white transition-colors"
        >
          Sign out
        </button>
        <MagneticButton href="/courses">Continue →</MagneticButton>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <a
        href="/signin"
        className="hidden sm:inline-block font-mono tracking-mono text-[12px] uppercase px-6 py-2 border border-absolute-black rounded-[3px] bg-pure-white text-absolute-black hover:bg-absolute-black hover:text-pure-white transition-colors"
      >
        Sign in
      </a>
      <MagneticButton href="/signup">Start free →</MagneticButton>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const t = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setNow(`MNL ${t}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="hidden md:inline font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 tabular-nums">
      {now || "MNL 00:00:00"}
    </span>
  );
}

function MagneticButton({
  href,
  children,
  variant = "filled",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "filled" | "outlined";
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const cls =
    variant === "filled"
      ? "bg-off-black text-pure-white hover:bg-absolute-black"
      : "bg-pure-white text-absolute-black border border-absolute-black hover:bg-absolute-black hover:text-pure-white";

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={`inline-block font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] transition-colors ${cls}`}
    >
      {children}
    </motion.a>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 80, damping: 20 });
  const smy = useSpring(my, { stiffness: 80, damping: 20 });
  const bgX = useTransform(smx, (v) => `${v * 100}%`);
  const bgY = useTransform(smy, (v) => `${v * 100}%`);

  return (
    <section
      ref={heroRef}
      onMouseMove={(e) => {
        // Cache pointer coords and update at most once per frame to avoid
        // forcing a synchronous layout (getBoundingClientRect) on every move.
        const cx = e.clientX, cy = e.clientY;
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
          const r = heroRef.current?.getBoundingClientRect();
          rafRef.current = 0;
          if (!r) return;
          mx.set((cx - r.left) / r.width);
          my.set((cy - r.top) / r.height);
        });
      }}
      className="border-b border-absolute-black relative"
    >
      {/* spotlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background: `radial-gradient(circle at ${bgX} ${bgY}, #000 0%, transparent 30%)`,
        }}
      />
      <div className="mx-auto max-w-[1400px] grid grid-cols-12 px-6 relative">
        {/* Left meta */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="col-span-12 md:col-span-3 py-12 md:py-24 md:border-r md:border-absolute-black md:pr-6"
        >
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/70">
            Index № 01 — The Tutor
          </p>
          <p className="font-mono tracking-mono-sm text-[10px] uppercase mt-3">
            Voice-first · Guided · Ages 9–18
          </p>
          <div className="mt-8 space-y-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/70">
            {[
              "01 — Lesson begins",
              "02 — Tutor speaks",
              "03 — Student responds",
              "04 — Mistake → hint",
              "05 — Continue",
            ].map((t, i) => (
              <motion.p
                key={t}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                {t}
              </motion.p>
            ))}
          </div>
        </motion.aside>

        {/* Center headline */}
        <div className="col-span-12 md:col-span-6 py-12 md:py-24 md:px-12 md:border-r md:border-absolute-black">
          <h1 className="text-[44px] md:text-[64px] leading-[1.05] tracking-[-0.02em]">
            <RevealLine delay={0}>An AI tutor that</RevealLine>
            <RevealLine delay={0.15}>
              <span className="italic">teaches by guiding</span>,
            </RevealLine>
            <RevealLine delay={0.3}>not by chatting.</RevealLine>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 text-[15px] leading-[1.4] max-w-[42ch] text-off-black/80"
          >
            Apex Tutor walks grade-school students through linear, voice-led
            lessons. The tutor speaks. The student taps, drags, types, talks.
            Mistakes are met with a hint, never a red X.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="mt-10 flex flex-wrap gap-2"
          >
            <MagneticButton href="/signup">Start a lesson →</MagneticButton>
            <MagneticButton href="#how" variant="outlined">
              How it works
            </MagneticButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-[520px] border-t border-absolute-black pt-6"
          >
            <Stat n="5" suffix=" min" l="To first finished lesson" />
            <Stat n="199" prefix="₱" l="Starter plan / month" />
            <Stat n="2" l="Tutors at launch" />
          </motion.div>
        </div>

        {/* Right photo block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="col-span-12 md:col-span-3 border-l border-absolute-black flex flex-col"
        >
          <div className="flex-1 min-h-[280px] bg-off-black relative overflow-hidden group">
            <motion.img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80"
              alt="Maria — Math instructor"
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-110"
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-off-black/90 via-off-black/30 to-transparent" />
            <ConcretePattern />
            <div className="absolute bottom-4 left-4 right-4 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/80">
              <p>FIG. A</p>
              <p className="mt-1">Maria — Math instructor</p>
              <p className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-pure-white animate-pulse" />
                Voice: af_heart · Kokoro 82M
              </p>
            </div>
          </div>
          <div className="border-t border-absolute-black p-4 font-mono tracking-mono-sm text-[10px] uppercase">
            <p>Specimen / 9–18 yrs</p>
            <p className="mt-1 text-off-black/60">Linear · Multimodal · Gated</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function RevealLine({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function Stat({
  n,
  l,
  prefix = "",
  suffix = "",
}: {
  n: string;
  l: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const target = parseInt(n, 10);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <div>
      <p ref={ref} className="text-[20px] leading-none tabular-nums">
        {prefix}
        {val}
        {suffix}
      </p>
      <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/70">
        {l}
      </p>
    </div>
  );
}

function ConcretePattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
        </pattern>
        <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#1e1e1e" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#vignette)" />
      <g stroke="#d2c5aa" strokeOpacity="0.35" strokeWidth="1">
        <line x1="50%" y1="0" x2="50%" y2="100%" />
        <line x1="0" y1="50%" x2="100%" y2="50%" />
        <circle cx="50%" cy="50%" r="60" fill="none" />
        <circle cx="50%" cy="50%" r="100" fill="none" strokeOpacity="0.2" />
      </g>
    </svg>
  );
}

/* ---------- MARQUEE ---------- */
function Marquee() {
  const items = [
    "FRACTION BARS",
    "BALANCE SCALES",
    "NUMBER LINES",
    "PIZZA SLICING",
    "LETTER TILES",
    "TAP-TO-LABEL DIAGRAMS",
    "DRAG-TO-SORT",
    "FILL-IN-THE-BLANK",
    "MULTIPLE CHOICE",
    "READING PASSAGES",
  ];
  const row = [...items, ...items];
  return (
    <section className="border-b border-absolute-black bg-light-concrete/40 overflow-hidden">
      <div className="marquee flex gap-12 py-3 whitespace-nowrap font-mono tracking-mono text-[12px] uppercase">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-12">
            <span>{t}</span>
            <span aria-hidden>✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------- HOW IT WORKS ---------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "The tutor speaks.",
      d: "A friendly named instructor — Maria for Math, Marco for Science — reads each step aloud via on-device TTS. The student feels guided, not lectured.",
    },
    {
      n: "02",
      t: "The student does.",
      d: "Almost no walls of text. Every step is a widget: drag a fraction bar, label the cell, tilt the balance scale, slice the pizza.",
    },
    {
      n: "03",
      t: "Wrong answers don't punish.",
      d: "The tutor switches to an encouraging voice, offers a hint, and waits. Continue only appears after a real correct answer.",
    },
    {
      n: "04",
      t: "Streaks, replays, celebrations.",
      d: "Daily goal, 7-day streak, satisfying milestones. The lesson feels like progress, not homework.",
    },
  ];
  return (
    <section id="how" className="border-b border-absolute-black">
      <SectionHead
        label="§ 02"
        title="How a lesson actually runs."
        kicker="Linear. Voice-first. Mistake-friendly."
      />
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-4 border-t border-absolute-black">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ backgroundColor: "#1e1e1e", color: "#ffffff" }}
            className={`p-6 md:p-8 ${i < steps.length - 1 ? "md:border-r border-absolute-black" : ""} ${i < steps.length - 1 ? "border-b md:border-b-0" : ""} cursor-pointer transition-colors`}
          >
            <p className="font-mono tracking-mono-sm text-[10px] uppercase opacity-60">
              Step {s.n}
            </p>
            <h3 className="mt-6 text-[19px] leading-[1.2]">{s.t}</h3>
            <p className="mt-3 text-[15px] leading-[1.4] opacity-80">
              {s.d}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionHead({
  label,
  title,
  kicker,
}: {
  label: string;
  title: string;
  kicker?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-[1400px] px-6 py-12 md:py-16 flex flex-col md:flex-row md:items-end gap-4 md:gap-12"
    >
      <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 shrink-0">
        {label}
      </p>
      <h2 className="text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.02em] flex-1">
        {title}
      </h2>
      {kicker && (
        <p className="font-mono tracking-mono text-[12px] uppercase md:max-w-[28ch]">
          {kicker}
        </p>
      )}
    </motion.div>
  );
}

/* ---------- SUBJECTS ---------- */
function Subjects() {
  return (
    <section id="subjects" className="border-b border-absolute-black">
      <SectionHead
        label="§ 03"
        title="Two instructors. Two subjects. One method."
        kicker="More on the roadmap — but never at the cost of depth."
      />
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-2 border-t border-absolute-black">
        <InstructorCard
          name="Maria"
          subject="Mathematics"
          voice="af_heart · soft female"
          courses={["Fractions", "Decimals", "Ratios & Proportions", "Pre-Algebra"]}
          accent="left"
          photo="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80"
        />
        <InstructorCard
          name="Marco"
          subject="Science"
          voice="am_michael · warm male"
          courses={["States of Matter", "Forces & Motion", "The Cell", "Earth Systems"]}
          accent="right"
          photo="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80"
        />
      </div>
    </section>
  );
}

function InstructorCard({
  name,
  subject,
  voice,
  courses,
  accent,
  photo,
}: {
  name: string;
  subject: string;
  voice: string;
  courses: string[];
  accent: "left" | "right";
  photo: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`grid grid-cols-5 ${accent === "left" ? "md:border-r border-absolute-black" : ""}`}
    >
      <div className="col-span-2 bg-off-black relative min-h-[320px] overflow-hidden group">
        <motion.img
          src={photo}
          alt={`${name} — ${subject} instructor`}
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-110"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-off-black/95 via-off-black/40 to-off-black/10 pointer-events-none" />
        <ConcretePattern />
        <div className="absolute top-4 left-4 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/80">
          FIG. {accent === "left" ? "B" : "C"}
        </div>
        <div className="absolute bottom-4 left-4 text-pure-white">
          <p className="text-[32px] leading-none">{name}</p>
          <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/80 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-pure-white animate-pulse" />
            {voice}
          </p>
        </div>
      </div>
      <div className="col-span-3 p-6 md:p-8 border-l border-absolute-black flex flex-col">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
          Instructor — {subject}
        </p>
        <h3 className="mt-4 text-[19px]">
          {name === "Maria"
            ? "Patient with fractions. Relentless on place value."
            : "Curious about everything. Insists on naming the parts."}
        </h3>
        <ul className="mt-6 divide-y divide-absolute-black border-t border-b border-absolute-black">
          {courses.map((c, i) => (
            <motion.li
              key={c}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between py-2 font-mono tracking-mono text-[12px] uppercase cursor-pointer"
            >
              <span>
                {String(i + 1).padStart(2, "0")} — {c}
              </span>
              <span className="text-off-black/50">5–8 lessons →</span>
            </motion.li>
          ))}
        </ul>
        <a
          href="/courses"
          className="mt-6 self-start font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] bg-pure-white text-absolute-black border border-absolute-black hover:bg-absolute-black hover:text-pure-white transition-colors"
        >
          Browse catalog →
        </a>
      </div>
    </motion.div>
  );
}

/* ---------- SHOWCASE — interactive pizza ---------- */
function Showcase() {
  const TARGET = 3; // need 3 of 4 slices
  const TOTAL = 4;
  const [slices, setSlices] = useState<boolean[]>([true, true, true, false]);
  const [hint, setHint] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState<boolean[]>([true, true, true, true, true, false, false]);

  const filled = slices.filter(Boolean).length;
  const isCorrect = filled === TARGET;

  const toggle = (i: number) => {
    if (completed) return;
    setSlices((s) => {
      const next = [...s];
      next[i] = !next[i];
      return next;
    });
    setHint(null);
  };

  const handleContinue = () => {
    if (isCorrect && !completed) {
      setCompleted(true);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#000000", "#1e1e1e", "#d2c5aa", "#876a30"],
        scalar: 0.9,
      });
      setTimeout(() => {
        setCompleted(false);
        setHint(null);
      }, 3000);
    } else {
      setHint(
        filled < TARGET
          ? `Not quite — three-quarters means ${TARGET} of ${TOTAL} slices. Try again.`
          : `Close — you have ${filled}. We want exactly ${TARGET}.`
      );
    }
  };

  const toggleStreakDay = (i: number) => {
    setStreak((s) => {
      const next = [...s];
      next[i] = !next[i];
      return next;
    });
  };
  const streakCount = streak.filter(Boolean).length;

  return (
    <section className="border-b border-absolute-black bg-light-concrete/30">
      <SectionHead
        label="§ 04"
        title="Inside a lesson — try it."
        kicker="Tap the slices to show three-quarters."
      />
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-12 border-t border-absolute-black bg-pure-white">
        {/* mock player */}
        <div className="md:col-span-7 p-6 md:p-10 md:border-r border-absolute-black">
          <div className="flex items-center justify-between font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            <span>Lesson 03 — Fractions of a whole</span>
            <span className="tabular-nums">Step 02 / 06</span>
          </div>
          <div className="mt-4 h-[2px] w-full bg-absolute-black/10 overflow-hidden">
            <motion.div
              className="h-full bg-absolute-black"
              initial={{ width: 0 }}
              whileInView={{ width: "33%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="mt-10 flex items-start gap-4">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80"
              alt="Maria"
              className="w-12 h-12 rounded-full object-cover grayscale border border-absolute-black"
            />
            <div className="flex-1">
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                Maria
              </p>
              <p className="mt-2 text-[19px] leading-[1.3]">
                "Tap the slices to show three-quarters of the pizza."
              </p>
            </div>
          </div>

          {/* interactive pizza */}
          <div className="mt-10 grid place-items-center">
            <div className="relative w-[240px] h-[240px]">
              <svg
                viewBox="-110 -110 220 220"
                className="w-full h-full"
              >
                <circle
                  cx="0"
                  cy="0"
                  r="100"
                  fill="none"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                {slices.map((on, i) => {
                  const a0 = (i * 90 - 90) * (Math.PI / 180);
                  const a1 = ((i + 1) * 90 - 90) * (Math.PI / 180);
                  const x0 = 100 * Math.cos(a0);
                  const y0 = 100 * Math.sin(a0);
                  const x1 = 100 * Math.cos(a1);
                  const y1 = 100 * Math.sin(a1);
                  const path = `M 0 0 L ${x0} ${y0} A 100 100 0 0 1 ${x1} ${y1} Z`;
                  return (
                    <motion.path
                      key={i}
                      d={path}
                      onClick={() => toggle(i)}
                      stroke="#000"
                      strokeWidth="1"
                      style={{ cursor: "pointer" }}
                      animate={{
                        fill: on ? "#1e1e1e" : "#ffffff",
                        scale: on ? 1 : 0.99,
                      }}
                      whileHover={{ fill: on ? "#000" : "#bababa" }}
                      transition={{ duration: 0.25 }}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <motion.span
                  key={filled}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-mono tracking-mono text-[14px] uppercase text-pure-white mix-blend-difference tabular-nums"
                >
                  {filled} / {TOTAL}
                </motion.span>
              </div>
            </div>
          </div>

          {/* hint */}
          <div className="mt-6 h-6">
            <AnimatePresence>
              {hint && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center font-mono tracking-mono text-[12px] uppercase text-off-black/80"
                >
                  ⚠ {hint}
                </motion.p>
              )}
              {completed && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center font-mono tracking-mono text-[12px] uppercase"
                >
                  ✓ NICE — THREE-QUARTERS IT IS.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] bg-pure-white text-absolute-black border border-absolute-black hover:bg-absolute-black hover:text-pure-white transition-colors"
            >
              ⟲ Hear it again
            </motion.button>
            <motion.button
              onClick={handleContinue}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className={`font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] transition-colors ${
                isCorrect
                  ? "bg-off-black text-pure-white"
                  : "bg-pure-white text-absolute-black border border-absolute-black"
              }`}
            >
              Continue →
            </motion.button>
          </div>
        </div>

        {/* side panel */}
        <aside className="md:col-span-5 p-6 md:p-10 flex flex-col gap-8 bg-pure-white">
          <div>
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              Today
            </p>
            <p className="mt-3 text-[44px] leading-none tabular-nums">06:42</p>
            <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              Practiced — Daily goal met
            </p>
          </div>

          <div className="border-t border-absolute-black pt-6">
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              Streak — tap a day
            </p>
            <div className="mt-3 flex gap-1">
              {streak.map((on, d) => (
                <motion.button
                  key={d}
                  onClick={() => toggleStreakDay(d)}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ y: -2 }}
                  animate={{
                    backgroundColor: on ? "#1e1e1e" : "#ffffff",
                  }}
                  className="h-8 flex-1 border border-absolute-black"
                />
              ))}
            </div>
            <p className="mt-3 font-mono tracking-mono-sm text-[10px] uppercase tabular-nums">
              {streakCount} {streakCount === 1 ? "day" : "days"} ·{" "}
              {7 - streakCount > 0
                ? `${7 - streakCount} to a full week`
                : "full week!"}
            </p>
          </div>

          <div className="border-t border-absolute-black pt-6">
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
              Up next
            </p>
            <ul className="mt-3 space-y-2 font-mono tracking-mono text-[12px] uppercase">
              {[
                ["04 — Equivalent fractions", "~5 min"],
                ["05 — Comparing fractions", "~6 min"],
                ["06 — Mixed numbers", "~7 min"],
              ].map(([t, m], i) => (
                <motion.li
                  key={t}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="flex justify-between cursor-pointer"
                >
                  <span>{t}</span>
                  <span className="text-off-black/50">{m}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ---------- PRICING ---------- */
function Pricing() {
  return (
    <section id="pricing" className="border-b border-absolute-black">
      <SectionHead
        label="§ 05"
        title="Priced for parents, not enterprise."
        kicker="The cost of one private-tutor hour buys a whole month."
      />
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-3 border-t border-absolute-black">
        <PriceCard
          name="Free"
          price="₱0"
          cadence="forever"
          features={[
            "3 starter courses",
            "Maria and Marco",
            "Voice-led lessons",
            "Daily streak tracking",
          ]}
          i={0}
        />
        <PriceCard
          name="Starter"
          price="₱199"
          cadence="per month"
          features={[
            "Every course in the catalog",
            "1 student profile",
            "Full lesson replays",
            "Cancel anytime",
          ]}
          featured
          i={1}
        />
        <PriceCard
          name="Family"
          price="₱399"
          cadence="per month"
          features={[
            "Up to 4 student profiles",
            "Priority lesson generation",
            "Early access to new subjects",
            "Cancel anytime",
          ]}
          i={2}
        />
      </div>
    </section>
  );
}

function PriceCard({
  name,
  price,
  cadence,
  features,
  featured,
  i,
}: {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  featured?: boolean;
  i: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      whileHover={{ y: -4 }}
      className={`p-6 md:p-10 flex flex-col md:border-r border-absolute-black last:border-r-0 ${
        featured ? "bg-off-black text-pure-white" : "bg-pure-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono tracking-mono text-[12px] uppercase">{name}</p>
        {featured && (
          <p className="font-mono tracking-mono-sm text-[10px] uppercase opacity-70 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-pure-white animate-pulse" />
            Most picked
          </p>
        )}
      </div>
      <div className="mt-8">
        <p className="text-[44px] leading-none">{price}</p>
        <p
          className={`mt-2 font-mono tracking-mono-sm text-[10px] uppercase ${featured ? "text-pure-white/70" : "text-off-black/60"}`}
        >
          {cadence}
        </p>
      </div>
      <ul
        className={`mt-8 border-t ${featured ? "border-pure-white/30" : "border-absolute-black"} divide-y ${featured ? "divide-pure-white/30" : "divide-absolute-black/30"}`}
      >
        {features.map((f, j) => (
          <motion.li
            key={f}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 + j * 0.05 }}
            className="py-3 font-mono tracking-mono text-[12px] uppercase flex items-center gap-3"
          >
            <span className="opacity-50">→</span>
            <span>{f}</span>
          </motion.li>
        ))}
      </ul>
      <a
        href="/signup"
        className={`mt-10 self-start font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] border transition-colors ${
          featured
            ? "bg-pure-white text-absolute-black border-pure-white hover:bg-transparent hover:text-pure-white"
            : "bg-pure-white text-absolute-black border-absolute-black hover:bg-absolute-black hover:text-pure-white"
        }`}
      >
        Choose {name} →
      </a>
    </motion.div>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const qs = [
    {
      q: "Is this a chatbot?",
      a: "No. There's no open chat box where the kid types whatever and the AI answers. The student walks a guided rail — the tutor speaks each step and the student responds with a widget. There is a small Q&A side panel for mid-lesson questions, but the main path is curated.",
    },
    {
      q: "What ages is it for?",
      a: "Grade-school students roughly 9–18, with the sweet spot at grades 5–8 for now. Lessons are voice-led, mistake-friendly, and don't assume a parent is sitting beside the student.",
    },
    {
      q: "Will the AI go off the rails?",
      a: "Every step is authored ahead of time. The AI generates draft lessons that an admin reviews and publishes — the student only ever sees vetted content.",
    },
    {
      q: "Why so cheap?",
      a: "Because a $40-an-hour tutor isn't an option for most families. Voice runs on-device. Models run on Groq's free tier where possible. We keep the cost low so the parent can keep saying yes.",
    },
    {
      q: "Do you have a parent dashboard?",
      a: "Not yet. The first version focuses on the student feeling taught. Parent analytics are on the roadmap, not in launch.",
    },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-absolute-black">
      <SectionHead label="§ 06" title="Common questions." kicker="The short answers." />
      <div className="mx-auto max-w-[1400px] border-t border-absolute-black">
        {qs.map((item, i) => {
          const open = openIdx === i;
          return (
            <div
              key={i}
              className="border-b border-absolute-black last:border-b-0 px-6"
            >
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <span className="flex items-baseline gap-6">
                  <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                    Q.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[19px]">{item.q}</span>
                </span>
                <motion.span
                  animate={{ rotate: open ? 45 : 0 }}
                  className="font-mono text-[19px]"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 max-w-[68ch] text-[15px] leading-[1.5] text-off-black/80 pl-[6.5ch]">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="bg-off-black text-pure-white">
      <div className="mx-auto max-w-[1400px] px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <p className="font-mono tracking-mono text-[12px] uppercase">
            Apex Tutor / 001
          </p>
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-6 text-[32px] leading-[1.05] tracking-[-0.02em] max-w-[18ch]"
          >
            Start a lesson today. Finish your first in five minutes.
          </motion.h3>
          <div className="mt-8 flex gap-2">
            <a
              href="/signup"
              className="font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] bg-pure-white text-absolute-black hover:bg-light-concrete transition-colors"
            >
              Start free →
            </a>
            <a
              href="/courses"
              className="font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] border border-pure-white text-pure-white hover:bg-pure-white hover:text-absolute-black transition-colors"
            >
              See the catalog
            </a>
          </div>
        </div>

        <div className="md:col-span-2 md:col-start-8">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/60">
            Product
          </p>
          <ul className="mt-4 space-y-2 font-mono tracking-mono text-[12px] uppercase">
            <li><a href="#how" className="hover:opacity-70">How it works</a></li>
            <li><a href="#subjects" className="hover:opacity-70">Subjects</a></li>
            <li><a href="#pricing" className="hover:opacity-70">Pricing</a></li>
            <li><a href="#faq" className="hover:opacity-70">FAQ</a></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/60">
            Company
          </p>
          <ul className="mt-4 space-y-2 font-mono tracking-mono text-[12px] uppercase">
            <li><a href="#" className="hover:opacity-70">About</a></li>
            <li><a href="#" className="hover:opacity-70">Roadmap</a></li>
            <li><a href="#" className="hover:opacity-70">Contact</a></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/60">
            Legal
          </p>
          <ul className="mt-4 space-y-2 font-mono tracking-mono text-[12px] uppercase">
            <li><a href="#" className="hover:opacity-70">Privacy</a></li>
            <li><a href="#" className="hover:opacity-70">Terms</a></li>
            <li><a href="#" className="hover:opacity-70">Children's policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-pure-white/20">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/60">
          <p>© 2026 Apex Tutor — Manila, PH</p>
          <p>Spec № 01 / Industrial Minimalism / Light Theme</p>
        </div>
      </div>
    </footer>
  );
}
