import { createContext } from 'react';
import type { LoginPayload, RegisterPayload } from '../api/types';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  teamId?: number | null;
}

export interface StoredSession {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const STORAGE_KEY = 'pmt.session';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
