import { Navigate, Outlet } from "react-router-dom";
import { getSessionUser } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/roles";

export function RequireAdmin() {
  const user = getSessionUser();
  if (user?.role !== USER_ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
