'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import type { FeedbackType } from '@/lib/types/game';

type HistoryItem = { guess: number; feedback: FeedbackType };

type Props = {
  history: HistoryItem[];
};

export function BotGuessHistory({ history }: Props) {
  return (
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
                  {item.feedback === 'low' && <TrendingUp className="h-5 w-5 text-accent" />}
                  {item.feedback === 'high' && <TrendingDown className="h-5 w-5 text-destructive" />}
                  {item.feedback === 'correct' && <Trophy className="h-5 w-5 text-success" />}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
