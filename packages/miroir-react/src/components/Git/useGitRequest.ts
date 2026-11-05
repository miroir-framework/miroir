/**
 * #679: the results of the Git actions shown by the Git page, without a `useEffect`: a store per
 * request runs the action when the page first subscribes to it, and notifies once it settles. A
 * `generation` change (a refresh, an action that changed the repository) makes a new request.
 */
import { useMemo, useSyncExternalStore } from "react";

import { Action2Error, type Action2ReturnType, type GitActionType } from "@miroir-framework/core";

/** Runs one Git action on the page's application: the page's only access to the repository. */
export type RunGitAction = (
  actionType: GitActionType,
  payload?: Record<string, unknown>,
) => Promise<Action2ReturnType>;

export type GitRequestError = {
  errorType?: string;
  errorMessage?: string;
  /** `errorContext.reason` of a Git action error (`notARepository`, ...): what the page switches on. */
  reason?: string;
  errorContext?: Record<string, unknown>;
};

export type GitRequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; value: T }
  | { status: "error"; error: GitRequestError };

export interface GitRequestStore<T> {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => GitRequestState<T>;
}

export function gitRequestStateOf<T>(result: Action2ReturnType): GitRequestState<T> {
  if (result instanceof Action2Error || (result as { status?: string })?.status !== "ok") {
    const error = result as Partial<Action2Error>;
    const errorContext = error.errorContext as Record<string, unknown> | undefined;
    return {
      status: "error",
      error: {
        errorType: error.errorType,
        errorMessage: error.errorMessage,
        reason: typeof errorContext?.reason === "string" ? errorContext.reason : undefined,
        errorContext,
      },
    };
  }
  return { status: "ok", value: (result as { returnedDomainElement: unknown }).returnedDomainElement as T };
}

/** A store that runs `run` once, on its first subscription. */
export function createGitRequestStore<T>(run: () => Promise<Action2ReturnType>): GitRequestStore<T> {
  let state: GitRequestState<T> = { status: "loading" };
  let started = false;
  const listeners = new Set<() => void>();
  const settle = (next: GitRequestState<T>) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  return {
    subscribe(onChange) {
      listeners.add(onChange);
      if (!started) {
        started = true;
        run().then(
          (result) => settle(gitRequestStateOf<T>(result)),
          (error: unknown) => settle({ status: "error", error: { errorMessage: String(error) } }),
        );
      }
      return () => {
        listeners.delete(onChange);
      };
    },
    getSnapshot: () => state,
  };
}

const idleState: GitRequestState<never> = { status: "idle" };
const idleStore: GitRequestStore<never> = {
  subscribe: () => () => undefined,
  getSnapshot: () => idleState,
};

/**
 * The state of one Git action, run again when `run`, the action, its payload or `generation` change.
 * An undefined payload is no request (`idle`), for a panel that has nothing selected.
 */
export function useGitRequest<T>(
  run: RunGitAction,
  actionType: GitActionType,
  payload: Record<string, unknown> | undefined,
  generation: number,
): GitRequestState<T> {
  const payloadKey = payload === undefined ? undefined : JSON.stringify(payload);
  const store = useMemo(
    () =>
      payloadKey === undefined
        ? (idleStore as GitRequestStore<T>)
        : createGitRequestStore<T>(() => run(actionType, JSON.parse(payloadKey))),
    [run, actionType, payloadKey, generation],
  );
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
