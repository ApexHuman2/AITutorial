import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const doc = await adminDb.collection("courses").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = doc.data()?.status ?? "draft";
  const next = current === "published" ? "draft" : "published";
  await adminDb.collection("courses").doc(id).update({ status: next, updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ status: next });
}
