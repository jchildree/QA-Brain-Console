import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

function Probe() {
  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="fontSize">{fontSize}</span>
      <button onClick={() => setTheme('light')}>go-light</button>
      <button onClick={() => setFontSize('large')}>go-large</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-font-size');
});

describe('ThemeProvider / useTheme', () => {
  it('defaults to dark theme and medium font size', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('fontSize')).toHaveTextContent('medium');
  });

  it('updates the document root attributes and persists to localStorage on change', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('go-light'));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('qa-brain-theme')).toBe('light');

    fireEvent.click(screen.getByText('go-large'));
    expect(document.documentElement.getAttribute('data-font-size')).toBe('large');
    expect(localStorage.getItem('qa-brain-font-size')).toBe('large');
  });

  it('reads a previously persisted preference on mount', () => {
    localStorage.setItem('qa-brain-theme', 'light');
    localStorage.setItem('qa-brain-font-size', 'small');

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('fontSize')).toHaveTextContent('small');
  });
});
