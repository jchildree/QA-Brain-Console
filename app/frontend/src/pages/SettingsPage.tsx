import { useTheme, type Theme, type FontSize, type Contrast } from '../context/ThemeContext';

const selectClasses = 'text-sm px-3 py-1.5 rounded-lg focus:outline-none font-mono border';
const selectStyle = { background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' };

export function SettingsPage() {
  const { theme, fontSize, contrast, reduceMotion, setTheme, setFontSize, setContrast, setReduceMotion } = useTheme();

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="chart-title">Settings</h1>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Theme</span>
        <select
          aria-label="Theme"
          className={selectClasses}
          style={selectStyle}
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Console Font Size</span>
        <select
          aria-label="Console Font Size"
          className={selectClasses}
          style={selectStyle}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value as FontSize)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xlarge">Extra Large</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Contrast</span>
        <select
          aria-label="Contrast"
          className={selectClasses}
          style={selectStyle}
          value={contrast}
          onChange={(e) => setContrast(e.target.value as Contrast)}
        >
          <option value="normal">Normal</option>
          <option value="high">High Contrast</option>
        </select>
      </label>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          aria-label="Reduce Motion"
          checked={reduceMotion}
          onChange={(e) => setReduceMotion(e.target.checked)}
        />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Reduce Motion</span>
      </label>

      <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
        Preferences save to this browser. Additional theme palettes can be added later.
      </p>
    </div>
  );
}
