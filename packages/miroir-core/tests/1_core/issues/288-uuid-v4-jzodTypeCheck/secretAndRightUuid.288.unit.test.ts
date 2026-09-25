/**
 * #288 — SecretsService and TestbedAccessGrant used to derive version-5 uuids for the rows
 * they create. jzodTypeCheck's `uuid` schema accepts version 4 only (`isValidUUID`,
 * packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts), so those rows failed model
 * validation. Both services now derive their instance uuid via `deterministicUuidV4`
 * (still deterministic per natural key, but version-4 / variant-1 shaped).
 *
 * This covers each service's created row against its entity schema (MiroirSecret /
 * MiroirRight), the same jzodTypeCheck path the admin deployment's modelValidation runs.
 */
import { describe, expect, it } from "vitest";

import { entityMiroirRight, entityMiroirSecret } from "miroir-test-app_deployment-admin";

import {
  buildTestbedApplicationAccessGrantInstance,
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  importProcessSecrets,
  type JzodElement,
  type MiroirModelEnvironment,
} from "miroir-core";

const WRAPPING_KEY = "test-secrets-master-288";
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const APP_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("issue 288 — SecretsService / TestbedAccessGrant rows pass jzodTypeCheck", () => {
  it("a MiroirSecret row created by importProcessSecrets passes the MiroirSecret schema", () => {
    const [instance] = importProcessSecrets({
      wrappingKey: WRAPPING_KEY,
      secrets: { discogsToken: "plain-value" },
    });

    const result = checkModelValidationInstance(
      entityMiroirSecret.mlSchema as unknown as JzodElement,
      instance,
      "importProcessSecrets result",
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
    );
    expect(result.status).toBe("ok");
  });

  it("a MiroirRight row created by buildTestbedApplicationAccessGrantInstance passes the MiroirRight schema", () => {
    const instance = buildTestbedApplicationAccessGrantInstance({
      miroirUserUuid: ALICE_UUID,
      applicationUuid: APP_UUID,
      applicationName: "Library",
    });

    const result = checkModelValidationInstance(
      entityMiroirRight.mlSchema as unknown as JzodElement,
      instance,
      "buildTestbedApplicationAccessGrantInstance result",
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
    );
    expect(result.status).toBe("ok");
  });
});
