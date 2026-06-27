import * as React from "react";

/** Placeholder animado para estados de carregamento. */
export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-black/8 ${className}`}
      {...props}
    />
  );
}
