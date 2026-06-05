import "server-only";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function readServiceAccount() {
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_ADMIN_KEY env var is not set. Paste the entire service-account JSON into .env.local."
    );
  }
  const json = JSON.parse(raw);
  if (json.private_key && json.private_key.includes("\\n")) {
    json.private_key = json.private_key.replace(/\\n/g, "\n");
  }
  return json;
}

let _adminApp: App | null = null;
function getAdminApp(): App {
  if (_adminApp) return _adminApp;
  const existing = getApps();
  if (existing.length) {
    _adminApp = existing[0];
    return _adminApp;
  }
  _adminApp = initializeApp({ credential: cert(readServiceAccount()) });
  return _adminApp;
}

export function isAdminConfigured() {
  return Boolean(process.env.FIREBASE_ADMIN_KEY);
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_t, prop) {
    return Reflect.get(getAuth(getAdminApp()) as object, prop);
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_t, prop) {
    return Reflect.get(getFirestore(getAdminApp()) as object, prop);
  },
});
