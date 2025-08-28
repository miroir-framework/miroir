import {
  afterAll,
  afterEach,
  beforeAll,
} from 'vitest';
import { fetch } from 'cross-fetch';
import '@testing-library/jest-dom';

// Add `fetch` polyfill.
global.fetch = fetch;

// Configure React Testing Library for vitest
import { configure } from '@testing-library/react';
configure({ 
  testIdAttribute: 'data-testid',
  // Enable React 18 concurrent features support
  asyncUtilTimeout: 5000,
});

// Set up React 18 act environment for vitest
// This prevents the "not configured to support act(...)" warning
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Suppress React act warnings by overriding console.error
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('act(...)')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Set up React Testing Library environment
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// beforeAll(() => server.listen({ onUnhandledRequest: `error` }));
// afterAll(() => server.close());
// afterEach(() => server.resetHandlers());


// FAIL LOUDLY on unhandled promise rejections / errors
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.log(`FAILED TO HANDLE PROMISE REJECTION`, reason);
  // process.exit(1);
  throw reason;
});