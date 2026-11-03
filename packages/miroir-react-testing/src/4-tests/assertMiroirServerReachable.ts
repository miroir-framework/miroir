/**
 * B6-c C2 — Preflight: ping miroir-server before starting a real-server UI integ run.
 */

export class MiroirServerUnreachableError extends Error {
  readonly rootApiUrl: string;
  readonly causeStatus?: number;

  constructor(rootApiUrl: string, detail: string, causeStatus?: number) {
    super(`miroir-server unreachable at ${rootApiUrl}: ${detail}`);
    this.name = "MiroirServerUnreachableError";
    this.rootApiUrl = rootApiUrl;
    this.causeStatus = causeStatus;
  }
}

export type AssertMiroirServerReachableOptions = {
  /** Override fetch (tests / TLS agents). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Request timeout in ms (default 5000). */
  timeoutMs?: number;
};

/**
 * Confirms `rootApiUrl` responds. Accepts any HTTP response that is not a
 * network failure (including 401/404) — the goal is liveness, not auth.
 */
export async function assertMiroirServerReachable(
  rootApiUrl: string,
  options: AssertMiroirServerReachableOptions = {},
): Promise<void> {
  const trimmed = rootApiUrl?.trim();
  if (!trimmed) {
    throw new MiroirServerUnreachableError("", "rootApiUrl is empty");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(trimmed, {
      method: "GET",
      signal: controller.signal,
    });
    // Any HTTP response means the server process answered.
    if (response.status === 0) {
      throw new MiroirServerUnreachableError(trimmed, "empty response (status 0)");
    }
  } catch (error) {
    if (error instanceof MiroirServerUnreachableError) {
      throw error;
    }
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? `timed out after ${timeoutMs}ms`
          : error.message
        : String(error);
    throw new MiroirServerUnreachableError(trimmed, message);
  } finally {
    clearTimeout(timer);
  }
}
