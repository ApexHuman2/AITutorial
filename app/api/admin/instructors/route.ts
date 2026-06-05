import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("instructors").orderBy("createdAt", "desc").get();
  return NextResponse.json({ instructors: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, subject, voiceId, bio, avatarSeed, avatarStyle, photoUrl } = body;
  if (!name || !subject || !voiceId)
    return NextResponse.json({ error: "name, subject, voiceId required" }, { status: 400 });

  const ref = adminDb.collection("instructors").doc();
  await ref.set({
    name: name.trim(),
    subject,
    voiceId,
    bio: bio?.trim() ?? "",
    avatarStyle: avatarStyle?.trim() || "lorelei",
    avatarSeed: avatarSeed?.trim() || ref.id.slice(0, 8),
    photoUrl: photoUrl?.trim() ?? "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
}
