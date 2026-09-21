import {
  readUsableBearerPrincipal,
  resolveTestbedAccessGrantPrincipal,
  type TestbedAccessGrantPrincipal,
} from "miroir-core";

import { getAuthenticationEnabled, getAuthToken } from "../4_view/auth/authSession.js";

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
