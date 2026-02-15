/**
 * Typed API response bodies for E2E tests (supertest response.body).
 */
export interface ApiResourceId {
  id: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { email: string };
}

export interface SubmissionResponse {
  id: string;
  status: string;
}

export interface CourseListItem {
  id: string;
}
