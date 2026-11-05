/**
 * #679 D7: which Miroir changes not yet on disk make a Git action refuse to run. A commit looks at its own
 * application; a checkout or a pull rewrites the files of every deployment in the repository, and the reload
 * that follows would drop the changes of each of them.
 */
import { describe, expect, it } from "vitest";

import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement";
import type { GitAction } from "../../src/0_interfaces/3_controllers/GitAction";
import { GIT_ENDPOINT_UUID } from "../../src/0_interfaces/3_controllers/GitAction";
import { openMiroirTransactionError } from "../../src/3_controllers/GitActions";

const LIBRARY = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const OTHER = "679a0000-0000-4000-8000-0000000000aa";
const otherApplicationChange = [{ payload: { application: OTHER } }];

function action(actionType: GitAction["actionType"], payload: Record<string, unknown> = {}): GitAction {
  return { actionType, endpoint: GIT_ENDPOINT_UUID, payload: { application: LIBRARY, ...payload } } as GitAction;
}

function reason(error: Action2Error | undefined): unknown {
  return error?.errorContext?.reason;
}

describe("openMiroirTransactionError (#679 D7)", () => {
  it("lets a commit run while only another application has unsaved changes", () => {
    expect(openMiroirTransactionError(action("gitAction_commit", { message: "m" }), otherApplicationChange)).toBeUndefined();
  });

  it("refuses a commit of the application holding unsaved changes", () => {
    expect(reason(openMiroirTransactionError(action("gitAction_commit", { message: "m" }), [{ payload: { application: LIBRARY } }]))).toBe(
      "openMiroirTransaction",
    );
  });

  it("refuses a checkout or a pull while any application has unsaved changes", () => {
    for (const actionType of ["gitAction_checkout", "gitAction_pull"] as const) {
      const error = openMiroirTransactionError(action(actionType, { ref: "main" }), otherApplicationChange);
      expect(reason(error), actionType).toBe("openMiroirTransaction");
      expect(error?.errorContext?.applications, actionType).toEqual([OTHER]);
    }
  });

  it("never refuses an action that leaves the files as they are", () => {
    for (const actionType of ["gitAction_fetch", "gitAction_push", "gitAction_status"] as const) {
      expect(openMiroirTransactionError(action(actionType), otherApplicationChange), actionType).toBeUndefined();
    }
  });
});
