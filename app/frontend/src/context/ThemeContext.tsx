import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextValue {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
}

const THEME_KEY = 'qa-brain-theme';
const FONT_SIZE_KEY = 'qa-brain-font-size';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored<T extends string>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  return (value as T | null) ?? fallback;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStored(THEME_KEY, 'dark'));
  const [fontSize, setFontSize] = useState<FontSize>(() => readStored(FONT_SIZE_KEY, 'medium'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem(FONT_SIZE_KEY, fontSize);
  }, [fontSize]);

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
