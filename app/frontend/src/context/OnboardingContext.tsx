import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type OnboardingStep =
  | 'orientation-types'
  | 'orientation-nav'
  | 'intake'
  | 'review'
  | 'cleanup'
  | 'complete';

export const STEP_ORDER: OnboardingStep[] = ['orientation-types', 'orientation-nav', 'intake', 'review', 'cleanup'];

interface OnboardingState {
  step: OnboardingStep;
  recordFilename: string | null;
}

interface OnboardingContextValue {
  state: OnboardingState;
  advance: () => void;
  skip: () => void;
}

const ONBOARDING_KEY = 'qa-brain-onboarding-state';
const DEFAULT_STATE: OnboardingState = { step: 'orientation-types', recordFilename: null };

function readStoredState(): OnboardingState {
  const raw = localStorage.getItem(ONBOARDING_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return DEFAULT_STATE;
  }
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(readStoredState);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.step !== 'intake') return;
    if (location.pathname === '/incident/new') return;
    const match = location.pathname.match(/^\/incident\/([^/]+\.md)$/);
    if (match) {
      setState({ step: 'review', recordFilename: match[1] });
      return;
    }
    navigate('/incident/new');
  }, [state.step, location.pathname, navigate]);

  const advance = () => {
    setState((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      const next = idx === -1 || idx === STEP_ORDER.length - 1 ? 'complete' : STEP_ORDER[idx + 1];
      return { ...prev, step: next };
    });
  };

  const skip = () => setState({ step: 'complete', recordFilename: null });

  return <OnboardingContext.Provider value={{ state, advance, skip }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
