import { Link, NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { appNavItems } from "@/config/nav";
import { clearSession, getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";
import { roleLabelRu } from "@/lib/auth/role-labels";

function userInitials(email: string): string {
  const part = email.split("@")[0] ?? email;
  if (part.length >= 2) return part.slice(0, 2).toUpperCase();
  return (part[0] ?? "?").toUpperCase();
}

export function AppSidebar() {
  const navigate = useNavigate();
  const user = getSessionUser();

  const logout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className="flex flex-column surface-card border-right-1 surface-border"
      style={{ width: "17rem", minHeight: "100vh", flexShrink: 0 }}
    >
      <div className="p-4 border-bottom-1 surface-border">
        <Link
          to="/dashboard"
          className="flex align-items-center gap-2 text-xl no-underline"
          style={{ color: "var(--text-color)" }}
        >
          <i className="pi pi-th-large" style={{ color: "var(--primary-color)" }} />
          ZeekrAcademy
        </Link>
      </div>

      <nav className="flex flex-column gap-1 p-3 flex-1" aria-label="Основное меню">
        {appNavItems
          .filter((item) => {
            if (!item.roles?.length) return true;
            return isTeacherOrAdmin(user);
          })
          .map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              [
                "flex align-items-center gap-2 px-3 py-2 border-round no-underline transition-colors transition-duration-150",
                isActive
                  ? "text-white"
                  : "text-color hover:surface-hover",
              ].join(" ")
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: "var(--primary-color)" }
                : { color: "var(--text-color)" }
            }
          >
            <i className={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-3 border-top-1 surface-border surface-section">
        <div className="text-xs text-color-secondary mb-2 px-2">Профиль</div>
        {user ? (
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-2 px-2">
              <Avatar label={userInitials(user.email)} shape="circle" size="large" />
              <div className="flex flex-column min-w-0" style={{ flex: "1 1 auto" }}>
                <span
                  className="text-sm line-height-1 white-space-nowrap overflow-hidden text-overflow-ellipsis"
                  style={{ color: "var(--text-color)" }}
                  title={user.email}
                >
                  {user.email}
                </span>
                <span className="text-xs text-color-secondary line-height-1 mt-1">
                  {roleLabelRu(user.role)}
                </span>
              </div>
            </div>
            <Button
              label="Выйти"
              icon="pi pi-sign-out"
              outlined
              className="w-full"
              type="button"
              onClick={logout}
            />
          </div>
        ) : (
          <span className="text-sm text-color-secondary px-2">Вход не выполнен</span>
        )}
      </div>
    </aside>
  );
}
