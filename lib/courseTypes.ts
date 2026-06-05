export type CourseStatus = "draft" | "published";

export type StepType =
  | "intro"
  | "explainer"
  | "quiz"
  | "fill-blank"
  | "true-false"
  | "match-pairs"
  | "sort-sequence"
  | "fraction-bar"
  | "pie-divider"
  | "number-line"
  | "tap-label";

export type Step = {
  type: StepType;
  script: string;
  prompt?: string;
  // quiz / multiple choice
  choices?: string[];
  // generic answer (quiz index, fill-blank string, true-false "true"/"false")
  answer?: string | number;
  // match-pairs
  pairs?: { left: string; right: string }[];
  // sort-sequence (the items in the CORRECT order)
  items?: string[];
  // fraction-bar / pie-divider
  numerator?: number;
  denominator?: number;
  // number-line
  min?: number;
  max?: number;
  target?: number;
  // tap-label
  labels?: { x: number; y: number; text: string }[];
  imageUrl?: string;
};

export type Lesson = {
  id: string;
  title: string;
  objective: string;
  order: number;
  steps: Step[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Course = {
  id: string;
  title: string;
  subject: "Math" | "Science" | "Language Arts";
  description: string;
  overview?: string;
  outcomes?: string[];
  topics?: string[];
  gradeBand?: string;
  instructorId: string;
  status: CourseStatus;
  order?: number;
  freeTier: boolean;
  lessonCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Instructor = {
  id: string;
  name: string;
  subject: string;
  voiceId: string;
  bio: string;
  avatarSeed: string;
  avatarStyle?: string;
  photoUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/* Human labels + emoji for the widget palette (admin + AI prompt) */
export const STEP_META: Record<StepType, { label: string; icon: string; blurb: string }> = {
  intro:           { label: "Intro",          icon: "✦", blurb: "Tutor greeting / setup" },
  explainer:       { label: "Explainer",      icon: "❝", blurb: "Short spoken explanation" },
  quiz:            { label: "Multiple choice", icon: "◉", blurb: "Pick the right answer" },
  "fill-blank":    { label: "Fill blank",     icon: "▢", blurb: "Type the missing word" },
  "true-false":    { label: "True / false",   icon: "⊺", blurb: "Two-way choice" },
  "match-pairs":   { label: "Match pairs",    icon: "⇄", blurb: "Connect left to right" },
  "sort-sequence": { label: "Sort order",     icon: "↕", blurb: "Drag into correct order" },
  "fraction-bar":  { label: "Fraction bar",   icon: "▭", blurb: "Tap segments to fill" },
  "pie-divider":   { label: "Pie slices",     icon: "◐", blurb: "Tap pizza slices" },
  "number-line":   { label: "Number line",    icon: "↦", blurb: "Click the right spot" },
  "tap-label":     { label: "Tap to label",   icon: "⌖", blurb: "Tap regions on an image" },
};
