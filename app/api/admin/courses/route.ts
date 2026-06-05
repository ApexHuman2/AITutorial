import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("courses").orderBy("createdAt", "desc").get();
  const courses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, subject, description, instructorId, gradeBand, freeTier, topics } = body;

  if (!title || !subject || !instructorId)
    return NextResponse.json({ error: "title, subject, instructorId required" }, { status: 400 });

  const ref = adminDb.collection("courses").doc();
  await ref.set({
    title: title.trim(),
    subject,
    description: description?.trim() ?? "",
    instructorId,
    gradeBand: gradeBand ?? "5-8",
    topics: Array.isArray(topics) ? topics.map((t: unknown) => String(t)).filter(Boolean) : [],
    freeTier: freeTier ?? false,
    status: "draft",
    lessonCount: 0,
    order: Date.now(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
}
