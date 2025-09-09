// components/ui/badge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline"; // 他にもあれば追加

type BadgeProps = {
  variant?: BadgeVariant;
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "outline"
          ? "border border-gray-300 bg-white text-gray-800"
          : "bg-gray-100 text-gray-800",
        className
      )}
      {...props}
    />
  );
}
