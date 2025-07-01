// src/setupTests.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock React 19's compiler runtime if needed
vi.mock('react-compiler-runtime', () => ({}));

// Mock React 19's async features
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: (promise: Promise<any>) => {
      if (promise && typeof promise.then === 'function') {
        return { read: () => promise };
      }
      return promise;
    },
  };
});