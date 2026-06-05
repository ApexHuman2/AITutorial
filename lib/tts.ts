"use client";

/**
 * Main-thread proxy to the Kokoro TTS Web Worker (lib/tts.worker.ts).
 *
 * The worker does ALL the heavy lifting — model download, WASM session creation,
 * and neural inference — so the UI thread stays responsive throughout a lesson.
 * This module just forwards requests and turns the returned WAV bytes into a
 * playable object-URL.
 *
 * Public API is unchanged from the old main-thread version:
 *   prefetchVoice() / isVoiceReady() / voiceLoadFailed()
 *   synthesizeToUrl(text, voiceId)
 *   onVoiceProgress() / getVoiceProgress() / getVoiceStatus()
 */

export const KOKORO_VOICES = new Set([
  "af_heart", "af_alloy", "af_aoede", "af_bella", "af_jessica", "af_kore",
  "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
  "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael",
  "am_onyx", "am_puck", "am_santa",
  "bf_alice", "bf_emma", "bf_isabella", "bf_lily",
  "bm_daniel", "bm_fable", "bm_george", "bm_lewis",
]);

export type VoiceStatus = "idle" | "loading" | "ready" | "error";

let status: VoiceStatus = "idle";
let progress = 0;
let worker: Worker | null = null;
let reqId = 0;

type Pending = { resolve: (url: string) => void; reject: (e: Error) => void; timer: number };
const pending = new Map<number, Pending>();

type Listener = (p: number, s: VoiceStatus) => void;
const listeners = new Set<Listener>();

export function onVoiceProgress(l: Listener): () => void {
  listeners.add(l);
  l(progress, status);
  return () => listeners.delete(l);
}
function emit() { listeners.forEach((l) => l(progress, status)); }

export function isVoiceReady() { return status === "ready"; }
export function voiceLoadFailed() { return status === "error"; }
export function getVoiceProgress() { return progress; }
export function getVoiceStatus() { return status; }

/* ---------- worker plumbing ---------- */

function ensureWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./tts.worker.ts", import.meta.url), { type: "module" });
  } catch (e) {
    console.error("[tts] worker init failed:", e);
    status = "error";
    emit();
    return null;
  }

  worker.onmessage = (e: MessageEvent) => {
    const m = e.data;
    switch (m?.type) {
      case "progress":
        progress = Math.max(progress, m.progress ?? 0);
        if (status !== "ready") status = "loading";
        emit();
        break;
      case "ready":
        status = "ready"; progress = 100; emit();
        break;
      case "error":
        status = "error"; emit();
        console.error("[tts] model load error:", m.message);
        break;
      case "audio": {
        const p = pending.get(m.id);
        if (p) {
          pending.delete(m.id);
          clearTimeout(p.timer);
          const blob = new Blob([m.wav], { type: "audio/wav" });
          p.resolve(URL.createObjectURL(blob));
        }
        break;
      }
      case "audio-error": {
        const p = pending.get(m.id);
        if (p) { pending.delete(m.id); clearTimeout(p.timer); p.reject(new Error(m.message)); }
        break;
      }
    }
  };
  worker.onerror = (err) => {
    console.error("[tts] worker error:", err.message);
    status = "error";
    emit();
  };

  return worker;
}

/* ---------- public API ---------- */

export function prefetchVoice(): Promise<void> {
  if (status === "ready") return Promise.resolve();
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error("Web Worker unavailable"));
  if (status !== "loading") {
    status = "loading";
    progress = 0;
    emit();
    w.postMessage({ type: "load" });
  }
  return Promise.resolve();
}

function normalizeVoice(voiceId: string): string {
  return KOKORO_VOICES.has(voiceId) ? voiceId : "af_heart";
}

export function synthesizeToUrl(text: string, voiceId = "af_heart"): Promise<string> {
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error("Web Worker unavailable"));
  if (status === "idle") void prefetchVoice();

  const id = ++reqId;
  return new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error("TTS timeout")); }
    }, 25000);
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ type: "generate", id, text, voice: normalizeVoice(voiceId) });
  });
}
