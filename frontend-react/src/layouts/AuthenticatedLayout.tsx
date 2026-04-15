import { Outlet, useMatch } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CourseOutlineSidebar } from "@/components/browse/CourseOutlineSidebar";

export function AuthenticatedLayout() {
  const courseMatch = useMatch("/courses/:courseId/*");
  const rawId = courseMatch?.params.courseId;
  const outlineCourseId = rawId && rawId !== "new" ? rawId : undefined;

  return (
    <div className="flex" style={{ background: "var(--surface-ground)", minHeight: "100vh" }}>
      <AppSidebar />
      {outlineCourseId ? <CourseOutlineSidebar courseId={outlineCourseId} /> : null}
      <div className="flex-1 flex flex-column min-w-0" style={{ minHeight: "100vh" }}>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
