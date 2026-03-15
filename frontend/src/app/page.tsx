import { redirect } from "next/navigation";

export default function HomePage() {
  // If unauthenticated, login; if authenticated admin/teacher, go to courses
  redirect("/login");
}
