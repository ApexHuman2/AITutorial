# AI models — what to use for what

All AI runs through **Groq** via `groq-sdk`. One API key, three models.

## Env var
```
GROQ_API_KEY=gsk_...
```
User gets this from console.groq.com (free tier is generous).

## Models

### Text — `llama-3.1-8b-instant`
Use for: chat tutoring, hint generation, lesson generation, per-step regeneration, fill-in-the-blank generation, anything text → text.

Why this and not the 70B: free tier of Groq caps 70B at ~100k tokens/day. 8B has 5× the quota, plenty fast (~1s typical), good enough quality for grade-school tutoring.

```ts
groqClient.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [...],
  temperature: 0.6,
  max_tokens: 800,
  stream: false,                  // or true for chat
  response_format: { type: "json_object" }, // when expecting structured output
});
```

### Vision — `meta-llama/llama-4-scout-17b-16e-instruct`
Use only when the latest user message includes images. Switch model only for that turn.

```ts
// Switch the last user turn to multimodal content array
const last = {
  role: "user",
  content: [
    { type: "text", text: userText },
    ...images.map(url => ({ type: "image_url", image_url: { url } }))
  ]
};
```

### Speech-to-text — `whisper-large-v3-turbo`
Use for the "answer with voice" mic feature in QuizCard, or anywhere we need the student to speak.

```ts
groqClient.audio.transcriptions.create({
  file,                       // multipart File from the client
  model: "whisper-large-v3-turbo",
  language: "en",
  response_format: "json",
  temperature: 0,
});
```

## Text-to-speech (NOT Groq)

For the tutor speaking back, we use **Kokoro 82M ONNX** **client-side**:

```ts
import { synthesize } from "@/lib/tts";
const { audio, samplingRate } = await synthesize(text, "English", voiceId);
```

Voice IDs we use:
- `af_heart` — soft female (Maria default)
- `am_michael` — warm male (Marco default)

The model is ~100MB; it downloads on first use and caches forever. **Always preload it** with `prefetchVoice()` on the course detail page and again on the lesson page mount, so it's ready before the first script needs to be spoken.

## Patterns

### Streaming chat
```ts
const stream = await groqClient.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages,
  stream: true,
});
for await (const chunk of stream) {
  // pipe to ReadableStream → ReactJsonResponse
}
```

### JSON mode (structured output)
Set `response_format: { type: "json_object" }` AND mention "return JSON" in the system prompt. Then `JSON.parse(completion.choices[0].message.content)` and validate.

### Always validate AI output
The AI lies sometimes. After parsing JSON, coerce + validate each field. Drop malformed items silently rather than crash.

## Cost guard
Groq is free up to limits. If the user opens a heavy paid plan later, the heaviest cost is image vision turns. Keep `max_tokens` modest (60 for hints, 800 for lessons, 2000 max for any one call).
