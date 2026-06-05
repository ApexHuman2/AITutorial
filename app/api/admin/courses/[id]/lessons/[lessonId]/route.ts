import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string; lessonId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, lessonId } = await params;
  const body = await req.json();
  const allowed = ["title", "objective", "steps", "order"];
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  await adminDb.collection("courses").doc(id).collection("lessons").doc(lessonId).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, lessonId } = await params;
  await adminDb.collection("courses").doc(id).collection("lessons").doc(lessonId).delete();
  await adminDb.collection("courses").doc(id).update({
    lessonCount: FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true });
}
