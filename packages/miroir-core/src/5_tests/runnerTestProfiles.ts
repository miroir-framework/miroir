export type RunnerTestProfile = {
  miroirConfigFilename: string;
  logConfigFilename: string;
};

export const RUNNER_TEST_PROFILES: Record<string, RunnerTestProfile> = {
  //  TODO: miroirConfigFilename in packages/miroir-standalone-app 
  //  TODO: logConfigFilename in packages/miroir-standalone-app 
  "emulatedServer-sql": {
    miroirConfigFilename: "./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json",
    logConfigFilename:
      "./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json",
  },
};

export function applyRunnerTestProfile(profileName: string | undefined): void {
  if (!profileName) {
    return;
  }
  const profile = RUNNER_TEST_PROFILES[profileName];
  if (!profile) {
    throw new Error(`Unknown runner test profile: ${profileName}`);
  }
  if (!process.env.VITE_MIROIR_TEST_CONFIG_FILENAME) {
    process.env.VITE_MIROIR_TEST_CONFIG_FILENAME = profile.miroirConfigFilename;
  }
  if (!process.env.VITE_MIROIR_LOG_CONFIG_FILENAME) {
    process.env.VITE_MIROIR_LOG_CONFIG_FILENAME = profile.logConfigFilename;
  }
}
