import { authApi } from "@/lib/api/axios-client";
import type { CurrentUser } from "@/types/domain";

export type LoginPayload = { email: string; password: string };
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await authApi.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await authApi.post<AuthResponse>("/auth/refresh", { refreshToken });
  return data;
}

export async function logout(): Promise<void> {
  await authApi.post("/auth/logout").catch(() => {});
}

export function authResponseToUser(res: AuthResponse): CurrentUser {
  return {
    userId: res.user.id,
    email: res.user.email,
    role: res.user.role as CurrentUser["role"],
  };
}
