# Apex Tutor — Product Requirements

This is what we're building and why. When the user is vague ("make it better"), read this and make a decision that's consistent with the vision below.

## One-line description

**An AI tutor for grade-school students that teaches by guiding, not by chatting — like Synthesis Tutor, but linear, multi-modal, and parent-affordable.**

## Who it's for

- **Primary user:** students aged 9–18, with light-to-no parental supervision during use
- **Secondary user:** parents who pay for it and want a measurable alternative to a $40-80/hour private tutor
- **NOT for:** college students, professional learners, casual self-study adults. The voice, pacing, and gamification are aimed at the 9–18 band.

## What it does

1. **Linear lessons led by an AI tutor.** Each lesson has a fixed sequence of authored "steps" — intro → explainer → interactive widget → quiz → checkpoint. The student walks through them one at a time. The tutor speaks, the student taps/types/drags/talks.
2. **Voice-first.** A friendly named character (Maria for Math, Marco for Science) speaks every step aloud via on-device TTS. The student feels guided, not lectured.
3. **Interactive at every step.** Almost no walls of text. Drag-and-drop, multiple choice, fraction bars, balance scales, pizza slicing, letter tiles. Math feels physical, vocabulary feels like a game.
4. **Synthesis-style mistake handling.** Wrong answers don't punish — the tutor switches to "encouraging", offers a hint, and lets the student retry. Continue only appears after a real correct answer.
5. **Progress + streaks + replays.** Daily goal, 7-day streak, course-level progress arc, satisfying celebrations on every milestone.
6. **Parent-affordable pricing.** Free tier with ~3 starter courses; paid plans ₱199 (Starter) and ₱399 (Family) per month.

## What it explicitly is NOT

- **NOT a chatbot.** No open text box where the kid types whatever they want and the AI responds. The student is on a guided rail. The tutor leads. (There IS a Q&A side panel for mid-lesson questions, but it's a side road, not the main path.)
- **NOT a video platform.** No pre-recorded lectures. Every step is interactive.
- **NOT a worksheet generator.** We're not printing PDFs of problems. The interactivity IS the product.
- **NOT a marketplace.** Only the admin (you) creates courses. No user-uploaded content.
- **NOT a language app.** It teaches Math and Science. Language Arts is a "maybe" later.

## North-star design principles (in order of priority)

1. **The tutor leads.** Default to the tutor speaking and the student responding, not the other way around.
2. **Show, don't tell.** A fraction is a pizza slice you tap, not a paragraph about denominators.
3. **Mistake-friendly.** "Try again" is the default framing for wrong answers. Never "you're wrong".
4. **Linear and gated.** A student can't jump to lesson 5 before finishing lessons 1–4. The journey is curated.
5. **Premium minimalism.** Dark monochrome aesthetic (Linear / Vercel / Krea), not playful cartoon. The 12-year-old should feel like they're using a serious tool, not a toy.
6. **Always-on voice and animation.** Voice and motion are not extras — they're load-bearing. Static text would feel broken.

## The five key user journeys (in priority order)

### 1. The first-time student (most important to nail)
Lands on the homepage → sees the value prop → signs up → lands on the courses catalog → sees one recommended course → opens it → meets the tutor (Maria) → starts lesson 1 → completes 3 steps → finishes lesson 1 → sees a celebration → wants lesson 2.

**Friction-killing rule:** if a first-time student doesn't reach the "completed lesson 1" moment in under 5 minutes, we've failed.

### 2. The returning student
Opens the dashboard → sees "Continue: Lesson 3 · ~6 min" hero → taps → resumes exactly where they left off → finishes the lesson → comes back tomorrow → streak goes from 2 → 3.

### 3. The parent
Lands on the homepage → reads the pricing → understands the value → subscribes → gets a receipt → the child's account unlocks all courses.

### 4. The admin (this is you / the project owner)
Signs in → goes to /admin → creates a new course → fills in title + subject → clicks "Generate with AI" → AI produces 5-7 steps → reviews and tweaks → publishes → all students see it on the catalog within seconds.

### 5. The replay student
Already finished a course → opens it → every lesson shows a check → taps any lesson to replay → no penalties, no streak loss → score / time tracking starts to matter (future).

## Personality + tone

The tutor is:
- **Warm but not saccharine.** "Nice — let's keep going" not "Wow!!! Amazing!!! 🌟"
- **Encouraging on wrong answers.** "Not quite — take another look" not "Wrong."
- **Brief.** Every spoken line is one or two short sentences. No paragraphs.
- **English-default.** Filipino-relatable examples (peso, jeepney, palengke, basketball) are OK if expressed in English — but the app should work for ANY English-speaking grade-schooler, not be PH-only.
- **First-name basis.** The tutor uses the student's name from their profile.

## Constraints

### Technical
- Free tier of Groq (no $$$ models)
- Kokoro TTS runs client-side (no per-request voice cost)
- Firebase free tier acceptable for development; expect to upgrade for production scale
- All AI output validated before storage — never crash because the model returned malformed JSON

### Content
- Lessons start short (5–7 steps, ~6 minutes)
- A "course" has 5–12 lessons
- Two starting subjects: Math (Maria) and Science (Marco)
- Grade band 4–12, but content authored for grade 5–8 sweet spot first

### Aesthetic
- See `STYLING.md`. No bright colors. No playful illustration. The look says "premium learning tool" not "kids' app".

## How to decide when the student asks something vague

When the user types "make it better" / "add a feature" / "this doesn't feel right":

1. **Check if it aligns with a north-star principle.** If not, gently redirect: "I could do X — but Y would actually match the Synthesis-style direction better. Should I go with Y?"
2. **If it aligns with multiple principles equally**, pick the one that improves the first-time student journey (Journey #1 above).
3. **If you can't tell**, ask exactly one question — the most concrete one — then proceed.

## What "done" means for the whole project

The project is done when:
- A student can sign up, finish their first lesson with voice + interactive widgets, and feel like a real person taught them something
- An admin can create a new course with AI in under 5 minutes
- The product feels closer to Synthesis Tutor than to Duolingo, and closer to Linear than to Khan Academy in visual design

If the student asks for something that pushes us away from this, gently flag it: "That would make it more like Duolingo — are you sure?"

## What we're NOT building (yet)

These are tempting but out of scope for the initial build. Resist scope creep:
- Live multi-student lessons
- A parent dashboard with detailed analytics
- A leaderboard / competitive features
- Custom user-authored courses
- Mobile apps (it's web-first; PWA later if needed)
- Voice INPUT beyond the existing quiz-answer mic (no open conversational voice)
- More than 2 instructors at launch (Maria + Marco only)

If the student asks for one of these, tell them: "That's on the roadmap but let's finish the core experience first."
