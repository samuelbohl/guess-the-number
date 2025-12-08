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

// Server API types (game-host)
export type GtnCreateGameResponse = {
  id: string; // UUID
  status: "active" | "completed" | string;
  attempts: number;
  startedAt: string; // ISO timestamp
};

export type GtnGetGameResponse = {
  id: string; // UUID
  status: "active" | "completed" | string;
  attempts: number;
  startedAt: string; // ISO timestamp
  finishedAt: string | null; // ISO timestamp or null
  lastGuessAt: string | null; // ISO timestamp or null
};

export type GtnSubmitGuessResponse = {
  result: "low" | "high" | "correct";
  status: "active" | "completed" | string;
  attempts: number;
  lastGuessAt: string; // ISO timestamp
  finishedAt: string | null; // ISO timestamp or null
};

export type GtnGuessHistoryItemServer = {
  value: number;
  result: "low" | "high" | "correct";
  createdAt: string; // ISO timestamp
};