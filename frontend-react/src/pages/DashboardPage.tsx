import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { fetchDashboardOverview, type DashboardOverview } from "@/lib/api/dashboard";
import { getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";

function formatInt(n: number): string {
  return n.toLocaleString("ru-RU");
}

type MetricCardProps = {
  icon: string;
  label: string;
  value: number;
  badge?: string;
};

function MetricCard({ icon, label, value, badge }: MetricCardProps) {
  return (
    <div
      className="surface-card border-round-xl p-4 h-full shadow-2"
      style={{
        border: "1px solid var(--surface-border)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="flex justify-content-between align-items-start mb-3">
        <div
          className="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
          style={{
            width: "3rem",
            height: "3rem",
            background: "color-mix(in srgb, var(--primary-color) 14%, transparent)",
          }}
        >
          <i
            className={`pi ${icon} text-xl`}
            style={{ color: "var(--primary-color)" }}
            aria-hidden
          />
        </div>
        {badge ? (
          <span
            className="text-sm font-semibold white-space-nowrap"
            style={{ color: "var(--primary-color)" }}
          >
            {badge}
          </span>
        ) : (
          <span />
        )}
      </div>
      <div
        className="text-xs text-color-secondary mb-2 line-height-3"
        style={{ letterSpacing: "0.04em" }}
      >
        {label}
      </div>
      <div className="text-3xl font-bold m-0" style={{ color: "var(--text-color)" }}>
        {formatInt(value)}
      </div>
    </div>
  );
}

function formatTrendBadge(pct: number | null): string | undefined {
  if (pct === null || Number.isNaN(pct)) return undefined;
  if (pct === 0) return "0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const canAddCourse = isTeacherOrAdmin(user);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDashboardOverview()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить обзор. Проверьте соединение с сервером.");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const role = data?.role ?? user?.role;

  const adminCards =
    data && role === "ADMIN"
      ? [
          {
            icon: "pi-users",
            label: "ВСЕГО ПОЛЬЗОВАТЕЛЕЙ",
            value: data.totalUsers ?? 0,
            badge: formatTrendBadge(data.usersTrendPercent),
          },
          {
            icon: "pi-book",
            label: "КУРСОВ",
            value: data.totalCourses,
            badge: data.coursesActiveLabel,
          },
          {
            icon: "pi-th-large",
            label: "МОДУЛЕЙ",
            value: data.totalModules,
            badge: undefined,
          },
          {
            icon: "pi-check-square",
            label: "СДАННЫХ РАБОТ",
            value: data.totalSubmissions,
            badge:
              data.totalSubmissions > 0 ? `${data.submissionApprovalPercent}%` : undefined,
          },
        ]
      : null;

  const teacherCards =
    data && role === "TEACHER"
      ? [
          {
            icon: "pi-book",
            label: "МОИХ КУРСОВ",
            value: data.totalCourses,
            badge: data.coursesActiveLabel,
          },
          {
            icon: "pi-th-large",
            label: "МОДУЛЕЙ",
            value: data.totalModules,
            badge: undefined,
          },
          {
            icon: "pi-list",
            label: "УРОКОВ",
            value: data.totalLessons,
            badge: undefined,
          },
          {
            icon: "pi-check-square",
            label: "СДАННЫХ РАБОТ",
            value: data.totalSubmissions,
            badge:
              data.totalSubmissions > 0 ? `${data.submissionApprovalPercent}%` : undefined,
          },
        ]
      : null;

  const studentCards =
    data && role === "STUDENT"
      ? [
          {
            icon: "pi-book",
            label: "КУРСОВ В КАТАЛОГЕ",
            value: data.totalCourses,
            badge: data.coursesActiveLabel,
          },
          {
            icon: "pi-th-large",
            label: "МОДУЛЕЙ",
            value: data.totalModules,
            badge: undefined,
          },
          {
            icon: "pi-list",
            label: "УРОКОВ",
            value: data.totalLessons,
            badge: undefined,
          },
          {
            icon: "pi-check-square",
            label: "МОИХ ОТПРАВОК",
            value: data.totalSubmissions,
            badge:
              data.totalSubmissions > 0 ? `${data.submissionApprovalPercent}%` : undefined,
          },
        ]
      : null;

  const cards = adminCards ?? teacherCards ?? studentCards;

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="flex flex-column lg:flex-row lg:align-items-start justify-content-between gap-4 mb-5">
        <div>
          <h1 className="text-4xl font-bold m-0 mb-2" style={{ color: "var(--text-color)" }}>
            Обзор академии
          </h1>
          <p className="text-lg m-0 text-color-secondary" style={{ maxWidth: "36rem" }}>
            Добро пожаловать в центр управления обучением ZikrAcademy.
          </p>
        </div>
        {canAddCourse && (
          <Button
            type="button"
            label="Добавить курс"
            className="font-bold uppercase white-space-nowrap align-self-start"
            style={{
              background: "var(--primary-color)",
              borderColor: "var(--primary-color)",
              paddingLeft: "1.25rem",
              paddingRight: "1.25rem",
            }}
            onClick={() => navigate("/courses/new")}
          />
        )}
      </div>

      {error && <Message severity="error" text={error} className="w-full mb-4" />}

      {loading && (
        <div className="flex justify-content-center py-6">
          <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
        </div>
      )}

      {!loading && cards && (
        <div className="grid">
          {cards.map((c) => (
            <div key={c.label} className="col-12 sm:6 lg:3">
              <MetricCard {...c} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
