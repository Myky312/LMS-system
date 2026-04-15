import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ForgotPasswordPage, LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/DashboardPage";
import { ListCoursesPage } from "@/pages/courses-list";
import {
  CourseModulesPage,
  LessonTasksPage,
  ModuleLessonsPage,
  TakeQuizPage,
} from "@/pages/course-browse";
import { CreateCoursePage } from "@/pages/create-course";
import { CreateModulePage } from "@/pages/create-module";
import { CreateLessonPage } from "@/pages/create-lesson";
import { CreateTaskPage } from "@/pages/create-task";
import { AuthenticatedLayout } from "@/layouts/AuthenticatedLayout";
import { RequireTeacherOrAdmin } from "@/components/auth/RequireTeacherOrAdmin";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { UsersPage } from "@/pages/users";
import { isLoggedIn } from "@/lib/auth/session";

function RequireAuth() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function AppRouters() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route path="/courses" element={<ListCoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseModulesPage />} />
          <Route path="/courses/:courseId/modules/:moduleId" element={<ModuleLessonsPage />} />
          <Route
            path="/courses/:courseId/modules/:moduleId/lessons/:lessonId"
            element={<LessonTasksPage />}
          />
          <Route
            path="/courses/:courseId/modules/:moduleId/lessons/:lessonId/tasks/:taskId"
            element={<TakeQuizPage />}
          />
          <Route element={<RequireTeacherOrAdmin />}>
            <Route path="/courses/new" element={<CreateCoursePage />} />
            <Route path="/courses/:courseId/modules/new" element={<CreateModulePage />} />
            <Route path="/modules/:moduleId/lessons/new" element={<CreateLessonPage />} />
            <Route path="/lessons/:lessonId/tasks/new" element={<CreateTaskPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
