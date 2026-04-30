"use client";

import { cn } from "@/lib/utils";

export function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-500">{label}</span>
      <span
        className={cn(
          "font-medium text-ink-800 truncate",
          highlight && "text-brand-700"
        )}
      >
        {value}
      </span>
    </div>
  );
}
