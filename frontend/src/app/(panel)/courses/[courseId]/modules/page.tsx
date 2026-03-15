import { redirect } from "next/navigation";

export default async function CourseModulesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/courses/${courseId}`);
}
