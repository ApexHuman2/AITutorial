"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithGoogle, signUpWithEmail } from "@/lib/auth";
import { AuthShell, Divider, Field } from "../signin/page";

export default function SignUpPage() {
  return (
    <AuthShell mode="signup">
      <SignUpForm />
    </AuthShell>
  );
}

function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await signUpWithEmail(email, password, name);
      router.push("/dashboard");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign up failed");
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
      setErr(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field
          label="Student name"
          type="text"
          value={name}
          onChange={setName}
          autoComplete="name"
          required
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          label="Password (6+ characters)"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full font-mono tracking-mono text-[12px] uppercase px-6 py-2 rounded-[3px] bg-off-black text-pure-white disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create account →"}
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
        Already have an account?{" "}
        <a href="/signin" className="underline">
          Sign in
        </a>
      </p>
    </>
  );
}
