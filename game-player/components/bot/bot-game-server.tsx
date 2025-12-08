'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Play, Pause, RotateCcw, Trophy, Zap } from 'lucide-react';
import type { FeedbackType, Range } from '@/lib/types/game';
import type { BotAlgorithmKey } from '@/lib/actions/bot';
import { useBotGame } from '@/lib/use-bot-game';
import { AlgorithmSelection, DEFAULT_ALGORITHM_OPTIONS } from '@/components/bot/algorithm-selection';
import { BotGuessHistory } from '@/components/bot/bot-guess-history';

type Props = {
  initialGameId?: string;
  initialAttempts?: number;
  initialRange?: Range;
  initialHistory?: { guess: number; feedback: FeedbackType }[];
  initialStatus?: 'active' | 'completed';
  initialAlgorithm?: BotAlgorithmKey;
};

export default function BotGameServer({
  initialGameId,
  initialAttempts,
  initialRange,
  initialHistory,
  initialStatus,
  initialAlgorithm,
}: Props) {
  const {
    gameState,
    selectedAlgorithm,
    setSelectedAlgorithm,
    attempts,
    history,
    range,
    startNewGame,
    togglePause,
    resetToSelection,
  } = useBotGame({
    initialGameId,
    initialAttempts,
    initialRange,
    initialHistory,
    initialStatus,
    initialAlgorithm,
  });

  const selectedOption = useMemo(
    () => DEFAULT_ALGORITHM_OPTIONS.find((o) => o.key === selectedAlgorithm) || null,
    [selectedAlgorithm],
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center md:mb-12">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Target className="h-8 w-8 text-accent md:h-10 md:w-10" />
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">Bot Mode</h1>
          </div>
          <p className="text-pretty text-base text-muted-foreground md:text-lg">
            Watch server-driven bots compete to find the number
          </p>
        </div>

        {gameState === 'idle' && !selectedAlgorithm && (
          <div className="space-y-6">
            <AlgorithmSelection
              options={DEFAULT_ALGORITHM_OPTIONS}
              selected={selectedAlgorithm}
              onSelect={(key) => setSelectedAlgorithm(key)}
            />
          </div>
        )}

        {(selectedAlgorithm || gameState !== 'idle') && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Game Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Game Board</span>
                  {gameState !== 'idle' && selectedOption && (
                    <Badge variant="secondary" className="text-sm">
                      {selectedOption.title}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {gameState === 'idle' && selectedOption && `Ready to start with ${selectedOption.title}`}
                  {(gameState === 'playing' || gameState === 'paused') &&
                    `Attempts: ${attempts} | Range: ${range.min} - ${range.max}`}
                  {gameState === 'won' && `Bot found the number in ${attempts} attempts!`}
                  {gameState === 'aborted' && `Bot aborted. Range collapsed or max attempts reached.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {gameState === 'idle' && selectedOption && (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="rounded-full bg-accent/10 p-6">
                      <Zap className="h-16 w-16 text-accent" />
                    </div>
                    <p className="text-center text-lg font-semibold">{selectedOption.title}</p>
                    <p className="max-w-md text-center text-sm text-muted-foreground">{selectedOption.description}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void startNewGame()}
                        size="lg"
                        className="gap-2 bg-accent hover:bg-accent/90"
                      >
                        <Play className="h-4 w-4" />
                        Start Bot
                      </Button>
                    </div>
                  </div>
                )}

                {(gameState === 'playing' || gameState === 'paused') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button onClick={togglePause} variant="outline" size="sm" className="gap-2">
                          {gameState === 'playing' ? (
                            <>
                              <Pause className="h-4 w-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Resume
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">Attempts: {attempts}</div>
                    </div>

                    {/* Range visualization */}
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Range: {range.min}</span>
                        <span>{range.max}</span>
                      </div>
                      <div className="relative h-2 w-full rounded bg-muted">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${((range.max - range.min) / 10000) * 100}%` }}
                        />
                      </div>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Remaining possibilities: {range.max - range.min + 1}
                      </p>
                    </div>
                  </div>
                )}

                {gameState === 'won' && (
                  <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    <div className="rounded-full bg-success/10 p-6">
                      <Trophy className="h-16 w-16 text-success" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-success">Bot Won!</h3>
                      <p className="mt-2 text-muted-foreground">
                        The {selectedOption?.title} algorithm found the number{' '}
                        <span className="font-bold text-foreground">{history[history.length - 1]?.guess ?? '?'}</span>{' '}
                        in <span className="font-bold text-foreground">{attempts}</span> attempts
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void startNewGame()}
                        size="lg"
                        className="gap-2 bg-accent hover:bg-accent/90"
                      >
                        <Play className="h-4 w-4" />
                        Try Again
                      </Button>
                      <Button onClick={resetToSelection} variant="outline" size="lg">
                        <RotateCcw className="h-4 w-4" />
                        Change Algorithm
                      </Button>
                    </div>
                  </div>
                )}

                {gameState === 'aborted' && (
                  <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    <div className="rounded-full bg-destructive/10 p-6">
                      <Trophy className="h-16 w-16 text-destructive" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-destructive">Bot Aborted</h3>
                      <p className="mt-2 text-muted-foreground">Range collapsed or max attempts reached.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={resetToSelection} variant="outline" size="lg">
                        Change Algorithm
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History Sidebar */}
            <BotGuessHistory history={history} />
          </div>
        )}
      </div>
    </div>
  );
}
