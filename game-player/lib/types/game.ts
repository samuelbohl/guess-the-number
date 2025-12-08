export type GameState = "idle" | "playing" | "won";
export type FeedbackType = "none" | "higher" | "lower" | "correct";

export type Range = {
  min: number;
  max: number;
};

export type GuessHistoryItem = {
  guess: number;
  feedback: FeedbackType;
};
