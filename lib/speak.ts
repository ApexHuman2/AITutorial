"use client";

/**
 * Tutor voice orchestrator.
 *
 * Quality path: Kokoro 82M neural TTS (lib/tts.ts), run in a Web Worker.
 * Instant path: the browser's SpeechSynthesis — a zero-latency fallback while
 *   the Kokoro model is still downloading, or if it can't load at all.
 *
 * Long lines are split into sentence-sized chunks and synthesized + played in
 * order. Kokoro has a per-generation token limit, so a single long clip can get
 * truncated ("voice stops midway") — chunking guarantees the whole line is read.
 *
 * Public API (speak / cancelSpeech / setVoiceEnabled / isVoiceEnabled) is
 * unchanged so callers don't care which engine produced the audio.
 */

import {
  prefetchVoice, synthesizeToUrl, isVoiceReady, voiceLoadFailed,
  onVoiceProgress, getVoiceProgress, getVoiceStatus,
} from "./tts";

let enabled = true;
let seq = 0;                                  // bumps to invalidate in-flight speech
let currentAudio: HTMLAudioElement | null = null;
let currentResolve: (() => void) | null = null;
const liveUrls = new Set<string>();

/* ---------- controls ---------- */

export function setVoiceEnabled(v: boolean) {
  enabled = v;
  if (!v) cancelSpeech();
}
export function isVoiceEnabled() {
  return enabled;
}

/** Start downloading the Kokoro model ahead of time. Safe to call repeatedly. */
export function preloadVoice() {
  if (typeof window === "undefined") return;
  prefetchVoice().catch(() => {/* fallback engine will cover us */});
}

export { isVoiceReady, voiceLoadFailed, onVoiceProgress, getVoiceProgress, getVoiceStatus };

/* ---------- speak ---------- */

export function speak(text: string, voiceId = "af_heart") {
  if (!enabled || typeof window === "undefined" || !text.trim()) return;
  cancelSpeech();
  const myToken = seq;

  if (isVoiceReady()) {
    void playKokoroQueue(text, voiceId, myToken);
  } else {
    // Instant feedback now; warm the HD model for next time.
    browserSpeak(text, voiceId);
    if (!voiceLoadFailed()) preloadVoice();
  }
}

/** Split a line into sentence-sized chunks, each safely under Kokoro's limit. */
function chunkText(text: string, maxLen = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const chunks: string[] = [];
  let buf = "";
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (buf && (buf.length + 1 + s.length) > maxLen) {
      chunks.push(buf);
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
    // A single sentence longer than maxLen: hard-split on spaces.
    while (buf.length > maxLen) {
      let cut = buf.lastIndexOf(" ", maxLen);
      if (cut <= 0) cut = maxLen;
      chunks.push(buf.slice(0, cut).trim());
      buf = buf.slice(cut).trim();
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [text];
}

async function playKokoroQueue(text: string, voiceId: string, myToken: number) {
  const chunks = chunkText(text);
  // Kick off synthesis for every chunk up front. The worker serializes them, so
  // later chunks are usually ready by the time earlier ones finish playing.
  const urlPromises = chunks.map((c) =>
    synthesizeToUrl(c, voiceId).then(
      (u) => u,
      () => null as string | null,
    )
  );

  for (let i = 0; i < urlPromises.length; i++) {
    if (myToken !== seq || !enabled) break;
    const url = await urlPromises[i];
    if (myToken !== seq || !enabled) { if (url) URL.revokeObjectURL(url); break; }

    if (!url) {
      // Synthesis failed. If nothing has played yet, fall back to the browser
      // voice for the whole line so the student still hears something.
      if (i === 0 && myToken === seq) browserSpeak(text, voiceId);
      break;
    }

    liveUrls.add(url);
    await playUrl(url);
    if (liveUrls.has(url)) { URL.revokeObjectURL(url); liveUrls.delete(url); }
  }
}

function playUrl(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    currentResolve = resolve;
    const done = () => {
      if (currentAudio === audio) currentAudio = null;
      if (currentResolve === resolve) currentResolve = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}

/* ---------- cancel ---------- */

export function cancelSpeech() {
  seq++;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  // Resolve any awaiting playback so the queue loop can exit cleanly.
  if (currentResolve) {
    const r = currentResolve;
    currentResolve = null;
    r();
  }
  liveUrls.forEach((u) => URL.revokeObjectURL(u));
  liveUrls.clear();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/* ---------- browser fallback ---------- */

function pickBrowserVoice(voiceId: string): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const wantsFemale = voiceId.startsWith("af") || voiceId.startsWith("bf");
  const byName = voices.find((v) =>
    wantsFemale
      ? /female|samantha|victoria|karen|moira|tessa|fiona|zira/i.test(v.name)
      : /male|daniel|alex|fred|rishi|aaron|david/i.test(v.name)
  );
  return byName ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

function browserSpeak(text: string, voiceId: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  // Chrome stops long utterances after ~15s; splitting avoids that too.
  for (const chunk of chunkText(text, 160)) {
    const u = new SpeechSynthesisUtterance(chunk);
    const v = pickBrowserVoice(voiceId);
    if (v) u.voice = v;
    u.rate = 0.98;
    u.pitch = voiceId.startsWith("af") || voiceId.startsWith("bf") ? 1.05 : 0.95;
    window.speechSynthesis.speak(u);
  }
}
