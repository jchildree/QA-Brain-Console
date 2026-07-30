import { createContext, useContext } from 'react';
import type { Role } from '../api/client';

export interface AuthContextValue {
  username: string | null;
  role: Role | null;
  isAdmin: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({ username: null, role: null, isAdmin: false, logout: () => {} });

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
