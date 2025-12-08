"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { FeedbackType } from "@/types/game";

type Props = {
  feedback: FeedbackType;
};

export function FeedbackPanel({ feedback }: Props) {
  if (feedback === "none") return null;

  return (
    <div className="rounded-lg border-2 p-6 text-center">
      {feedback === "higher" && (
        <div className="flex flex-col items-center gap-2">
          <TrendingUp className="h-12 w-12 text-accent" />
          <p className="text-xl font-semibold text-accent">Go Higher!</p>
          <p className="text-sm text-muted-foreground">The number is larger than your guess</p>
        </div>
      )}
      {feedback === "lower" && (
        <div className="flex flex-col items-center gap-2">
          <TrendingDown className="h-12 w-12 text-destructive" />
          <p className="text-xl font-semibold text-destructive">Go Lower!</p>
          <p className="text-sm text-muted-foreground">The number is smaller than your guess</p>
        </div>
      )}
    </div>
  );
}