import type {
  DomainControllerInterface,
  ExternalServiceClientInterface,
  MiroirContext,
  RestClientInterface,
  RestPersistenceClientAndRestClientInterface,
} from "miroir-core";
import * as LocalCacheRedux from "miroir-localcache-redux";

// #446: the LocalCache implementation the tests build their DomainControllers on, chosen by
// MIROIR_TEST_LOCAL_CACHE (set by `run-nonreg.py --local-cache`). Unset means redux.

export const LOCAL_CACHE_ENV = "MIROIR_TEST_LOCAL_CACHE";
export const localCacheImplementations = ["redux", "zustand"] as const;
export type LocalCacheImplementation = (typeof localCacheImplementations)[number];

/** What the test setup takes from a LocalCache package: the signatures both packages accept. */
export interface LocalCacheImplementationModule {
  setupMiroirDomainController: (
    miroirContext: MiroirContext,
    // zustand takes the "local" and "remote" modes only
    persistenceParams: Exclude<
      Parameters<typeof LocalCacheRedux.setupMiroirDomainController>[1],
      { persistenceStoreAccessMode: "none" }
    >,
    externalServiceClient?: ExternalServiceClientInterface,
  ) => DomainControllerInterface;
  RestPersistenceClientAndRestClient: new (
    rootApiUrl: string,
    restClient: RestClientInterface,
  ) => RestPersistenceClientAndRestClientInterface;
}

function localCacheEnvValue(): string | undefined {
  return typeof process !== "undefined" ? process.env?.[LOCAL_CACHE_ENV] : undefined;
}

/** The implementation a MIROIR_TEST_LOCAL_CACHE value names. */
export function testLocalCacheImplementation(value: string | undefined): LocalCacheImplementation {
  if (!value) {
    return "redux";
  }
  if (!(localCacheImplementations as readonly string[]).includes(value)) {
    throw new Error(
      `${LOCAL_CACHE_ENV}=${value} is not a LocalCache implementation, use one of: ${localCacheImplementations.join(", ")}`,
    );
  }
  return value as LocalCacheImplementation;
}

// A computed specifier keeps zustand out of the webapp bundle, which reaches this file through the
// Miroir Tests UI: the browser has no MIROIR_TEST_LOCAL_CACHE, so it always runs on redux.
const zustandPackage = "miroir-localcache-zustand";

/** Redux is already in the bundle; zustand is loaded only when chosen. */
export async function loadLocalCacheImplementation(
  implementation: LocalCacheImplementation = testLocalCacheImplementation(localCacheEnvValue()),
): Promise<LocalCacheImplementationModule> {
  if (implementation === "zustand") {
    return await import(/* @vite-ignore */ zustandPackage);
  }
  return LocalCacheRedux;
}
