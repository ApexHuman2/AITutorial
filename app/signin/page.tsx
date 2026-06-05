"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";

export default function SignInPage() {
  return (
    <AuthShell mode="signin">
      <SignInForm />
    </AuthShell>
  );
}

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    setErr(null);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={onEmail} className="space-y-3">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] bg-off-black text-pure-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in →"}
        </button>
      </form>
      <Divider />
      <button
        onClick={onGoogle}
        disabled={busy}
        className="w-full font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] border border-absolute-black bg-pure-white text-absolute-black hover:bg-absolute-black hover:text-pure-white transition-colors disabled:opacity-50"
      >
        Continue with Google
      </button>
      {err && (
        <p className="mt-4 font-mono tracking-mono text-[12px] uppercase text-absolute-black border border-absolute-black p-3">
          ⚠ {err}
        </p>
      )}
      <p className="mt-8 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
        New here?{" "}
        <a href="/signup" className="underline">
          Create an account
        </a>
      </p>
    </>
  );
}

export function AuthShell({
  mode,
  children,
}: {
  mode: "signin" | "signup";
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left — visual */}
      <aside className="hidden md:block relative bg-off-black overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-off-black via-off-black/60 to-transparent" />
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between font-mono tracking-mono text-[12px] uppercase text-pure-white">
          <a href="/">Apex Tutor / 001</a>
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/70">
            {mode === "signin" ? "RETURN" : "ENROLL"}
          </span>
        </div>
        <div className="absolute bottom-8 left-8 right-8 text-pure-white">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/70">
            FIG. A
          </p>
          <h2 className="mt-4 text-[32px] leading-[1.1] tracking-[-0.02em] max-w-[22ch]">
            {mode === "signin"
              ? "Welcome back. Pick up where you left off."
              : "Five minutes from now, your first lesson is finished."}
          </h2>
          <p className="mt-6 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/70">
            Maria · af_heart · Kokoro 82M
          </p>
        </div>
      </aside>

      {/* Right — form */}
      <section className="relative flex flex-col p-6 md:p-12">
        <header className="flex items-center justify-between">
          <a
            href="/"
            className="font-mono tracking-mono text-[12px] uppercase md:hidden"
          >
            Apex Tutor / 001
          </a>
          <a
            href="/"
            className="hidden md:inline font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60"
          >
            ← Back
          </a>
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            §{mode === "signin" ? "01" : "02"} / {mode === "signin" ? "Sign in" : "Sign up"}
          </span>
        </header>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[420px] mx-auto">
            <h1 className="text-[40px] leading-[1.05] tracking-[-0.02em]">
              {mode === "signin" ? "Sign in." : "Make an account."}
            </h1>
            <p className="mt-3 font-mono tracking-mono text-[12px] uppercase text-off-black/60">
              {mode === "signin"
                ? "Email + password, or your Google account."
                : "Free to start. Cancel anytime."}
            </p>
            <div className="mt-10">{children}</div>
          </div>
        </div>

        <footer className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 flex items-center justify-between">
          <span>© 2026 Apex Tutor</span>
          <span>Industrial Minimalism / 70Materia</span>
        </footer>
      </section>
    </main>
  );
}

export function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-1">
        {label}
      </span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full font-mono text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] bg-pure-white text-absolute-black focus:outline-none focus:ring-2 focus:ring-absolute-black focus:ring-offset-2"
      />
    </label>
  );
}

export function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-[1px] bg-absolute-black/30" />
      <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
        or
      </span>
      <div className="flex-1 h-[1px] bg-absolute-black/30" />
    </div>
  );
}
