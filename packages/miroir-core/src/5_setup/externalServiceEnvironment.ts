import type {
  ExternalServiceClientInterface,
  ExternalServiceEnvironment,
} from "../0_interfaces/4-services/ExternalServiceClientInterface.js";
import {
  createExternalServiceClient,
  createExternalServiceTokenCache,
} from "../4_services/ExternalServiceClient.js";
import { resolveSecret } from "../4_services/SecretStore.js";

/**
 * The environment of a process's external service client (#339): the global fetch, the process
 * secrets, a token cache of its own and no insecure base URL, unless the composition root says
 * otherwise.
 */
export function defaultExternalServiceEnvironment(
  overrides: Partial<ExternalServiceEnvironment> = {},
): ExternalServiceEnvironment {
  return {
    fetch: (input, init) => globalThis.fetch(input, init),
    resolveSecret,
    tokenCache: createExternalServiceTokenCache(),
    insecureBaseUrls: [],
    ...overrides,
  };
}

/** A client on `defaultExternalServiceEnvironment(overrides)`. */
export function defaultExternalServiceClient(
  overrides: Partial<ExternalServiceEnvironment> = {},
): ExternalServiceClientInterface {
  return createExternalServiceClient(defaultExternalServiceEnvironment(overrides));
}
