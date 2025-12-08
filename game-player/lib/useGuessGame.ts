"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { GameState, FeedbackType, Range, GuessHistoryItem } from "@/types/game";
import { startNewGame as startGameService } from "@/lib/gameService";

export function useGuessGame(initialGameId?: string) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>("none");
  const [history, setHistory] = useState<GuessHistoryItem[]>([]);
  const [range, setRange] = useState<Range>({ min: 1, max: 10000 });
  const [targetNumber, setTargetNumber] = useState<number | null>(null);

  useEffect(() => {
    if (initialGameId && gameState === "idle") {
      setGameId(initialGameId);
      setGameState("playing");
      setAttempts(0);
      setHistory([]);
      setFeedback("none");
      setRange({ min: 1, max: 10000 });
      setGuess("");
      setTargetNumber(7342);
    }
  }, [initialGameId]);

  const startNewGame = async () => {
    const { gameId: id, range: initialRange } = await startGameService();
    setGameId(id);
    setGameState("playing");
    setAttempts(0);
    setHistory([]);
    setFeedback("none");
    setRange(initialRange);
    setGuess("");
    // Temporary: simulate target until server integration
    setTargetNumber(7342);
  };

  const submitGuess = async () => {
    if (!guess || !gameId) return;

    const guessNumber = Number.parseInt(guess, 10);
    if (Number.isNaN(guessNumber) || guessNumber < 1 || guessNumber > 10000) return;

    const target = targetNumber ?? 7342;
    let newFeedback: FeedbackType = "none";

    if (guessNumber === target) {
      newFeedback = "correct";
      setGameState("won");
    } else if (guessNumber < target) {
      newFeedback = "higher";
      setRange((prev) => ({ ...prev, min: Math.max(prev.min, guessNumber + 1) }));
    } else {
      newFeedback = "lower";
      setRange((prev) => ({ ...prev, max: Math.min(prev.max, guessNumber - 1) }));
    }

    setFeedback(newFeedback);
    setAttempts((prev) => prev + 1);
    setHistory((prev) => [...prev, { guess: guessNumber, feedback: newFeedback }]);
    setGuess("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void submitGuess();
    }
  };

  return {
    gameState,
    gameId,
    guess,
    setGuess,
    attempts,
    feedback,
    history,
    range,
    startNewGame,
    submitGuess,
    handleKeyPress,
  };
}