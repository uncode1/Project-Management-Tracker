import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { apiClient } from '../api/client';
import type { LoginPayload, RegisterPayload } from '../api/types';
import {
  AuthContext,
  type AuthUser,
  type StoredSession,
  type AuthContextValue,
  STORAGE_KEY,
} from './auth-context';
import { mapUser, persistSession, clearSession } from './auth-utils';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    apiClient.onTokensChange((tokens) => {
      if (!tokens) {
        userRef.current = null;
        setUser(null);
        clearSession();
        return;
      }

      if (userRef.current) {
        persistSession({ user: userRef.current, tokens });
      }
    });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as StoredSession;
        if (!parsed.tokens.accessToken || !parsed.tokens.refreshToken) {
          clearSession();
          setIsLoading(false);
          return;
        }

        apiClient.setTokens(parsed.tokens.accessToken, parsed.tokens.refreshToken);
        setUser(parsed.user);
        userRef.current = parsed.user;

        try {
          const profile = await apiClient.getCurrentUser();
          const mapped = mapUser(profile);
          setUser(mapped);
          userRef.current = mapped;
          const tokens = apiClient.getTokens();
          if (tokens.accessToken && tokens.refreshToken) {
            persistSession({
              user: mapped,
              tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              },
            });
          }
        } catch (error) {
          apiClient.clearTokens();
          userRef.current = null;
          setUser(null);
          clearSession();
        }
      } catch (error) {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiClient.login(payload);
    const mapped = mapUser(response.user);
    userRef.current = mapped;
    setUser(mapped);
    persistSession({
      user: mapped,
      tokens: {
        accessToken: response.tokens.access_token,
        refreshToken: response.tokens.refresh_token,
      },
    });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await apiClient.register(payload);
    const mapped = mapUser(response.user);
    userRef.current = mapped;
    setUser(mapped);
    persistSession({
      user: mapped,
      tokens: {
        accessToken: response.tokens.access_token,
        refreshToken: response.tokens.refresh_token,
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    userRef.current = null;
    setUser(null);
    clearSession();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
