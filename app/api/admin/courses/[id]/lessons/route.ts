import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const snap = await adminDb.collection("courses").doc(id).collection("lessons").orderBy("order").get();
  return NextResponse.json({ lessons: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, objective, steps } = body;

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  // Count existing lessons for order
  const existing = await adminDb.collection("courses").doc(id).collection("lessons").count().get();
  const order = existing.data().count + 1;

  const ref = adminDb.collection("courses").doc(id).collection("lessons").doc();
  await ref.set({
    title: title.trim(),
    objective: objective?.trim() ?? "",
    order,
    steps: steps ?? [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Update lessonCount on parent course
  await adminDb.collection("courses").doc(id).update({
    lessonCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id, order });
}
