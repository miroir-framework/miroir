/**
 * Session-scoped CopilotKit backend pick (#275).
 *
 * Key is `miroirAiBackend`: `"cursor"` or absent. Absent / any other value
 * means the token `AI_PROVIDER_TYPE` path (no `properties` backend).
 */

export const MIROIR_AI_BACKEND_STORAGE_KEY = "miroirAiBackend";

export type MiroirAiBackendPick = "cursor";

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
  return sessionStorage.getItem(MIROIR_AI_BACKEND_STORAGE_KEY) === "cursor"
    ? "cursor"
    : undefined;
}

export function writeMiroirAiBackend(backend?: MiroirAiBackendPick): void {
  if (typeof sessionStorage !== "undefined") {
    if (backend === "cursor") {
      sessionStorage.setItem(MIROIR_AI_BACKEND_STORAGE_KEY, "cursor");
    } else {
      sessionStorage.removeItem(MIROIR_AI_BACKEND_STORAGE_KEY);
    }
  }
  emitMiroirAiBackendChange();
}
