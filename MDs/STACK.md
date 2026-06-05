# Tech Stack — locked in

Don't deviate. If the user asks for a feature, pick from this list.

## Framework
- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript 5**

`npx create-next-app@latest . --typescript --tailwind --app --use-npm --no-src-dir` to scaffold a fresh project.

## Styling
- **Tailwind CSS v4** with `@theme` block in `app/globals.css`
- **shadcn/ui** — install on demand: `npx shadcn@latest add <component>`
- **lucide-react** — icons
- **clsx** + **tailwind-merge** — exposed as a `cn()` helper in `lib/utils.ts`

## Animation
- **gsap** — sequences, ScrollTrigger
- **motion** (formerly Framer Motion) — component animations, AnimatePresence
- **canvas-confetti** — celebrations
- **lottie-react** — optional decorative JSON animations

`npm i gsap motion canvas-confetti lottie-react @types/canvas-confetti`

## Drag & drop
- **@dnd-kit/core** + **@dnd-kit/sortable**

`npm i @dnd-kit/core @dnd-kit/sortable`

## Avatars
- **@dicebear/core** + **@dicebear/collection** — student + tutor avatars
- **boring-avatars** — geometric fallback

`npm i @dicebear/core @dicebear/collection boring-avatars`

## Math + markdown
- **react-markdown** + **remark-math** + **remark-gfm** + **rehype-katex** + **katex**

`npm i react-markdown remark-math remark-gfm rehype-katex katex`

## Audio / voice
- **kokoro-js** — client-side tutor TTS
- **@huggingface/transformers** — required by kokoro-js
- **howler** + **use-sound** — UI sound effects

`npm i kokoro-js @huggingface/transformers howler use-sound @types/howler`

## Auth + database
- **firebase** (client SDK) + **firebase-admin** (server SDK)

`npm i firebase firebase-admin`

## Payments
- **PayMongo** — direct REST integration; no SDK needed

## AI
- **groq-sdk** — all text + vision + Whisper STT through Groq

`npm i groq-sdk`

## Conventions
- Components in `components/`. Pages in `app/`.
- Server-only utilities in `lib/` and prefer the `"server-only"` import for ones that touch Admin SDK.
- Client utilities also in `lib/` with `"use client"` directives where needed.
- Shared helpers (like `cn`) in `lib/utils.ts`.
- The `"@/..."` import alias is configured by `create-next-app` — use it.

## Don't add
- Phaser, PixiJS, three.js — overkill for our widgets
- jQuery / lodash — we have modern alternatives
- A CSS-in-JS library — Tailwind is enough
- A new state manager — React + Firestore listeners cover us

## Verifying everything works
After ANY change: `npm run build`. If it fails, fix it before reporting back.
