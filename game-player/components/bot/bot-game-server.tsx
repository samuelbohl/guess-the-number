"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Play, Pause, RotateCcw, Trophy, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { startAndPlayBotGameAction, type BotAlgorithmKey } from "@/lib/actions/bot";
import type { FeedbackType, Range } from "@/lib/types/game";

const ALGORITHM_OPTIONS: { value: BotAlgorithmKey; label: string; description: string }[] = [
  {
    value: "binary",
    label: "Binary Search",
    description: "Divides the search space in half with each guess. Most efficient algorithm.",
  },
  {
    value: "random",
    label: "Random Search",
    description: "Makes random guesses within the valid range. Unpredictable and inefficient.",
  },
  {
    value: "exponential",
    label: "Exponential Search",
    description: "Grows step until overshoot, then switches to binary within current range.",
  },
  {
    value: "fibonacci",
    label: "Fibonacci / Golden Section",
    description: "Partitions by ~0.618 of interval to shrink efficiently.",
  },
];

type GameState = "idle" | "playing" | "paused" | "won" | "aborted";

export default function BotGameServer() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<BotAlgorithmKey | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState<{ guess: number; feedback: FeedbackType }[]>([]);
  const [range, setRange] = useState<Range>({ min: 1, max: 10000 });
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackType | null>(null);

  const selectedOption = useMemo(
    () => ALGORITHM_OPTIONS.find((o) => o.value === selectedAlgorithm) || null,
    [selectedAlgorithm]
  );


  const startNewGame = async () => {
    if (!selectedAlgorithm) return;

    setGameState("playing");
    setAttempts(0);
    setHistory([]);
    setRange({ min: 1, max: 10000 });
    setCurrentFeedback(null);

    // create host game and play using selected strategy
    const res = await startAndPlayBotGameAction(selectedAlgorithm);
    setAttempts(res.attempts);

    const immediateHistory = res.history.map((rec) => ({
      guess: rec.guess,
      feedback: rec.result as FeedbackType,
    }));
    setHistory(immediateHistory);

    let newRange: Range = { min: 1, max: 10000 };
    for (const rec of res.history) {
      if (rec.result === "low") {
        newRange = { ...newRange, min: Math.max(newRange.min, rec.guess + 1) };
      } else if (rec.result === "high") {
        newRange = { ...newRange, max: Math.min(newRange.max, rec.guess - 1) };
      } else if (rec.result === "correct") {
        newRange = { min: rec.guess, max: rec.guess };
      }
    }
    setRange(newRange);

    const last = res.history[res.history.length - 1];
    setCurrentFeedback(last ? (last.result as FeedbackType) : null);

    setGameState(
      res.status === "aborted"
        ? "aborted"
        : last && last.result === "correct"
        ? "won"
        : "playing"
    );
  };

  const togglePause = () => {
    if (gameState === "playing") {
      setGameState("paused");
    } else if (gameState === "paused") {
      setGameState("playing");
    }
  };

  const resetToSelection = () => {
    setGameState("idle");
    setSelectedAlgorithm(null);
    setAttempts(0);
    setHistory([]);
    setRange({ min: 1, max: 10000 });
    setCurrentFeedback(null);
  };

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

        {gameState === "idle" && !selectedAlgorithm && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Algorithm</CardTitle>
                <CardDescription>Select which search strategy the bot should use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {ALGORITHM_OPTIONS.map((option) => (
                    <Card
                      key={option.value}
                      className="cursor-pointer transition-all hover:scale-105 hover:border-accent hover:shadow-lg"
                      onClick={() => setSelectedAlgorithm(option.value)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{option.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(selectedAlgorithm || gameState !== "idle") && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Game Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Game Board</span>
                  {gameState !== "idle" && selectedOption && (
                    <Badge variant="secondary" className="text-sm">
                      {selectedOption.label}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {gameState === "idle" && selectedOption && `Ready to start with ${selectedOption.label}`}
                  {(gameState === "playing" || gameState === "paused") &&
                    `Attempts: ${attempts} | Range: ${range.min} - ${range.max}`}
                  {gameState === "won" && `Bot found the number in ${attempts} attempts!`}
                  {gameState === "aborted" && `Bot aborted. Range collapsed or max attempts reached.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {gameState === "idle" && selectedOption && (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="rounded-full bg-accent/10 p-6">
                      <Zap className="h-16 w-16 text-accent" />
                    </div>
                    <p className="text-center text-lg font-semibold">{selectedOption.label}</p>
                    <p className="max-w-md text-center text-sm text-muted-foreground">{selectedOption.description}</p>
                    <div className="flex gap-2">
                      <Button onClick={() => void startNewGame()} size="lg" className="gap-2 bg-accent hover:bg-accent/90">
                        <Play className="h-4 w-4" />
                        Start Bot
                      </Button>
                      <Button onClick={resetToSelection} variant="outline" size="lg">
                        Change Algorithm
                      </Button>
                    </div>
                  </div>
                )}

                {(gameState === "playing" || gameState === "paused") && (
                  <div className="space-y-4">
                    {/* Controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button onClick={togglePause} variant="outline" className="gap-2">
                        {gameState === "playing" ? (
                          <>
                            <Pause className="h-4 w-4" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" /> Resume
                          </>
                        )}
                      </Button>
                      <Button onClick={resetToSelection} variant="outline" className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Reset
                      </Button>
                    </div>

                    {/* Current feedback */}
                    <div className="flex items-center justify-center gap-4 py-4">
                      {currentFeedback === "low" && (
                        <div className="flex flex-col items-center gap-2">
                          <TrendingUp className="h-12 w-12 text-accent" />
                          <p className="text-xl font-semibold text-accent">Go Higher!</p>
                          <p className="text-sm text-muted-foreground">The number is larger than the guess</p>
                        </div>
                      )}
                      {currentFeedback === "high" && (
                        <div className="flex flex-col items-center gap-2">
                          <TrendingDown className="h-12 w-12 text-destructive" />
                          <p className="text-xl font-semibold text-destructive">Go Lower!</p>
                          <p className="text-sm text-muted-foreground">The number is smaller than the guess</p>
                        </div>
                      )}
                      {!currentFeedback && (
                        <Badge variant="secondary" className="text-sm">WAITING</Badge>
                      )}
                    </div>

                    {/* Range progress bar */}
                    <div>
                      <div className="h-2 w-full rounded bg-secondary">
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

                {gameState === "won" && (
                  <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    <div className="rounded-full bg-success/10 p-6">
                      <Trophy className="h-16 w-16 text-success" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-success">Bot Won!</h3>
                      <p className="mt-2 text-muted-foreground">
                        The {selectedOption?.label} algorithm found the number{" "}
                        <span className="font-bold text-foreground">{history[history.length - 1]?.guess ?? "?"}</span>{" "}
                        in <span className="font-bold text-foreground">{attempts}</span> attempts
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => void startNewGame()} size="lg" className="gap-2 bg-accent hover:bg-accent/90">
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

                {gameState === "aborted" && (
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
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Guess History</CardTitle>
                <CardDescription>Bot's attempts</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">No guesses yet</p>
                ) : (
                  <div className="max-h-[500px] space-y-2 overflow-y-auto">
                    {history
                      .slice()
                      .reverse()
                      .map((item, index) => (
                        <div key={index} className="flex items-center justify-between rounded border p-2">
                          <span className="flex items-center gap-2 text-sm">
                            {item.feedback === "low" && <TrendingUp className="h-4 w-4 text-accent" />}
                            {item.feedback === "high" && <TrendingDown className="h-4 w-4 text-destructive" />}
                            Guess: {item.guess}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {item.feedback}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}