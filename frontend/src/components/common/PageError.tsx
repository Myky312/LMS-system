import { Button } from "@/components/ui/button";

type PageErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function PageError({ message = "Something went wrong.", onRetry }: PageErrorProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
