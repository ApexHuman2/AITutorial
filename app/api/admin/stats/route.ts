import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [usersSnap, coursesSnap] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("courses").get(),
  ]);

  const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{ id: string; status: string; lessonCount?: number }>;
  const published = courses.filter((c) => c.status === "published").length;
  const draft = courses.filter((c) => c.status === "draft").length;
  const totalLessons = courses.reduce((a, c) => a + (c.lessonCount ?? 0), 0);

  return NextResponse.json({
    users: usersSnap.data().count,
    totalCourses: courses.length,
    published,
    draft,
    totalLessons,
  });
}
