import "server-only";

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import {
  GameHostApiError,
  type GameHostCreateGameResponse,
  type GameHostGetGameResponse,
  type GameHostSubmitGuessResponse,
} from "@/types/game-host";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class GameHostClient {
  private readonly token: string;
  private readonly http: AxiosInstance;

  constructor(bearerToken: string) {
    if (!process.env.GAME_HOST) {
      throw new Error(
        "Missing GAME_HOST env var. Set the game host base URL."
      );
    }

    this.token = bearerToken;

    this.http = axios.create({
      baseURL: process.env.GAME_HOST!,
      timeout: 10_000,
    });
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const finalConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      data: body ?? undefined,
      headers: {
        ...(config?.headers ?? {}),
        Authorization: `Bearer ${this.token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...config,
    };

    try {
      const res = await this.http.request<T>(finalConfig);
      return res.data;
    } catch (err) {
      const e = err as AxiosError<any>;
      const status = e.response?.status;
      const serverMsg =
        (e.response?.data && (e.response.data.message || e.response.data.error)) ||
        e.message;
      throw new GameHostApiError(serverMsg ?? "Request failed", status, e.response?.data);
    }
  }

  async createGame(): Promise<GameHostCreateGameResponse> {
    return this.request<GameHostCreateGameResponse>("POST", "/games");
  }

  async getGame(gameId: string): Promise<GameHostGetGameResponse> {
    return this.request<GameHostGetGameResponse>("GET", `/games/${gameId}`);
  }

  async makeGuess(
    gameId: string,
    value: number
  ): Promise<GameHostSubmitGuessResponse> {
    return this.request<GameHostSubmitGuessResponse>("POST", `/games/${gameId}/guess`, {
      value,
    });
  }
}