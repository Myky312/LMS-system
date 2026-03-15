"use client";

import { useEffect } from "react";
import { useSession, canAccessPanel } from "@/features/session/session-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageLoader } from "@/components/common/PageLoader";
import { ForbiddenState } from "@/components/common/ForbiddenState";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (user && !canAccessPanel(user.role)) {
      // Student — no access to this panel
      return;
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;
  if (user && !canAccessPanel(user.role)) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
