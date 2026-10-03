/**
 * Session-scoped CopilotKit backend pick (#275, #409).
 *
 * Key is `miroirAiBackend`: `"agent"` (the server's configured agent backend) or absent.
 * A stale `"cursor"` value from before #409 reads as `"agent"`. Absent / any other value
 * means the token `AI_PROVIDER_TYPE` path (no `properties` backend).
 */

export const MIROIR_AI_BACKEND_STORAGE_KEY = "miroirAiBackend";

export type MiroirAiBackendPick = "agent";

const STORED_AGENT_PICKS = new Set(["agent", "cursor"]);

const listeners = new Set<() => void>();

function emitMiroirAiBackendChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeMiroirAiBackend(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readMiroirAiBackend(): MiroirAiBackendPick | undefined {
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }
  return STORED_AGENT_PICKS.has(sessionStorage.getItem(MIROIR_AI_BACKEND_STORAGE_KEY) ?? "")
    ? "agent"
    : undefined;
}

export function writeMiroirAiBackend(backend?: MiroirAiBackendPick): void {
  if (typeof sessionStorage !== "undefined") {
    if (backend === "agent") {
      sessionStorage.setItem(MIROIR_AI_BACKEND_STORAGE_KEY, "agent");
    } else {
      sessionStorage.removeItem(MIROIR_AI_BACKEND_STORAGE_KEY);
    }
  }
  emitMiroirAiBackendChange();
}
