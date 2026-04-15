import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function AuthenticatedLayout() {
  return (
    <div className="flex" style={{ background: "var(--surface-ground)", minHeight: "100vh" }}>
      <AppSidebar />
      <div className="flex-1 flex flex-column min-w-0" style={{ minHeight: "100vh" }}>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
