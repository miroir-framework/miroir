/**
 * #318: the integration profile a test was launched with (`testByFile --profile <name>` sets
 * MIROIR_TEST_PROFILE). Tests that load a profile by name use it instead of a hardcoded one,
 * so a filesystem run does not reach Postgres.
 */
export const DEFAULT_LAUNCH_PROFILE_NAME = "emulatedServer-sql";

export function resolveLaunchProfileName(env: NodeJS.ProcessEnv = process.env): string {
  return env.MIROIR_TEST_PROFILE || DEFAULT_LAUNCH_PROFILE_NAME;
}
