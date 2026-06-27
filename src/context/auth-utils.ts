import type { ApiUser } from '../api/types';
import type { AuthUser, StoredSession } from './auth-context';
import { STORAGE_KEY } from './auth-context';

export const mapUser = (user: ApiUser): AuthUser => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  role: user.role,
  teamId: user.team_id,
});

export const persistSession = (session: StoredSession) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};
