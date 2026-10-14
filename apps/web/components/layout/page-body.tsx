import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

export function PageBody({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", className)}>{children}</div>
  );
}
