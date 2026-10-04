# Layering smells

AGENTS.md, section "Architecture", defines the layers (`0_interfaces` to `5_setup`): interface dependencies may flow both ways, implementation dependencies flow downwards only. A **composition root** is where the object graph is built and the process environment is read: `5_setup/`, the runtimes' startup files (`index`, `main`, `server`, `cli`, `setup`, `storeStartup`, …) and the standalone app's `miroir-fwk/4-tests/`, which builds test sessions. The exact list is `ROOTS` in `eslint-rules/smell-lens.config.mjs`. Names in the snippets are illustrations unless an entry cites them as a sanctioned form.

## upward-import

A lower layer imports an implementation from a higher one, such as `3_controllers` importing a function from `4_services`.

**Why.** The lower layer can no longer be built, tested or reused without the higher one, and import cycles follow.

**Fix.** Depend on an interface in `0_interfaces` and receive the implementation from the composition root; or move the implementation down to the layer that uses it. #339 did the first for `DomainController`:

```ts
// Before: 3_controllers/DomainController.ts
import { executeExternalServiceOperation } from "../4_services/ExternalServiceClient";

// After: the controller receives a client built on an environment
constructor(/* … */ private externalServiceClient: ExternalServiceClientInterface) {}
```

**Lint.** Error (`miroir/layers`, `eslint-rules/miroir-layers.mjs`); type-only imports and the logger are allowed; existing violations are counted in `eslint-suppressions.json`, so a fix needs `npx eslint packages --prune-suppressions`.

## global-environment

`process.env` read outside a composition root.

**Why.** The value cannot differ between two instances in one process or between two tests; tests set and restore `process.env` by hand; the browser bundle needs a shim for `process`.

**Fix.** The composition root reads the environment once (the environment files of #321, or a variable at startup) and passes the value in.

```ts
// Before: 1_core
export function getMiroirSchemaMode(): MiroirSchemaMode {
  return process.env.MIROIR_SCHEMA_MODE === "frozen" ? "frozen" : "runtime";
}

// After: the root decides, the library receives
export function resolveSchema(deployment: Deployment, options: { schemaMode: MiroirSchemaMode }) { /* … */ }
```

**Leave it** in composition roots (the lens skips them) and in build tooling.

**Lint.** Lens only.

## wiring

A core service (`DomainController`, `PersistenceStoreController…`, `MiroirContext`, `MiroirEventService`, `MiroirActivityTracker`, `LocalCache`, `RestClient`) built with `new` outside a composition root.

**Why.** Each place that builds its own instance decides what it is connected to; a caller cannot tell which instance it got, and a test cannot substitute one.

**Fix.** Build it in the composition root and pass it to the code that uses it.

```ts
// Before: a helper in 4_services builds its manager from a global singleton
const manager = new PersistenceStoreControllerManager(
  ConfigurationService.configurationService.adminStoreFactoryRegister, /* … */
);

// After: the root builds the manager; the helper receives it
export async function mountApplicationDeployment(manager: PersistenceStoreControllerManagerInterface, /* … */) { /* … */ }
```

**Leave it** in a factory whose job is to build these objects (`PersistenceStoreControllerManager` creates a controller per deployment), and in a test building its system under test.

**Lint.** Lens only.
