'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import type { GuessHistoryItem } from '@/lib/types/game';

type Props = {
  history: GuessHistoryItem[];
};

export function GuessHistory({ history }: Props) {
  return (
    <Card className="lg:col-span-1 max-h-[800px]">
      <CardHeader>
        <CardTitle>Guess History</CardTitle>
        <CardDescription>Your previous attempts</CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No guesses yet</p>
        ) : (
          <div className="space-y-2">
            {history
              .slice()
              .reverse()
              .map((item, index) => (
                <div
                  key={history.length - index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
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
