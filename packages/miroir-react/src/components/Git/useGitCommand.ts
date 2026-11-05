/**
 * #679: the Git actions the page runs on a click (stage, commit, checkout, ...), as opposed to the reads of
 * `useGitRequest`. Each one resolves to the same state as a read; the page refreshes its reads after a
 * success.
 */
import { useCallback, useState } from "react";

import type { GitActionType } from "@miroir-framework/core";

import { gitRequestStateOf, type GitRequestState, type RunGitAction } from "./useGitRequest.js";

export type GitCommand = <T = unknown>(
  actionType: GitActionType,
  payload?: Record<string, unknown>,
) => Promise<GitRequestState<T>>;

export function useGitCommand(
  run: RunGitAction,
  onSuccess: (actionType: GitActionType) => void,
): { busy: boolean; command: GitCommand } {
  const [busy, setBusy] = useState(false);
  const command: GitCommand = useCallback(
    async <T>(actionType: GitActionType, payload: Record<string, unknown> = {}) => {
      setBusy(true);
      let state: GitRequestState<T>;
      try {
        state = gitRequestStateOf<T>(await run(actionType, payload));
      } catch (error) {
        state = { status: "error", error: { errorMessage: String(error) } };
      } finally {
        setBusy(false);
      }
      if (state.status === "ok") {
        onSuccess(actionType);
      }
      return state;
    },
    [run, onSuccess],
  );
  return { busy, command };
}
