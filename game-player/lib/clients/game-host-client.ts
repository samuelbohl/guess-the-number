import 'server-only';

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  GameHostApiError,
  type GameHostCreateGameResponse,
  type GameHostGetGameResponse,
  type GameHostSubmitGuessResponse,
} from '@/lib/types/game-host';
import { gameHostConfig } from '@/lib/config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class GameHostClient {
  private readonly token: string;
  private readonly http: AxiosInstance;

  constructor(bearerToken: string) {
    this.token = bearerToken;
    this.http = axios.create({
      baseURL: gameHostConfig.baseUrl,
      timeout: gameHostConfig.timeout,
    });
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const isBodyMethod = method === 'POST' || method === 'PUT' || method === 'PATCH';

    const finalConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      data: body ?? (isBodyMethod ? {} : undefined),
      headers: {
        ...(config?.headers ?? {}),
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        ...(isBodyMethod ? { 'Content-Type': 'application/json' } : {}),
      },
      ...config,
    };

    try {
      const res = await this.http.request<T>(finalConfig);
      return res.data;
    } catch (err) {
      const e = err as AxiosError<any>;
      const status = e.response?.status;
      const serverMsg = (e.response?.data && (e.response.data.message || e.response.data.error)) || e.message;
      throw new GameHostApiError(serverMsg ?? 'Request failed', status, e.response?.data);
    }
  }

  async createGame(): Promise<GameHostCreateGameResponse> {
    return this.request<GameHostCreateGameResponse>('POST', '/games');
  }

  async getGame(gameId: string): Promise<GameHostGetGameResponse> {
    return this.request<GameHostGetGameResponse>('GET', `/games/${gameId}`);
  }

  async makeGuess(gameId: string, value: number): Promise<GameHostSubmitGuessResponse> {
    return this.request<GameHostSubmitGuessResponse>('POST', `/games/${gameId}/guess`, {
      value,
    });
  }
}
