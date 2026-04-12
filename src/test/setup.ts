import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Suppress console.error noise in tests (e.g. React act() warnings)
// Remove this if you want to see all console output during tests
const originalError = console.error;
afterEach(() => {
  console.error = originalError;
});
