"use client";

import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw } from "lucide-react";

type Props = {
  attempts: number;
  onRestart: () => void;
};

export function GameWon({ attempts, onRestart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="rounded-full bg-success/10 p-6">
        <Trophy className="h-16 w-16 text-success" />
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-success">You Won!</h3>
        <p className="mt-2 text-muted-foreground">
          You guessed the number correctly in <span className="font-bold text-foreground">{attempts}</span> attempts
        </p>
      </div>
      <Button onClick={onRestart} size="lg" className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Play Again
      </Button>
    </div>
  );
}