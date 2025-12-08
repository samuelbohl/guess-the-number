"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target } from "lucide-react"
import { useGuessGame } from "@/lib/useGuessGame"
import { GuessControls } from "@/components/game/GuessControls"
import { FeedbackPanel } from "@/components/game/FeedbackPanel"
import { RangeIndicator } from "@/components/game/RangeIndicator"
import { GuessHistory } from "@/components/game/GuessHistory"
import { GameWon } from "@/components/game/GameWon"
import { startNewGameAction } from "@/lib/actions/game"
import type { Range, GuessHistoryItem } from "@/lib/types/game"

type Props = {
  initialGameId?: string
  initialAttempts?: number
  initialRange?: Range
  initialHistory?: GuessHistoryItem[]
  initialStatus?: "active" | "completed"
}

export default function GuessTheNumberGame({ initialGameId, initialAttempts, initialRange, initialHistory, initialStatus }: Props) {
  const {
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
  } = useGuessGame(initialGameId, {
    attempts: initialAttempts,
    range: initialRange,
    history: initialHistory,
    status: initialStatus,
  })

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center md:mb-12">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Target className="h-8 w-8 text-primary md:h-10 md:w-10" />
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Guess the Number
            </h1>
          </div>
          <p className="text-pretty text-base text-muted-foreground md:text-lg">
            Think of a number between 1 and 10,000. Can you guess it in the fewest attempts?
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Game Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Game Board</span>
                {gameState === "playing" && (
                  <Badge variant="secondary" className="text-sm">
                    Game ID: {gameId?.slice(-8)}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {gameState === "idle" && "Start a new game to begin guessing"}
                {gameState === "playing" && `Attempts: ${attempts} | Range: ${range.min} - ${range.max}`}
                {gameState === "won" && `Congratulations! You won in ${attempts} attempts!`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {gameState === "idle" && (
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                  <div className="rounded-full bg-primary/10 p-6">
                    <Target className="h-16 w-16 text-primary" />
                  </div>
                  <form action={startNewGameAction}>
                    <Button type="submit" size="lg" className="gap-2">
                      Start New Game
                    </Button>
                  </form>
                </div>
              )}

              {gameState === "playing" && (
                <div className="space-y-4">
                  <GuessControls
                    guess={guess}
                    onGuessChange={setGuess}
                    onSubmit={submitGuess}
                    onKeyPress={handleKeyPress}
                  />
                  <FeedbackPanel feedback={feedback} />
                  <RangeIndicator range={range} />
                </div>
              )}

              {gameState === "won" && <GameWon attempts={attempts} onRestart={startNewGame} />}
            </CardContent>
          </Card>

          {/* History Sidebar */}
          <GuessHistory history={history} />
        </div>
      </div>
    </div>
  )
}
