import axios from "axios";
import { API_BASE_URL } from "@/lib/constants/env";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
};

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
    email,
    password,
  });
  return data;
}
