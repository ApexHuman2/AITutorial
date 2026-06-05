# Deployment — Vercel

## When the user is ready to deploy

Wait for them to ask, or proactively suggest deploying after Milestone 3 (auth works) so they can share progress with friends.

## Steps

### 1. Push to GitHub
If they don't have a repo yet:
- `gh repo create <name> --public --source=. --remote=origin --push`

(If `gh` isn't installed, walk them through `git init` + creating a repo manually on github.com.)

### 2. Import to Vercel
Tell the user:
> Go to **vercel.com/new**, click Import on the GitHub repo we just created, accept all defaults, click Deploy. It'll fail the first build because the env vars aren't set yet — that's expected.

### 3. Env vars on Vercel
**All of these** must be set in Project Settings → Environment Variables → Production (and Preview if they want preview deploys to work):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_ADMIN_UIDS
NEXT_PUBLIC_APP_URL          # = https://<their-vercel-url>
FIREBASE_ADMIN_KEY           # the whole service-account JSON, paste as-is
GROQ_API_KEY
PAYMONGO_SECRET_KEY          # only if payments are wired
PAYMONGO_WEBHOOK_SECRET      # only if payments are wired
```

After setting them: Deployments → click the latest → "..." → Redeploy. Env-var changes don't propagate to existing builds.

### 4. Update Firebase auth allowed domains
After deploy, the user MUST go to:
- Firebase Console → Authentication → Settings → Authorized domains → add the `*.vercel.app` URL

Otherwise sign-in popup blocks with "auth/unauthorized-domain".

### 5. Common production issues

| Symptom | Cause | Fix |
|---|---|---|
| Page hangs forever pending | `FIREBASE_ADMIN_KEY` not set on Vercel | Add the env var, redeploy |
| "5 NOT_FOUND" in function logs | Firestore database not created in Firebase project | Console → Firestore → Create database |
| Sign-in popup says unauthorized-domain | Vercel URL not in Firebase allowed list | See step 4 |
| Images don't load in TapLabel | Hot-linking blocked by host | Our `/api/img-proxy` should handle it — confirm the URL is reachable |
| "FIREBASE_PRIVATE_KEY parse error" | Newlines lost when pasting | Re-paste the JSON; Vercel handles multiline values now |

### 6. PayMongo webhooks
If payments are wired, the webhook URL on PayMongo dashboard must be exactly `https://<their-vercel-url>/api/webhooks/paymongo` — students forget the path part.

## Quick health check after deploy

Tell the user to:
1. Visit `/` — landing should load
2. Visit `/courses` — should redirect to sign-in (or show catalog if signed in)
3. Sign in once → check Firebase Console → Authentication that the user appeared
4. Visit `/admin` if their uid is in `NEXT_PUBLIC_ADMIN_UIDS` — should show the admin dashboard
