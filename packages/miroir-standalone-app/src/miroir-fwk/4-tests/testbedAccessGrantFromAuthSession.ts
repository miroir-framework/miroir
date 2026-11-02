import {
  readUsableBearerPrincipal,
  resolveTestbedAccessGrantPrincipal,
  type TestbedAccessGrantPrincipal,
} from "@miroir-framework/core";

import { getAuthenticationEnabled, getAuthToken } from "@miroir-framework/react";

/**
 * Gate for testbed MiroirRight rows: auth on (from /auth/status) and a usable
 * Bearer principal. Vitest typically has neither, so this returns undefined.
 */
export function testbedAccessGrantFromAuthSession(): TestbedAccessGrantPrincipal | undefined {
  return resolveTestbedAccessGrantPrincipal({
    authenticationEnabled: getAuthenticationEnabled(),
    principal: readUsableBearerPrincipal(getAuthToken()),
  });
}
