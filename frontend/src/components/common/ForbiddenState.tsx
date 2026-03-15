import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ForbiddenState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Access denied</h2>
      <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
      <Button asChild variant="outline">
        <Link href="/courses">Back to Courses</Link>
      </Button>
    </div>
  );
}
