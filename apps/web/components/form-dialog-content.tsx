"use client";

import { DialogContent } from "@repo/ui/components/dialog";
import { cn } from "@repo/ui/lib/utils";
import type { ComponentProps } from "react";

const sizeClassNames = {
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

export type FormDialogSize = keyof typeof sizeClassNames;

export function FormDialogContent({
  size = "lg",
  className,
  ...props
}: ComponentProps<typeof DialogContent> & { size?: FormDialogSize }) {
  return (
    <DialogContent
      className={cn(
        "max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden",
        sizeClassNames[size],
        className,
      )}
      {...props}
    />
  );
}
