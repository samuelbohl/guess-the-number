"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { GameState, FeedbackType, Range, GuessHistoryItem } from "@/lib/types/game";
import { startNewGameAction, submitGuessAction } from "@/lib/actions/game";

export function useGuessGame(initialGameId?: string) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>("none");
  const [history, setHistory] = useState<GuessHistoryItem[]>([]);
  const [range, setRange] = useState<Range>({ min: 1, max: 10000 });

  useEffect(() => {
    if (initialGameId && gameState === "idle") {
      setGameId(initialGameId);
      setGameState("playing");
      setAttempts(0);
      setHistory([]);
      setFeedback("none");
      setRange({ min: 1, max: 10000 });
      setGuess("");
    }
  }, [initialGameId, gameState]);

  const startNewGame = async () => {
    await startNewGameAction();
  };

  const submitGuess = async () => {
    if (!guess || !gameId) return;

    const guessNumber = Number.parseInt(guess, 10);
    if (Number.isNaN(guessNumber) || guessNumber < 1 || guessNumber > 10000) return;

    const res = await submitGuessAction(gameId, guessNumber);

    let newFeedback: FeedbackType = "none";
    if (res.result === "correct") {
      newFeedback = "correct";
      setGameState("won");
    } else if (res.result === "low") {
      newFeedback = "higher";
      setRange((prev) => ({ ...prev, min: Math.max(prev.min, guessNumber + 1) }));
    } else if (res.result === "high") {
      newFeedback = "lower";
      setRange((prev) => ({ ...prev, max: Math.min(prev.max, guessNumber - 1) }));
    }

    setFeedback(newFeedback);
    setAttempts(res.attempts);
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