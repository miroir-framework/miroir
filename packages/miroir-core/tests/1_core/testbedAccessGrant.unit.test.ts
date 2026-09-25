import { describe, expect, it } from "vitest";

import { entityMiroirRight } from "miroir-test-app_deployment-admin";
import {
  buildTestbedApplicationAccessGrantInstance,
  resolveTestbedAccessGrantPrincipal,
  testbedApplicationAccessGrantUuid,
} from "../../src/1_core/authentication/TestbedAccessGrant";

const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const APP_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
/** deterministicUuidV4(`${alice}\napplication\n${app}`, ENTITY_MIROIR_RIGHT_UUID) */
const EXPECTED_GRANT_UUID = "20b0b4ce-1d09-44c5-93be-59886264356f";

describe("resolveTestbedAccessGrantPrincipal", () => {
  it("returns the principal only when auth is on and a user uuid is known", () => {
    expect(
      resolveTestbedAccessGrantPrincipal({
        authenticationEnabled: true,
        principal: { miroirUserUuid: ALICE_UUID },
      }),
    ).toEqual({ miroirUserUuid: ALICE_UUID });
  });

  it("returns undefined when auth is off even if a principal is present", () => {
    expect(
      resolveTestbedAccessGrantPrincipal({
        authenticationEnabled: false,
        principal: { miroirUserUuid: ALICE_UUID },
      }),
    ).toBeUndefined();
  });

  it("returns undefined when auth is on but no principal is known", () => {
    expect(
      resolveTestbedAccessGrantPrincipal({
        authenticationEnabled: true,
        principal: undefined,
      }),
    ).toBeUndefined();
  });
});

describe("testbedApplicationAccessGrantUuid", () => {
  it("is stable for the same user and application", () => {
    expect(testbedApplicationAccessGrantUuid(ALICE_UUID, APP_UUID)).toBe(EXPECTED_GRANT_UUID);
  });
});

describe("buildTestbedApplicationAccessGrantInstance", () => {
  it("builds an application MiroirRight for the principal on the testbed app", () => {
    expect(
      buildTestbedApplicationAccessGrantInstance({
        miroirUserUuid: ALICE_UUID,
        applicationUuid: APP_UUID,
        applicationName: "Library",
      }),
    ).toMatchObject({
      uuid: EXPECTED_GRANT_UUID,
      parentName: "MiroirRight",
      parentUuid: entityMiroirRight.uuid,
      miroirUser: ALICE_UUID,
      targetType: "application",
      targetUuid: APP_UUID,
      capability: "admin",
    });
  });
});
