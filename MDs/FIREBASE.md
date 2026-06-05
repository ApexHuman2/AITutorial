# Firebase — auth + Firestore setup

## When to set this up
The first time the user wants:
- A sign-in / sign-up flow
- To save user data (profile, progress, subscriptions)
- An admin area

Don't set up Firebase preemptively. Wait for the prompt.

## What you (Claude) do automatically

1. `npm i firebase firebase-admin`
2. Create `lib/firebase.ts` (client SDK init reading `NEXT_PUBLIC_FIREBASE_*` env vars)
3. Create `lib/firebaseAdmin.ts` (server SDK init reading the single env var `FIREBASE_ADMIN_KEY` = the entire service-account JSON; replace `\\n` → `\n` in the private key)
4. Create `lib/auth.ts` (signInWithGoogle / signInWithEmail / signUpWithEmail / signOut helpers + `ensureUserProfile` that writes a `users/{uid}` doc on first sign-in)
5. Create `firestore.rules` at project root
6. Tell the user what to paste where (see below)

## What to tell the user

> I've set up Firebase. To make it work you need to do three things:
> 1. Go to **console.firebase.google.com** → Create a project → Enable Authentication → enable Google + Email/Password
> 2. Add a Web app to the project. Copy the config values to `.env.local` (I've already created the file with the placeholders).
> 3. Go to Project Settings → Service accounts → Generate new private key → copy the **entire JSON file contents** into `.env.local` as `FIREBASE_ADMIN_KEY`.
> Then I'll wait while you do that. Tell me when you're ready and I'll test it.

## Env vars
`.env.local` needs all of these:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_ADMIN_UIDS=...            # comma-separated, who can access /admin
NEXT_PUBLIC_APP_URL=http://localhost:3000
FIREBASE_ADMIN_KEY={"type":"service_account",...}   # the whole JSON, one line OR with real newlines
```

## Firestore schema we use

- `users/{uid}` — `{ email, displayName, profile: { studentName, avatarStyle, avatarSeed }, subscription: { plan, status, validUntil } }`
- `users/{uid}/enrollments/{courseId}` — `{ completedLessonIds[], currentLessonId, lessons: { [id]: { lastStepIndex, completed, completedAt } }, streak, lastCompletionDate, lastVisitedAt }`
- `courses/{courseId}` — `{ title, subject, description, overview, outcomes[], gradeBand, instructorId, status: "draft"|"published", order, freeTier, lessonCount }`
- `courses/{courseId}/lessons/{lessonId}` — `{ title, objective, order, steps[] }`
- `config/instructorAvatarOverrides` — admin-published `{ [instructorId]: { style, seed } }`

## Firestore rules
Put this in `firestore.rules` and tell the user to paste it in Firebase Console → Firestore → Rules → Publish.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /enrollments/{courseId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if false;
      match /lessons/{lessonId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }
    match /config/{docId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

Admin writes go through server routes that use the Admin SDK, which bypasses these rules.

## Session cookie for server-side gates

For any paywall / leak-proof gating: mint a session cookie via `getAuth().createSessionCookie(idToken, { expiresIn })` on sign-in, set as HttpOnly, verify in server components via `getAuth().verifySessionCookie(cookie, true)`.

There's a helper pattern in this project at `lib/serverAuth.ts` and `app/api/auth/session/route.ts`. Replicate it when needed.

## When things go wrong
- "FIREBASE_ADMIN_KEY env var is not set" → user hasn't pasted the service-account JSON
- "5 NOT_FOUND: Database default does not exist" → user hasn't created the Firestore database in their Firebase project
- Page hangs forever in production → almost always missing env var on Vercel
