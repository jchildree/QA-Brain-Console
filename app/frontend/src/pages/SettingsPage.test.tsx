import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../context/ThemeContext';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-font-size');
});

function renderPage() {
  return render(
    <ThemeProvider>
      <SettingsPage />
    </ThemeProvider>
  );
}

describe('SettingsPage', () => {
  it('shows the current theme and lets the user switch to light', () => {
    renderPage();
    const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement;
    expect(themeSelect.value).toBe('dark');

    fireEvent.change(themeSelect, { target: { value: 'light' } });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('shows the current console font size and lets the user switch it', () => {
    renderPage();
    const fontSelect = screen.getByLabelText('Console Font Size') as HTMLSelectElement;
    expect(fontSelect.value).toBe('medium');

    fireEvent.change(fontSelect, { target: { value: 'large' } });
    expect(document.documentElement.getAttribute('data-font-size')).toBe('large');
  });
});
