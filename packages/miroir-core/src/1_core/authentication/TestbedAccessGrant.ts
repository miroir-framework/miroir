/**
 * Testbed access grants for hatch-on integ sessions.
 *
 * assertAccessForDeployment 403s unknown deployments, then requires an
 * application or deployment MiroirRight. Create order is: AdminApplication,
 * Deployment, optional grant, then open/create store.
 *
 * Grant rows are created only when the caller passes a principal — callers
 * must apply the gate "auth on AND principal known".
 */

import type { EntityInstance } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { entityMiroirRight } from "miroir-test-app_deployment-admin";
import { deterministicUuidV4 } from "../tools.js";
import { ENTITY_MIROIR_RIGHT_UUID } from "./AccessPolicy.js";

export type TestbedAccessGrantPrincipal = {
  miroirUserUuid: string;
};

export function resolveTestbedAccessGrantPrincipal(args: {
  authenticationEnabled: boolean;
  principal?: { miroirUserUuid: string } | undefined;
}): TestbedAccessGrantPrincipal | undefined {
  if (!args.authenticationEnabled) {
    return undefined;
  }
  const miroirUserUuid = args.principal?.miroirUserUuid;
  if (!miroirUserUuid) {
    return undefined;
  }
  return { miroirUserUuid };
}

/**
 * Version-4 shaped (see `deterministicUuidV4`): jzodTypeCheck's uuid schema accepts
 * version 4 only.
 */
export function testbedApplicationAccessGrantUuid(
  miroirUserUuid: string,
  applicationUuid: string,
): string {
  return deterministicUuidV4(
    `${miroirUserUuid}\napplication\n${applicationUuid}`,
    ENTITY_MIROIR_RIGHT_UUID,
  );
}

export function buildTestbedApplicationAccessGrantInstance(args: {
  miroirUserUuid: string;
  applicationUuid: string;
  applicationName: string;
}): EntityInstance {
  return {
    uuid: testbedApplicationAccessGrantUuid(args.miroirUserUuid, args.applicationUuid),
    parentName: entityMiroirRight.name,
    parentUuid: entityMiroirRight.uuid,
    name: `Testbed access — ${args.applicationName}`,
    miroirUser: args.miroirUserUuid,
    targetType: "application",
    targetUuid: args.applicationUuid,
    capability: "admin",
    description: `Auto-granted testbed access to ${args.applicationName} for the current user.`,
  } as EntityInstance;
}
