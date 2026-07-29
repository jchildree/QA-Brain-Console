import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingProvider } from '../context/OnboardingContext';
import { OnboardingModal } from './OnboardingModal';

beforeEach(() => {
  localStorage.clear();
});

describe('OnboardingModal', () => {
  it('shows the first orientation step on a fresh login', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <OnboardingModal />
        </OnboardingProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Welcome to QA-Brain')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('renders nothing once onboarding is complete', () => {
    localStorage.setItem('qa-brain-onboarding-state', JSON.stringify({ step: 'complete', recordFilename: null }));
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <OnboardingModal />
        </OnboardingProvider>
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('skip link hides the modal', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <OnboardingProvider>
          <OnboardingModal />
        </OnboardingProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Skip onboarding'));
    expect(screen.queryByText('Welcome to QA-Brain')).not.toBeInTheDocument();
  });

  it('shows the intake banner (not the full overlay) once the intake step is reached', () => {
    localStorage.setItem('qa-brain-onboarding-state', JSON.stringify({ step: 'intake', recordFilename: null }));
    render(
      <MemoryRouter initialEntries={['/incident/new']}>
        <OnboardingProvider>
          <OnboardingModal />
        </OnboardingProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Fill out and submit this incident report/)).toBeInTheDocument();
  });
});
