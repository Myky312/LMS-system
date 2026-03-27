import { Navigate, Outlet } from "react-router-dom";
import { getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";

/**
 * Allows only ADMIN and TEACHER. Students are sent to the dashboard.
 */
export function RequireTeacherOrAdmin() {
  const user = getSessionUser();
  if (!isTeacherOrAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
