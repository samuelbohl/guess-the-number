"use client";

import type React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  guess: string;
  onGuessChange: (value: string) => void;
  onSubmit: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export function GuessControls({ guess, onGuessChange, onSubmit, onKeyPress }: Props) {
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        placeholder="Enter your guess (1-10000)"
        value={guess}
        onChange={(e) => onGuessChange(e.target.value)}
        onKeyPress={onKeyPress}
        min={1}
        max={10000}
        className="text-lg"
      />
      <Button onClick={onSubmit} size="lg" className="gap-2 bg-accent hover:bg-accent/90">
        Submit
      </Button>
    </div>
  );
}