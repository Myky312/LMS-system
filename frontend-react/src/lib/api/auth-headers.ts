import { getAccessToken } from "@/lib/auth/session";

export function authHeaders(): { Authorization: string } | Record<string, never> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
