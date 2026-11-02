/**
 * The providers a component reading the Admin ViewParams (`useAdminViewParams`) needs in a test:
 * `LocalCacheProvider` on a local cache holding the ViewParams, and `MiroirContextReactProvider`.
 * The Miroir context and domain controller default to those of `buildAdminViewParamsHarness`; a
 * test that runs actions passes its own.
 */
import React, { useState } from "react";

import type { DomainControllerInterface } from "@miroir-framework/core";
import { LocalCacheProvider, MiroirContextReactProvider } from "@miroir-framework/react";

import { buildAdminViewParamsHarness } from "./adminViewParamsHarness";

// #656: the redux local cache; Slice 4 makes the test helpers follow MIROIR_TEST_LOCAL_CACHE
import { localCacheBinding as reduxLocalCacheBinding } from "@miroir-framework/react/local-cache/redux";
export const AdminViewParamsProviders: React.FC<{
  children: React.ReactNode;
  viewParams?: Record<string, unknown>;
  miroirContext?: React.ComponentProps<typeof MiroirContextReactProvider>["miroirContext"];
  domainController?: DomainControllerInterface;
}> = ({ children, viewParams = {}, miroirContext, domainController }) => {
  const [harness] = useState(() => buildAdminViewParamsHarness(viewParams));
  return (
    <LocalCacheProvider binding={reduxLocalCacheBinding} store={harness.localCache.getInnerStore()}>
      <MiroirContextReactProvider
        miroirContext={miroirContext ?? harness.miroirContext}
        domainController={domainController ?? harness.domainController}
      >
        {children}
      </MiroirContextReactProvider>
    </LocalCacheProvider>
  );
};
