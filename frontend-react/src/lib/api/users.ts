import axios from "axios";
import { API_BASE_URL } from "@/lib/constants/env";
import { authHeaders } from "@/lib/api/auth-headers";

export type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export type UsersListResponse = {
  items: UserRow[];
  total: number;
  page: number;
  limit: number;
};

export type UsersStatsResponse = {
  total: number;
  teachers: number;
  students: number;
  admins: number;
  newThisMonth: number;
};

export async function fetchUsersStats(): Promise<UsersStatsResponse> {
  const { data } = await axios.get<UsersStatsResponse>(`${API_BASE_URL}/users/stats`, {
    headers: authHeaders(),
  });
  return data;
}

export async function fetchUsersList(params: {
  page: number;
  limit: number;
  q?: string;
  role?: string;
}): Promise<UsersListResponse> {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit));
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.role && params.role !== "ALL") search.set("role", params.role);

  const { data } = await axios.get<UsersListResponse>(
    `${API_BASE_URL}/users?${search.toString()}`,
    { headers: authHeaders() }
  );
  return data;
}

export async function createUser(body: {
  email: string;
  password: string;
  role: string;
}): Promise<UserRow> {
  const { data } = await axios.post<UserRow>(`${API_BASE_URL}/users`, body, {
    headers: authHeaders(),
  });
  return data;
}
