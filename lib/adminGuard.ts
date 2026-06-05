import "server-only";
import { getCurrentUser, isAdmin } from "./serverAuth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid)) redirect("/signin");
  return user;
}
