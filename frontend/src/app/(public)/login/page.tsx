"use client";

import { useEffect } from "react";
import { useSession, canAccessPanel } from "@/features/session/session-context";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  const { user, isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && canAccessPanel(user.role)) {
      window.location.href = "/courses";
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && user && canAccessPanel(user.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <LoginForm />
    </div>
  );
}
