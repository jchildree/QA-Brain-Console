import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// @testing-library/dom's waitFor only detects fake timers via a global `jest`
// object (see testing-library/dom-testing-library#830). Vitest doesn't define
// one, so alias it to `vi` (API-compatible) to keep waitFor() working under
// vi.useFakeTimers().
(globalThis as unknown as { jest: typeof vi }).jest = vi;

// @xyflow/react (used by the vault/relationship graphs) instantiates a
// ResizeObserver on mount; jsdom doesn't provide one. Stub it so graph-bearing
// pages render under test.
if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
