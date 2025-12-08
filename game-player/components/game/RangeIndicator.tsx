"use client";

import type { Range } from "@/types/game";

type Props = {
  range: Range;
};

export function RangeIndicator({ range }: Props) {
  return (
    <div className="rounded-lg bg-secondary/50 p-4">
      <p className="text-center text-sm font-medium text-muted-foreground">
        Current Range: <span className="font-bold text-foreground">{range.min}</span> to{" "}
        <span className="font-bold text-foreground">{range.max}</span>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((range.max - range.min) / 10000) * 100}%` }}
        />
      </div>
    </div>
  );
}