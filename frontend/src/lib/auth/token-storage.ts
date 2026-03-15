/**
 * Token storage. Backend returns tokens in body (no cookies).
 * We keep accessToken in memory and refreshToken in localStorage so we can
 * refresh on 401 without persisting access token to disk.
 */

const ACCESS_TOKEN_KEY = "zeekr_access";
const REFRESH_TOKEN_KEY = "zeekr_refresh";

let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return inMemoryAccessToken ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  inMemoryAccessToken = accessToken;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  inMemoryAccessToken = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
