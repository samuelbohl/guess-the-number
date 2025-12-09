'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startAndPlayBotGameAction, type BotAlgorithmKey } from '@/lib/actions/bot';
import type { FeedbackType, Range } from '@/lib/types/game';

export type BotInitialState = {
  initialGameId?: string;
  initialAttempts?: number;
  initialRange?: Range;
  initialHistory?: { guess: number; feedback: FeedbackType }[];
  initialStatus?: 'active' | 'completed';
  initialAlgorithm?: BotAlgorithmKey;
};

export type BotGameState = 'idle' | 'playing' | 'paused' | 'won' | 'aborted';

export function useBotGame(initial?: BotInitialState) {
  const router = useRouter();

  const [gameState, setGameState] = useState<BotGameState>('idle');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<BotAlgorithmKey | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState<{ guess: number; feedback: FeedbackType }[]>([]);
  const [range, setRange] = useState<Range>({ min: 1, max: 10000 });

  useEffect(() => {
    if (initial?.initialGameId && gameState === 'idle') {
      if (initial?.initialAlgorithm) {
        setSelectedAlgorithm(initial.initialAlgorithm);
      }
      const loadedAttempts = initial?.initialAttempts ?? 0;
      const loadedHistory = initial?.initialHistory ?? [];
      const loadedRange = initial?.initialRange ?? { min: 1, max: 10000 };
      const last = loadedHistory.length > 0 ? loadedHistory[loadedHistory.length - 1] : null;
      const lastFeedback: FeedbackType | null = last ? last.feedback : null;
      const completed = initial?.initialStatus === 'completed' || lastFeedback === 'correct';

      setAttempts(loadedAttempts);
      setHistory(loadedHistory);
      setRange(loadedRange);

      setGameState(completed ? 'won' : 'aborted');
    }
  }, [initial, gameState]);

  const startNewGame = async () => {
    if (!selectedAlgorithm) return;

    setGameState('playing');
    setAttempts(0);
    setHistory([]);
    setRange({ min: 1, max: 10000 });

    const res = await startAndPlayBotGameAction(selectedAlgorithm);
    router.push(`/bot/${res.hostGameId}`);
  };

  const resetToSelection = () => {
    router.push('/bot');
  };

  return {
    gameState,
    selectedAlgorithm,
    setSelectedAlgorithm,
    attempts,
    history,
    range,
    startNewGame,
    resetToSelection,
  };
}
