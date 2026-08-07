import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type Contrast = 'normal' | 'high';

interface ThemeContextValue {
  theme: Theme;
  fontSize: FontSize;
  contrast: Contrast;
  reduceMotion: boolean;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
  setContrast: (contrast: Contrast) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
}

const THEME_KEY = 'qa-brain-theme';
const FONT_SIZE_KEY = 'qa-brain-font-size';
const CONTRAST_KEY = 'qa-brain-contrast';
const REDUCE_MOTION_KEY = 'qa-brain-reduce-motion';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored<T extends string>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  return (value as T | null) ?? fallback;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStored(THEME_KEY, 'dark'));
  const [fontSize, setFontSize] = useState<FontSize>(() => readStored(FONT_SIZE_KEY, 'medium'));
  const [contrast, setContrast] = useState<Contrast>(() => readStored(CONTRAST_KEY, 'normal'));
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => localStorage.getItem(REDUCE_MOTION_KEY) === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem(FONT_SIZE_KEY, fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute('data-contrast', contrast);
    localStorage.setItem(CONTRAST_KEY, contrast);
  }, [contrast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-motion', String(reduceMotion));
    localStorage.setItem(REDUCE_MOTION_KEY, String(reduceMotion));
  }, [reduceMotion]);

  return (
    <ThemeContext.Provider value={{ theme, fontSize, contrast, reduceMotion, setTheme, setFontSize, setContrast, setReduceMotion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
