// import {
//   afterAll,
//   afterEach,
//   beforeAll,
// } from 'vitest';
import { fetch } from 'cross-fetch';

// Add `fetch` polyfill.
global.fetch = fetch;

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