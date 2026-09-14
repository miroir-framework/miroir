/**
 * Fail-loud check that `@cursor/sdk` can be resolved on the persistence process.
 * Electron packaged builds skip shipping natives in #275; this throws instead of
 * failing later inside a dynamic import.
 */

import { existsSync } from "node:fs";
import { createRequire } from "node:module";

export type AssertCursorSdkPackagedOptions = {
  existsSync?: (path: string) => boolean;
  resolveSdkPath?: () => string | undefined;
};

export function resolveCursorSdkPackageEntry(): string | undefined {
  try {
    const require = createRequire(import.meta.url);
    return require.resolve("@cursor/sdk");
  } catch {
    return undefined;
  }
}

export function assertCursorSdkPackaged(options: AssertCursorSdkPackagedOptions = {}): void {
  const resolveSdkPath = options.resolveSdkPath ?? resolveCursorSdkPackageEntry;
  const pathExists = options.existsSync ?? existsSync;
  const sdkPath = resolveSdkPath();
  if (!sdkPath || !pathExists(sdkPath)) {
    throw new Error(
      "Cursor SDK is not packaged: could not resolve @cursor/sdk package entry" +
        (sdkPath ? ` at ${sdkPath}` : "") +
        ". Packaged Electron builds must ship @cursor/sdk natives (via miroir-ai) or leave features.cursor off.",
    );
  }
}
