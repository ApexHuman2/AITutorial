"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { AuthShell, Field, Divider } from "./auth-ui";

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
