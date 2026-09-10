/**
 * Pure CLI parse for miroir-server (issue #267 D4).
 * Extracted so SecretStore tests can live in miroir-core.
 */

export class ParseServerArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseServerArgsError";
  }
}

export type ParsedServerArgs = {
  configFilePath: string;
  certsDir?: string;
  certFile?: string;
  keyFile?: string;
  help: boolean;
  secrets: Record<string, string>;
  secretsMasterKey?: string;
};

const DEFAULT_CONFIG_FILE_PATH = "../config/miroirConfig.server.json";
const SECRET_ENV_PREFIX = "MIROIR_SECRET_";

const USAGE =
  "Usage: node server.js [--config <path>] [--certsdir <dir>] [--cert <path>] [--key <path>] [--secret <name>=<value>] [--secrets-master-key <value>] [--disable-auth] [--enable-auth] [-h|--help]";

function requireValue(args: string[], index: number, flag: string): { value: string; nextIndex: number } {
  if (index + 1 >= args.length) {
    throw new ParseServerArgsError(`Error: ${flag} requires an argument.\n${USAGE}`);
  }
  return { value: args[index + 1], nextIndex: index + 1 };
}

function parseSecretAssignment(raw: string): { name: string; value: string } {
  const eq = raw.indexOf("=");
  if (eq <= 0 || eq === raw.length - 1) {
    throw new ParseServerArgsError(
      `Error: --secret requires <name>=<value> (got ${JSON.stringify(raw)}).\n${USAGE}`,
    );
  }
  const name = raw.slice(0, eq);
  const value = raw.slice(eq + 1);
  if (!name || !value) {
    throw new ParseServerArgsError(
      `Error: --secret requires <name>=<value> (got ${JSON.stringify(raw)}).\n${USAGE}`,
    );
  }
  return { name, value };
}

function secretsFromEnv(env: NodeJS.ProcessEnv | undefined): Record<string, string> {
  if (!env) {
    return {};
  }
  const secrets: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(SECRET_ENV_PREFIX) || value === undefined || value === "") {
      continue;
    }
    const name = key.slice(SECRET_ENV_PREFIX.length);
    if (name) {
      secrets[name] = value;
    }
  }
  return secrets;
}

/**
 * Parse server CLI tokens (already sliced past node + script).
 * Env fallback: MIROIR_SECRET_<NAME>. CLI --secret wins over env.
 * Wrapping key: --secrets-master-key > env MIROIR_SECRETS_MASTER_KEY.
 */
export function parseServerArgs(
  argv: string[],
  env?: NodeJS.ProcessEnv,
): ParsedServerArgs {
  const result: ParsedServerArgs = {
    configFilePath: DEFAULT_CONFIG_FILE_PATH,
    help: false,
    secrets: secretsFromEnv(env),
  };
  const envMasterKey = env?.MIROIR_SECRETS_MASTER_KEY;
  if (envMasterKey) {
    result.secretsMasterKey = envMasterKey;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--config") {
      const next = requireValue(argv, i, "--config");
      result.configFilePath = next.value;
      i = next.nextIndex;
    } else if (arg === "--certsdir") {
      const next = requireValue(argv, i, "--certsdir");
      result.certsDir = next.value;
      i = next.nextIndex;
    } else if (arg === "--cert") {
      const next = requireValue(argv, i, "--cert");
      result.certFile = next.value;
      i = next.nextIndex;
    } else if (arg === "--key") {
      const next = requireValue(argv, i, "--key");
      result.keyFile = next.value;
      i = next.nextIndex;
    } else if (arg === "--secret") {
      const next = requireValue(argv, i, "--secret");
      const assignment = parseSecretAssignment(next.value);
      result.secrets[assignment.name] = assignment.value;
      i = next.nextIndex;
    } else if (arg === "--secrets-master-key") {
      const next = requireValue(argv, i, "--secrets-master-key");
      result.secretsMasterKey = next.value;
      i = next.nextIndex;
    } else if (arg === "--disable-auth" || arg === "--enable-auth") {
      // consumed by resolveAuthenticationEnabled(process.argv)
    } else if (arg.startsWith("-")) {
      throw new ParseServerArgsError(`Error: Unknown option: ${arg}\n${USAGE}`);
    }
  }

  return result;
}
