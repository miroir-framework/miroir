import { existsSync } from "fs";
import path from "path";

/**
 * Where the server reads its configuration file from when no environment is selected (#323).
 *
 * - `--config <path>` given: `<path>`, relative to the working directory (or absolute).
 * - default (`../config/miroirConfig.server.json`): relative to the server module directory
 *   (`src/` or the `release/` bundle), so `packages/miroir-server/config/` in the repository;
 *   a release copied elsewhere falls back to the `release/config/` copy made by `build:release`.
 *
 * Paths are computed at runtime from parameters so that the ncc bundler does not treat them as a
 * static asset reference: ncc used to rewrite `new URL(configFilePath, import.meta.url)` into a
 * build-time copy next to the bundle, ignoring `--config`.
 */
export function resolveServerConfigFilePath(options: {
  configFilePath: string;
  configFileGiven: boolean;
  cwd: string;
  serverModuleDir: string;
  fileExists?: (p: string) => boolean;
}): string {
  const { configFilePath, configFileGiven, cwd, serverModuleDir } = options;
  const fileExists = options.fileExists ?? existsSync;
  if (configFileGiven) {
    return path.resolve(cwd, configFilePath);
  }
  const besideServerModule = path.resolve(serverModuleDir, configFilePath);
  if (fileExists(besideServerModule)) {
    return besideServerModule;
  }
  // `build:release` copies `config/` into the bundle folder: `../config/x.json` becomes `config/x.json`.
  // Kept free of string literals in the path call, which ncc would rewrite into a bundle asset path.
  const releaseCopy = path.resolve(serverModuleDir, configFilePath.replace(/^\.\.[\\/]/, ""));
  return fileExists(releaseCopy) ? releaseCopy : besideServerModule;
}
