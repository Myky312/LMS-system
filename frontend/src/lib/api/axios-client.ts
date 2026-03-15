import axios, { type AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/constants/env";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth/token-storage";
import type { AppError } from "@/types/domain";

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Refresh in progress to avoid multiple simultaneous refresh calls
let refreshPromise: Promise<unknown> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  // Use plain axios so we don't attach expired Bearer
  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

authApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

authApi.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !(original as { _retry?: boolean })._retry) {
      (original as { _retry?: boolean })._retry = true;
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return authApi(original);
      }
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(err);
    }
    return Promise.reject(err);
  }
);

export { authApi };

/** Normalize backend error to AppError */
export function normalizeError(err: unknown): AppError {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as Record<string, unknown>;
    return {
      statusCode: err.response.status,
      message: (d.message as string) ?? "Request failed",
      errors: d.errors,
    };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: "Unknown error" };
}
