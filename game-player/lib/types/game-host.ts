export type GameHostCreateGameResponse = {
  id: string;
  status: "active" | "completed" | string;
  attempts: number;
  startedAt: string;
};

export type GameHostGetGameResponse = {
  id: string;
  status: "active" | "completed" | string;
  attempts: number;
  startedAt: string;
  finishedAt: string | null;
  lastGuessAt: string | null;
};

export type GameHostSubmitGuessResponse = {
  result: "low" | "high" | "correct";
  status: "active" | "completed" | string;
  attempts: number;
  lastGuessAt: string;
  finishedAt: string | null;
};

export class GameHostApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}