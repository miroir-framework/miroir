import { parseProfileArg } from "miroir-core";

import { applyIntegrationTestProfile } from "../tests/helpers/integrationTestProfiles.js";

/** Remove `--profile` / `-p` pairs from argv before forwarding to vitest (Gap D5). */
export function stripProfileArgs(argv: string[]): string[] {
  const result: string[] = [];
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--profile" || arg === "-p") {
      index++;
      continue;
    }
    result.push(arg);
  }
  return result;
}

export function prepareTestByFileLaunch(
  env: NodeJS.ProcessEnv,
  argv: string[],
): { vitestArgs: string[]; spawnEnv: NodeJS.ProcessEnv } {
  applyIntegrationTestProfile(parseProfileArg(argv));
  return {
    vitestArgs: stripProfileArgs(argv),
    spawnEnv: {
      ...env,
      VITE_TEST_MODE: "true",
    },
  };
}
