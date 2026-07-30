import { createContext, useContext } from 'react';

export interface AuthContextValue {
  username: string | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({ username: null, logout: () => {} });

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
