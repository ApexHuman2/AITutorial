/**
 * Kokoro TTS Web Worker.
 *
 * All model loading + neural inference happens here, OFF the main thread, so the
 * lesson UI never freezes while the tutor's voice is being synthesized.
 *
 * Messages in:  { type: "load" }
 *               { type: "generate", id, text, voice }
 * Messages out: { type: "progress", progress }
 *               { type: "ready" }
 *               { type: "error", message }
 *               { type: "audio", id, wav }            (wav transferred)
 *               { type: "audio-error", id, message }
 */

import { KokoroTTS } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

const ctx = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((e: MessageEvent) => void) | null;
};

let tts: KokoroTTS | null = null;
let loadPromise: Promise<KokoroTTS> | null = null;

function load(): Promise<KokoroTTS> {
  if (tts) return Promise.resolve(tts);
  if (loadPromise) return loadPromise;

  const opts = {
    dtype: "q8",
    device: "wasm",
    progress_callback: (data: { status?: string; progress?: number }) => {
      if (data?.status === "progress" && typeof data.progress === "number") {
        ctx.postMessage({ type: "progress", progress: Math.round(data.progress) });
      }
    },
  } as unknown as Parameters<typeof KokoroTTS.from_pretrained>[1];

  loadPromise = KokoroTTS.from_pretrained(MODEL_ID, opts)
    .then((model) => {
      tts = model;
      ctx.postMessage({ type: "ready" });
      return model;
    })
    .catch((e) => {
      loadPromise = null;
      ctx.postMessage({ type: "error", message: String((e as Error)?.message ?? e) });
      throw e;
    });

  return loadPromise;
}

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data as
    | { type: "load" }
    | { type: "generate"; id: number; text: string; voice: string };

  if (msg.type === "load") {
    load().catch(() => {/* error already posted */});
    return;
  }

  if (msg.type === "generate") {
    const { id, text, voice } = msg;
    try {
      const model = await load();
      const genOpts = { voice } as unknown as Parameters<KokoroTTS["generate"]>[1];
      const audio = await model.generate(String(text).slice(0, 500), genOpts);
      const wav = audio.toWav(); // ArrayBuffer
      ctx.postMessage({ type: "audio", id, wav }, [wav]);
    } catch (err) {
      ctx.postMessage({ type: "audio-error", id, message: String((err as Error)?.message ?? err) });
    }
  }
};
