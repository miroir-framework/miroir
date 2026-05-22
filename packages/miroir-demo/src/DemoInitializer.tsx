/**
 * DemoInitializer
 *
 * Renders nothing but triggers an automatic fetch of Miroir & App configurations
 * the first time the demo application mounts.  Must be placed inside
 * <MiroirContextReactProvider> so the hooks it uses are available.
 */
import { usePageConfiguration } from "@miroir-app/miroir-fwk/4_view/services/index.js";

export function DemoInitializer(): null {
  usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Demo configurations loaded",
    actionName: "demo startup configuration fetch",
  });
  return null;
}
