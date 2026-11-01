/**
 * Two copies of miroir-core in one JavaScript realm each have their own singletons (the configuration service, the
 * logger factory, the action implementations, the secret stores): a store registers its loggers on one copy and the
 * host starts the other, `instanceof` checks against core classes fail across copies. Each copy records itself on
 * `globalThis` when its ConfigurationService module is evaluated, and warns when another copy is there (#645).
 */

/** Key of the record of loaded miroir-core copies on `globalThis`; `Symbol.for` makes every copy share it. */
export const MIROIR_CORE_INSTANCES = Symbol.for("miroir-core.instances");

/**
 * One entry of the record. Contract shared by every core version: entries may gain fields, never change type.
 */
export interface MiroirCoreInstance {
  version: string;
  /** The module URL of the copy, without query or hash (Vite HMR adds `?t=…`), or "unknown". */
  location: string;
}

function locationOf(moduleUrl: string | undefined): string {
  return moduleUrl ? moduleUrl.replace(/[?#].*$/, "") : "unknown";
}

/**
 * Records this copy in `target[MIROIR_CORE_INSTANCES]` and calls `warn` when the record then holds more than one copy.
 *
 * Every evaluation is a copy: outside dev tooling an ES module is evaluated once per module-map key, so a second
 * evaluation is a second set of singletons, even from the same file. Under dev tooling (Vite dev and HMR, vitest),
 * modules are evaluated again on purpose: there, one location is one copy.
 *
 * Never throws: a value under the key that is not an array (written by a core with another contract) is reported
 * and left untouched.
 */
export function registerMiroirCoreInstance(
  version: string,
  moduleUrl: string | undefined,
  devTool: boolean,
  target: object,
  warn: (message: string) => void,
): void {
  const existing: unknown = Reflect.get(target, MIROIR_CORE_INSTANCES);
  if (existing !== undefined && !Array.isArray(existing)) {
    warn(
      `miroir-core ${version}: unrecognised record of loaded copies under Symbol.for("miroir-core.instances"); ` +
        "copies of miroir-core cannot be counted.",
    );
    return;
  }
  const instances: MiroirCoreInstance[] = existing ?? [];
  if (existing === undefined) {
    Reflect.set(target, MIROIR_CORE_INSTANCES, instances);
  }
  const location = locationOf(moduleUrl);
  if (devTool && instances.some((instance) => instance.location === location)) {
    return;
  }
  instances.push({ version, location });
  if (instances.length < 2) {
    return;
  }
  warn(
    `miroir-core: ${instances.length} copies are loaded in this process: ` +
      instances.map((instance) => `${instance.version} at ${instance.location}`).join(", ") +
      ". Each copy has its own configuration service, loggers, action implementations and secrets: what is " +
      "registered on one copy is missing from the other, and instanceof checks fail across copies. " +
      "Install a single miroir-core (npm ls miroir-core).",
  );
}
