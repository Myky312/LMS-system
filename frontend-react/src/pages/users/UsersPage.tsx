import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Paginator, type PaginatorPageChangeEvent } from "primereact/paginator";
import { Password } from "primereact/password";
import { Tag } from "primereact/tag";
import {
  createUser,
  fetchUsersList,
  fetchUsersStats,
  type UserRow,
  type UsersStatsResponse,
} from "@/lib/api/users";
const PAGE_SIZE = 10;

const ROLE_FILTER = [
  { label: "Все роли", value: "ALL" },
  { label: "Администратор", value: "ADMIN" },
  { label: "Преподаватель", value: "TEACHER" },
  { label: "Студент", value: "STUDENT" },
];

const ROLE_CREATE = [
  { label: "Студент", value: "STUDENT" },
  { label: "Преподаватель", value: "TEACHER" },
  { label: "Администратор", value: "ADMIN" },
];

function userInitials(email: string): string {
  const part = email.split("@")[0] ?? email;
  const segs = part.split(/[._-]/).filter(Boolean);
  if (segs.length >= 2) {
    return (segs[0]![0]! + segs[1]![0]!).toUpperCase();
  }
  if (part.length >= 2) return part.slice(0, 2).toUpperCase();
  return (part[0] ?? "?").toUpperCase();
}

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

function formatRegDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function roleBadgeLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "АДМИН";
    case "TEACHER":
      return "УЧИТЕЛЬ";
    case "STUDENT":
      return "СТУДЕНТ";
    default:
      return role;
  }
}

function roleTagSeverity(role: string): "success" | "info" | "secondary" | "contrast" {
  switch (role) {
    case "ADMIN":
      return "info";
    case "TEACHER":
      return "success";
    default:
      return "secondary";
  }
}

function formatAxiosError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
    const m = (err.response.data as { message?: unknown }).message;
    if (typeof m === "string") return m;
    if (Array.isArray(m)) return m.map(String).join(", ");
  }
  return "Не удалось выполнить операцию.";
}

