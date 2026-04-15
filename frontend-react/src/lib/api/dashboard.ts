import axios from "axios";
import { API_BASE_URL } from "@/lib/constants/env";
import { authHeaders } from "@/lib/api/auth-headers";

export type DashboardOverview = {
  role: string;
  totalUsers: number | null;
  totalCourses: number;
  totalModules: number;
  totalLessons: number;
  totalSubmissions: number;
  usersTrendPercent: number | null;
  coursesActiveLabel?: string;
  submissionApprovalPercent: number;
};

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await axios.get<DashboardOverview>(
    `${API_BASE_URL}/dashboard/overview`,
    { headers: authHeaders() }
  );
  return data;
}
