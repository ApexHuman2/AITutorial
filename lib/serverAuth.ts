import "server-only";
import { cookies } from "next/headers";
import { adminAuth, isAdminConfigured } from "./firebaseAdmin";

const COOKIE_NAME = "__session";

export async function getCurrentUser() {
  if (!isAdminConfigured()) return null;
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return decoded;
  } catch {
    return null;
  }
}

export function isAdmin(uid: string | undefined | null) {
  if (!uid) return false;
  const list = (process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(uid);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
