import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "subject", "voiceId", "bio", "avatarStyle", "avatarSeed", "photoUrl"];
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const k of allowed) if (k in body) update[k] = body[k];

  await adminDb.collection("instructors").doc(id).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await adminDb.collection("instructors").doc(id).delete();
  return NextResponse.json({ ok: true });
}
