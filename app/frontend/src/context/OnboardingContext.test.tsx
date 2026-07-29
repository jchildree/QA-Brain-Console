import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';

function Probe() {
  const { state, advance, skip } = useOnboarding();
  const location = useLocation();
  return (
    <div>
      <span data-testid="step">{state.step}</span>
      <span data-testid="path">{location.pathname}</span>
      <span data-testid="filename">{state.recordFilename ?? ''}</span>
      <button onClick={advance}>advance</button>
      <button onClick={skip}>skip</button>
    </div>
  );
}

function FakeIntakePage() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/incident/INC-20260101-001.md')}>submit incident</button>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('OnboardingProvider', () => {
  it('defaults to the first orientation step when nothing is stored', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <Probe />
        </OnboardingProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('step')).toHaveTextContent('orientation-types');
  });

  it('skip jumps straight to complete and persists it', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <Probe />
        </OnboardingProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('skip'));
    expect(screen.getByTestId('step')).toHaveTextContent('complete');
    expect(JSON.parse(localStorage.getItem('qa-brain-onboarding-state')!).step).toBe('complete');
  });

  it('deep-links to /incident/new once the intake step is reached', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <Probe />
        </OnboardingProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('advance')); // -> orientation-nav
    fireEvent.click(screen.getByText('advance')); // -> intake, should redirect
    expect(screen.getByTestId('path')).toHaveTextContent('/incident/new');
  });

  it('captures the created record filename when the intake page navigates away after submit', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <Routes>
            <Route path="/incident/new" element={<FakeIntakePage />} />
            <Route path="*" element={<Probe />} />
          </Routes>
        </OnboardingProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('advance')); // -> orientation-nav
    fireEvent.click(screen.getByText('advance')); // -> intake, redirects to /incident/new

    fireEvent.click(screen.getByText('submit incident'));

    expect(screen.getByTestId('step')).toHaveTextContent('review');
    expect(screen.getByTestId('filename')).toHaveTextContent('INC-20260101-001.md');
  });

  it('resumes at the intake step (not restarted) if step was already intake on a fresh mount', () => {
    localStorage.setItem('qa-brain-onboarding-state', JSON.stringify({ step: 'intake', recordFilename: null }));
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <Probe />
        </OnboardingProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('step')).toHaveTextContent('intake');
    expect(screen.getByTestId('path')).toHaveTextContent('/incident/new');
  });

  it('resumes directly at review if a record was already created in a prior session', () => {
    localStorage.setItem(
      'qa-brain-onboarding-state',
      JSON.stringify({ step: 'review', recordFilename: 'INC-20260101-001.md' }),
    );
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <Probe />
        </OnboardingProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('step')).toHaveTextContent('review');
    expect(screen.getByTestId('filename')).toHaveTextContent('INC-20260101-001.md');
  });
});
