import { redirect } from "next/navigation";

export default async function LessonRedirect({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  redirect(`/learn/${id}/${lessonId}`);
}
