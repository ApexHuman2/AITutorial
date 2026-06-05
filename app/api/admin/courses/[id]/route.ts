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
  const [courseSnap, lessonsSnap] = await Promise.all([
    adminDb.collection("courses").doc(id).get(),
    adminDb.collection("courses").doc(id).collection("lessons").orderBy("order").get(),
  ]);

  if (!courseSnap.exists)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    course: { id: courseSnap.id, ...courseSnap.data() },
    lessons: lessonsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ["title", "subject", "description", "overview", "outcomes", "topics", "gradeBand", "instructorId", "freeTier", "order"];
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  await adminDb.collection("courses").doc(id).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  // Delete all lessons first
  const lessons = await adminDb.collection("courses").doc(id).collection("lessons").get();
  await Promise.all(lessons.docs.map((d) => d.ref.delete()));
  await adminDb.collection("courses").doc(id).delete();
  return NextResponse.json({ ok: true });
}
