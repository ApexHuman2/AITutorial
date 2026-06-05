# How to add a new interactive widget

The lesson player walks through a list of `steps[]`. Each step is one widget — a quiz, a fraction bar, a drag-to-sort. Adding a new one is **always the same 6-step pattern**.

## The 6 steps (do them in order; don't skip)

### 1. Add the step type
In `lib/courses.ts`, add a new `Step*` interface to the union:
```ts
export type StepWordSearch = {
  type: "word-search";
  script: string;
  prompt?: string;
  grid: string[][];        // letter grid
  targets: string[];       // words to find
};
```
Then add it to the `Step` union at the bottom.

### 2. Build the widget component
In `components/widgets/<Name>.tsx`. Follow the existing pattern:
- `"use client"` directive
- Card entrance animation via `gsap.fromTo(cardRef, ...)` with cleanup
- Local state for student input
- `onAnswer(isCorrect)` callback prop
- Optional `onWrong()` callback prop
- Use `useUiSounds()` for correct/wrong sounds
- Use `hapticTap()` / `hapticError()` for vibration
- Use `celebrateBurst()` or one of the variants from `lib/confetti.ts` on success
- Use `pickEncouragement(widgetType, lastIdx)` for mistake-friendly retry copy
- Outer card classes: `"bg-coal rounded-[14px] border border-[var(--border-subtle)] p-4 sm:p-5"`

Copy `components/widgets/TrueFalse.tsx` as the simplest template.

### 3. Wire into `CoursePlayer.tsx`
In the file, find:
- The `case "<your-type>":` block inside `StepBody` → add yours, render the widget, pass `onAnswerResult` + `onComplete` + `onWrong`
- The `avatarState()` function → add your type to the interactive list so the tutor goes into "thinking"
- The idle-hint `isInteractive` check → add your type
- The hint-button visibility check → add your type
- `composeNarration()` → add a case that speaks the prompt (NOT the answer)
- `summarizeStep()` → add a case for the hint-context summary

### 4. Add the admin editor
In `components/admin/StepEditors.tsx`, export `<YourName>Editor`. Inputs for every authoring field. Follow the existing patterns (`ScriptField`, `NumberField` helpers).

### 5. Register in the lesson-editor catalog
In `app/admin/courses/[id]/lessons/[lessonId]/LessonEditorClient.tsx`:
- Import the editor
- Add an entry to `STEP_TYPES` (emoji, label, description, defaults)
- Add it to `EDITOR_REGISTRY`

### 6. Teach the AI to generate it
In `lib/lessonGenerator.ts` and `lib/stepGenerator.ts`:
- Add a `case "<your-type>":` block to `coerceStep()` that validates the AI's JSON shape
- Add the type to the system-prompt shape list so the model knows it's an option
- Add to the per-step regenerate allowlist in `app/api/admin/generate-step/route.ts`

Optionally also add it to the "What's inside" catalog on `app/courses/[id]/page.tsx` with an icon.

## Verify
- `npm run build` — must pass
- Open `/admin/courses/<some-course>/lessons/<some-lesson>` → add a step of the new type → fill in the fields → save
- Open the lesson as a student → the widget renders, you can solve it, Continue appears

## Existing widgets (for reference)

Math-leaning:
- `FractionBar.tsx`
- `PieDivider.tsx`
- `NumberLine.tsx`
- `BalanceScale.tsx`

Universal:
- `QuizCard.tsx`
- `TrueFalse.tsx`
- `FillBlank.tsx`
- `MatchPairs.tsx`
- `SortSequence.tsx`

Language / reading:
- `Highlight.tsx`
- `ReadingPassage.tsx`
- `LetterTiles.tsx`

Science / diagrams:
- `TapLabel.tsx`

When the user describes a widget they want, **check this list first** — chances are something close already exists. Suggest the closest match before building new.
