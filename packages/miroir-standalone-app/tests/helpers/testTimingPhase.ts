import { performance } from "node:perf_hooks";

type MiroirTestTimingSink = { phase(name: string, ms: number): void };

/**
 * #318: time `run` as a named phase for the opt-in timing profile (`run-nonreg.py --timings`).
 * Used for work vitest counts as collect, such as a session init at module top level.
 * Without the timing runner (the default) it only runs `run`.
 */
export async function timedTestPhase<T>(name: string, run: () => Promise<T>): Promise<T> {
  const sink = (globalThis as { __miroirTestTiming?: MiroirTestTimingSink }).__miroirTestTiming;
  if (!sink) {
    return run();
  }
  const start = performance.now();
  try {
    return await run();
  } finally {
    sink.phase(name, performance.now() - start);
  }
}
