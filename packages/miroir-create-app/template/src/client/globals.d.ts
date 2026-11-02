import type { MiroirConfigClient } from "@miroir-framework/core";

declare global {
  /** The client configuration of environments/local.json, injected by vite.config.ts. */
  const __MIROIR_CLIENT_CONFIG__: MiroirConfigClient;
}

declare module "*.css";
