"use client";

import { EmptyState } from "@/components/common/EmptyState";

export default function SubmissionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Submissions</h1>
      <EmptyState
        title="Submissions list"
        description="Sprint 4: submissions list and review will be implemented here."
      />
    </div>
  );
}
