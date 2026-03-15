import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotFoundState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Not found</h2>
      <p className="text-muted-foreground">The resource you’re looking for doesn’t exist.</p>
      <Button asChild variant="outline">
        <Link href="/courses">Back to Courses</Link>
      </Button>
    </div>
  );
}
