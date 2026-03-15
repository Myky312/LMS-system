import { redirect } from "next/navigation";

export default async function ModuleLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
  redirect(`/courses/${courseId}/modules/${moduleId}`);
}
