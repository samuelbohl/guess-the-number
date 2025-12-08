"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

type Props = {
  initialGameId?: string;
  initialAttempts?: number;
  initialRange?: Range;
  initialHistory?: { guess: number; feedback: FeedbackType }[];
  initialStatus?: "active" | "completed";
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
  const router = useRouter();
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

  // Hydrate from server-provided initial state (bot/[id] route)
  useEffect(() => {
    if (initialGameId && gameState === "idle") {
      if (initialAlgorithm) {
        setSelectedAlgorithm(initialAlgorithm);
      }
      const loadedAttempts = initialAttempts ?? 0;
      const loadedHistory = initialHistory ?? [];
      const loadedRange = initialRange ?? { min: 1, max: 10000 };
      const last = loadedHistory.length > 0 ? loadedHistory[loadedHistory.length - 1] : null;
      const lastFeedback: FeedbackType | null = last ? last.feedback : null;
      const completed = (initialStatus === "completed") || lastFeedback === "correct";

      setAttempts(loadedAttempts);
      setHistory(loadedHistory);
      setCurrentFeedback(lastFeedback);
      setRange(loadedRange);

      setGameState(completed ? "won" : "aborted");
    }
  }, [initialGameId, initialAttempts, initialRange, initialHistory, initialStatus, initialAlgorithm, gameState]);

  const startNewGame = async () => {
    if (!selectedAlgorithm) return;

    setGameState("playing");
    setAttempts(0);
    setHistory([]);
    setRange({ min: 1, max: 10000 });
    setCurrentFeedback(null);

    const res = await startAndPlayBotGameAction(selectedAlgorithm);
    // Navigate to bot/ID where state is preloaded
    router.push(`/bot/${res.hostGameId}`);
  };

  const togglePause = () => {
    if (gameState === "playing") {
      setGameState("paused");
    } else if (gameState === "paused") {
      setGameState("playing");
    }
  };

  const resetToSelection = () => {
    router.push("/bot");
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button onClick={togglePause} variant="outline" size="sm" className="gap-2">
                          {gameState === "playing" ? (
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
                      <div className="text-sm text-muted-foreground">
                        Attempts: {attempts}
                      </div>
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
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {history.length - index}
                            </span>
                            <span className="font-mono text-lg font-semibold">{item.guess}</span>
                          </div>
                          {item.feedback === "low" && <TrendingUp className="h-5 w-5 text-accent" />}
                          {item.feedback === "high" && <TrendingDown className="h-5 w-5 text-destructive" />}
                          {item.feedback === "correct" && <Trophy className="h-5 w-5 text-success" />}
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