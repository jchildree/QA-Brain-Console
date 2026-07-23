import { useTheme, type Theme, type FontSize } from '../context/ThemeContext';

const selectClasses =
  'bg-slate-950 border border-slate-800 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-green-500 text-slate-200 font-mono';

export function SettingsPage() {
  const { theme, fontSize, setTheme, setFontSize } = useTheme();

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-lg font-bold text-slate-100">Settings</h1>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Theme</span>
        <select
          aria-label="Theme"
          className={selectClasses}
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Console Font Size</span>
        <select
          aria-label="Console Font Size"
          className={selectClasses}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value as FontSize)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>

      <p className="text-xs text-slate-500 font-mono">
        Preferences save to this browser. Additional theme palettes can be added later.
      </p>
    </div>
  );
}
