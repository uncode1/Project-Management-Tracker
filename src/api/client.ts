import type {
  AiIdeasResponse,
  AiSummaryResponse,
  ApiBoard,
  ApiList,
  ApiCard,
  ApiTeam,
  ApiTokens,
  ApiUser,
  ApiUserDirectory,
  AuthResponse,
  BoardPayload,
  CardPayload,
  CreateUserPayload,
  ListPayload,
  LoginPayload,
  RegisterPayload,
  TeamPayload,
  UpdateUserPayload,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');

type AuthMode = 'access' | 'refresh' | 'none';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
};

interface RequestConfig {
  auth?: AuthMode;
  skipRefresh?: boolean;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokensListener?: (tokens: { accessToken: string; refreshToken: string } | null) => void;
  private refreshPromise: Promise<boolean> | null = null;

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokensListener?.({ accessToken, refreshToken });
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokensListener?.(null);
  }

  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken };
  }

  onTokensChange(listener: (tokens: { accessToken: string; refreshToken: string } | null) => void): void {
    this.tokensListener = listener;
  }

  private buildUrl(path: string): string {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private prepareBody(body?: BodyInit | object | null): BodyInit | undefined {
    if (!body) return undefined;
    if (body instanceof FormData || typeof body === 'string') {
      return body;
    }
    return JSON.stringify(body);
  }

  private async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const tokens = await this.request<ApiTokens>(
          '/auth/refresh',
          { method: 'POST' },
          { auth: 'refresh', skipRefresh: true },
        );
        this.setTokens(tokens.access_token, tokens.refresh_token);
        this.refreshPromise = null;
        return true;
      })().catch((error) => {
        this.refreshPromise = null;
        this.clearTokens();
        throw error;
      });
    }

    return this.refreshPromise;
  }

  async request<T>(
    path: string,
    options: RequestOptions = {},
    config: RequestConfig = {},
  ): Promise<T> {
    const authMode = config.auth ?? 'access';
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (authMode !== 'none') {
      const token = authMode === 'access' ? this.accessToken : this.refreshToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const { body: rawBody, ...rest } = options;
    const response = await fetch(this.buildUrl(path), {
      ...rest,
      headers,
      body: this.prepareBody(rawBody),
    });

    if (response.status === 401 && authMode === 'access' && !config.skipRefresh) {
      const refreshed = await this.refreshTokens().catch(() => false);
      if (refreshed) {
        return this.request<T>(path, options, { ...config, skipRefresh: true });
      }
    }

    if (!response.ok) {
      let data: unknown;
      try {
        data = await response.json();
      } catch (error) {
        // ignore json parse errors
      }
      throw new ApiError(response.status, response.statusText, data);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    }, { auth: 'none' });

    this.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    }, { auth: 'none' });

    this.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  }

  async logout(): Promise<void> {
    if (!this.refreshToken) {
      this.clearTokens();
      return;
    }

    await this.request('/auth/logout', { method: 'POST' }, { auth: 'refresh' }).catch(() => undefined);
    this.clearTokens();
  }

  async getBoards(): Promise<ApiBoard[]> {
    return this.request<ApiBoard[]>('/boards');
  }

  async getBoard(boardId: number): Promise<ApiBoard> {
    return this.request<ApiBoard>(`/boards/${boardId}`);
  }

  async createBoard(payload: BoardPayload): Promise<ApiBoard> {
    return this.request<ApiBoard>('/boards', {
      method: 'POST',
      body: payload,
    });
  }

  async updateBoard(boardId: number, payload: Partial<BoardPayload>): Promise<ApiBoard> {
    return this.request<ApiBoard>(`/boards/${boardId}`, {
      method: 'PATCH',
      body: payload,
    });
  }

  async deleteBoard(boardId: number): Promise<void> {
    await this.request(`/boards/${boardId}`, { method: 'DELETE' });
  }

  async createTeam(payload: TeamPayload): Promise<ApiTeam> {
    return this.request<ApiTeam>('/teams', { method: 'POST', body: payload });
  }

  async getTeams(): Promise<ApiTeam[]> {
    return this.request<ApiTeam[]>('/teams');
  }

  async createList(boardId: number, payload: ListPayload): Promise<ApiList> {
    return this.request<ApiList>(`/boards/${boardId}/lists`, { method: 'POST', body: payload });
  }

  async updateList(listId: number, payload: Partial<ListPayload>): Promise<ApiList> {
    return this.request<ApiList>(`/boards/lists/${listId}`, { method: 'PATCH', body: payload });
  }

  async deleteList(listId: number): Promise<void> {
    await this.request(`/boards/lists/${listId}`, { method: 'DELETE' });
  }

  async createCard(listId: number, payload: CardPayload): Promise<ApiCard> {
    return this.request<ApiCard>(`/boards/lists/${listId}/cards`, { method: 'POST', body: payload });
  }

  async updateCard(cardId: number, payload: Partial<CardPayload>): Promise<ApiCard> {
    return this.request<ApiCard>(`/boards/cards/${cardId}`, { method: 'PATCH', body: payload });
  }

  async deleteCard(cardId: number): Promise<void> {
    await this.request(`/boards/cards/${cardId}`, { method: 'DELETE' });
  }

  async getCurrentUser(): Promise<ApiUser> {
    return this.request<ApiUser>('/users/me');
  }

  async getUsers(): Promise<ApiUserDirectory[]> {
    return this.request<ApiUserDirectory[]>('/users');
  }

  async createUser(payload: CreateUserPayload): Promise<ApiUserDirectory> {
    return this.request<ApiUserDirectory>('/users', { method: 'POST', body: payload });
  }

  async updateUser(userId: number, payload: UpdateUserPayload): Promise<ApiUserDirectory> {
    return this.request<ApiUserDirectory>(`/users/${userId}`, { method: 'PATCH', body: payload });
  }

  async getAiSummary(boardId?: number): Promise<AiSummaryResponse> {
    return this.request<AiSummaryResponse>('/ai/summary', {
      method: 'POST',
      body: boardId ? { board_id: boardId } : {},
    });
  }

  async generateAiIdeas(prompt: string, boardId?: number): Promise<AiIdeasResponse> {
    return this.request<AiIdeasResponse>('/ai/prompts', {
      method: 'POST',
      body: {
        prompt,
        ...(boardId ? { board_id: boardId } : {}),
      },
    });
  }
}

export const apiClient = new ApiClient();
