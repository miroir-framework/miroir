/**
 * #679 D13: with authentication on, the Git actions need a designer (an Admin grant), at every door
 * (REST server, RestClientStub for Electron and tests, MCP through executeEndpointAction).
 */
import { describe, expect, it } from "vitest";

import { authorizeDesignerOnlyAction } from "../../../../src/1_core/authentication/AccessGate";
import { ADMIN_APPLICATION_UUID } from "../../../../src/1_core/authentication/AccessPolicy";

const LIBRARY_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const principal = { miroirUserUuid: "679d0001-0000-4000-8000-000000000001", username: "dave" } as any;

function directory(targetUuid?: string) {
  return {
    directory: { users: [], credentials: [] } as any,
    deployments: [],
    grants: targetUuid
      ? [{ miroirUser: principal.miroirUserUuid, targetType: "application", targetUuid } as any]
      : [],
  };
}

const gitStatus = { action: { actionType: "gitAction_status" } };

describe("authorizeDesignerOnlyAction (#679 D13)", () => {
  it("lets everything through while authentication is off", () => {
    expect(authorizeDesignerOnlyAction(false, { principal: undefined, access: undefined }, gitStatus).allowed).toBe(true);
  });

  it("does not concern the other actions", () => {
    const body = { action: { actionType: "createInstance" } };
    expect(authorizeDesignerOnlyAction(true, { principal, access: directory() }, body).allowed).toBe(true);
  });

  it("refuses a Git action to a user with a grant on the application only", () => {
    const decision = authorizeDesignerOnlyAction(true, { principal, access: directory(LIBRARY_APPLICATION) }, gitStatus);
    expect(decision).toMatchObject({ allowed: false, status: 403 });
  });

  it("refuses a Git action without a principal", () => {
    expect(authorizeDesignerOnlyAction(true, { principal: undefined, access: directory() }, gitStatus).allowed).toBe(false);
  });

  it("lets a designer (an Admin grant) run a Git action, in a wrapped or a bare body", () => {
    const access = directory(ADMIN_APPLICATION_UUID);
    expect(authorizeDesignerOnlyAction(true, { principal, access }, gitStatus).allowed).toBe(true);
    expect(authorizeDesignerOnlyAction(true, { principal, access }, { actionType: "gitAction_diff" }).allowed).toBe(true);
  });
});