export function UsersPage() {
  const [stats, setStats] = useState<UsersStatsResponse | null>(null);
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("STUDENT");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await fetchUsersStats();
      setStats(s);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsersList({
        page,
        limit: PAGE_SIZE,
        q: qDebounced || undefined,
        role: roleFilter,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(formatAxiosError(err));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, qDebounced, roleFilter]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const firstIndex = useMemo(() => (page - 1) * PAGE_SIZE, [page]);

  const onPageChange = (e: PaginatorPageChangeEvent) => {
    setPage(Math.floor(e.first / e.rows) + 1);
  };

  const onCreateSubmit = async () => {
    setCreateError(null);
    if (!newEmail.trim() || newPassword.length < 6) {
      setCreateError("Укажите email и пароль не короче 6 символов.");
      return;
    }
    setCreateSubmitting(true);
    try {
      await createUser({
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("STUDENT");
      await loadStats();
      await loadList();
    } catch (err: unknown) {
      setCreateError(formatAxiosError(err));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const from = total === 0 ? 0 : firstIndex + 1;
  const to = Math.min(firstIndex + items.length, total);

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="flex align-items-start justify-content-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="text-3xl m-0">Пользователи</h1>
          <p className="text-color-secondary mt-2 mb-0" style={{ maxWidth: 520 }}>
            Управление доступом и ролями участников академии
          </p>
        </div>
        <Button
          label="Создать пользователя"
          icon="pi pi-plus"
          type="button"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
        />
      </div>

      <div className="grid mb-4">
        <div className="col-12 sm:6 lg:3">
          <Card className="h-full shadow-1">
            <div className="text-xs text-color-secondary uppercase mb-1">Всего</div>
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--primary-color)" }}
            >
              {statsLoading ? "…" : stats != null ? stats.total.toLocaleString("ru-RU") : "—"}
            </div>
          </Card>
        </div>
        <div className="col-12 sm:6 lg:3">
          <Card className="h-full shadow-1">
            <div className="text-xs text-color-secondary uppercase mb-1">Учителя</div>
            <div className="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
              {statsLoading ? "…" : stats?.teachers ?? "—"}
            </div>
          </Card>
        </div>
        <div className="col-12 sm:6 lg:3">
          <Card className="h-full shadow-1">
            <div className="text-xs text-color-secondary uppercase mb-1">Студенты</div>
            <div className="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
              {statsLoading ? "…" : stats?.students ?? "—"}
            </div>
          </Card>
        </div>
        <div className="col-12 sm:6 lg:3">
          <Card className="h-full shadow-1">
            <div className="text-xs text-color-secondary uppercase mb-1">Новые (мес.)</div>
            <div className="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
              {statsLoading ? "…" : stats?.newThisMonth != null ? `+${stats.newThisMonth}` : "—"}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mb-4 shadow-1">
        <div className="flex flex-column md:flex-row gap-3 align-items-stretch md:align-items-end flex-wrap">
          <div className="flex-1 min-w-0">
            <label htmlFor="user-search" className="text-xs text-color-secondary block mb-2">
              Поиск
            </label>
            <div className="flex align-items-center gap-2 w-full">
              <i className="pi pi-search text-color-secondary" aria-hidden />
              <InputText
                id="user-search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Поиск по email…"
                className="w-full"
              />
            </div>
          </div>
          <div style={{ minWidth: "12rem" }}>
            <label htmlFor="role-filter" className="text-xs text-color-secondary block mb-2">
              Роль
            </label>
            <Dropdown
              inputId="role-filter"
              value={roleFilter}
              options={ROLE_FILTER}
              onChange={(e) => {
                setRoleFilter(e.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>
          <div className="flex align-items-end">
            <Button type="button" icon="pi pi-filter" outlined aria-label="Фильтры" disabled />
          </div>
        </div>
      </Card>

      {error && (
        <Message severity="error" text={error} className="w-full mb-3" />
      )}

      <Card className="shadow-1 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="p-datatable-table w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="surface-100 text-left">
                <th className="p-3 text-xs uppercase text-color-secondary border-bottom-1 surface-border">
                  Пользователь
                </th>
                <th className="p-3 text-xs uppercase text-color-secondary border-bottom-1 surface-border">
                  Email
                </th>
                <th className="p-3 text-xs uppercase text-color-secondary border-bottom-1 surface-border">
                  Роль
                </th>
                <th className="p-3 text-xs uppercase text-color-secondary border-bottom-1 surface-border">
                  Дата регистрации
                </th>
                <th className="p-3 text-xs uppercase text-color-secondary border-bottom-1 surface-border w-6rem">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-color-secondary">
                    Загрузка…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-color-secondary">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-bottom-1 surface-border">
                    <td className="p-3">
                      <div className="flex align-items-center gap-2">
                        <Avatar label={userInitials(row.email)} shape="circle" size="normal" />
                        <span className="font-medium">{displayNameFromEmail(row.email)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-color-secondary">{row.email}</td>
                    <td className="p-3">
                      <Tag
                        value={roleBadgeLabel(row.role)}
                        severity={roleTagSeverity(row.role)}
                      />
                    </td>
                    <td className="p-3">{formatRegDate(row.createdAt)}</td>
                    <td className="p-3 text-color-secondary text-sm">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 && (
          <div className="flex flex-column sm:flex-row align-items-center justify-content-between gap-3 p-3 border-top-1 surface-border">
            <span className="text-sm text-color-secondary">
              Показано {from}–{to} из {total.toLocaleString("ru-RU")} пользователей
            </span>
            <Paginator
              first={firstIndex}
              rows={PAGE_SIZE}
              totalRecords={total}
              onPageChange={onPageChange}
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            />
          </div>
        )}
      </Card>

      <Dialog
        header="Новый пользователь"
        visible={createOpen}
        style={{ width: "min(100vw - 2rem, 28rem)" }}
        onHide={() => !createSubmitting && setCreateOpen(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              type="button"
              label="Отмена"
              severity="secondary"
              outlined
              disabled={createSubmitting}
              onClick={() => setCreateOpen(false)}
            />
            <Button
              type="button"
              label="Создать"
              loading={createSubmitting}
              onClick={() => void onCreateSubmit()}
            />
          </div>
        }
      >
        {createError && <Message severity="error" text={createError} className="w-full mb-3" />}
        <div className="flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="new-email">Email</label>
            <InputText
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="new-pass">Пароль</label>
            <Password
              inputId="new-pass"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full"
              inputClassName="w-full"
              toggleMask
              feedback={false}
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="new-role">Роль</label>
            <Dropdown
              inputId="new-role"
              value={newRole}
              options={ROLE_CREATE}
              onChange={(e) => setNewRole(e.value)}
              className="w-full"
            />
          </div>
        </div>
      </Dialog>
    </main>
  );
}
