# TypeScript smells

Each entry: what it looks like, why it hurts, the fix, when to leave it, and how lint treats it. Names in the snippets are illustrations unless an entry cites them as a sanctioned form. Repository examples with line numbers are in the [analysis](../../../code-helpers/features/340-FEATURE-code-quality-skill/analysis.md).

## swallowed-error

A `catch` whose body only logs, or an empty `.catch(() => {})`. Execution goes on as if the call had worked.

**Why.** The caller sees success and fails later, somewhere else, with another error. A store whose `open()` logged a failed connection and returned `ACTION_OK` hides the real cause from every status check above it.

**Fix.** In code that returns an action result, return an `Action2Error`. Elsewhere, rethrow with the cause.

```ts
// Before
public async open(): Promise<Action2VoidReturnType> {
  try {
    await this.sequelize.authenticate();
  } catch (error) {
    log.error("Unable to connect", this.schema, error);
  }
  return ACTION_OK;
}

// After
public async open(): Promise<Action2VoidReturnType> {
  try {
    await this.sequelize.authenticate();
  } catch (error) {
    log.error("Unable to connect", this.schema, error);
    return new Action2Error("FailedToOpenStore", String(error));
  }
  return ACTION_OK;
}
```

```ts
} catch (error) {
  throw new Error(`could not load deployment ${deploymentUuid}`, { cause: error });
}
```

Sanctioned form: `SqlDbAdminStore.createStore` returns `new Action2Error("FailedToCreateStore", String(error))`.

**Leave it** when a failure must not fail the caller and a comment says so, as in `DomainController.notifyInstanceActionListeners` ("A failing listener is logged: it never fails the action it listens to"). For an expected error (a collection that does not exist yet), test for that error and rethrow the others.

**Lint.** Lens only for a catch that only logs: a selector cannot read the policy comment. A catch that throws a new error without `{ cause }` is an error (`preserve-caught-error`).

## precedence-trap

`??` mixed with a comparison: `a ?? "build" == step` parses as `a ?? ("build" == step)`.

**Why.** The line reads right and runs wrong; the tests that cover it usually take the `??` fallback path.

**Fix.** Parenthesise the intended operand.

```ts
// Before: any interpolation value counts as "build"
if ((transformer as any)["interpolation"] ?? "build" == "build") {
// After
if ((transformer.interpolation ?? "build") == "build") {
```

**Lint.** Error (`no-mixed-operators` with the `??` and comparison group). Both findings were bugs, fixed by #476.

## positional-mixup

Two or more `Uuid` parameters (or parameters named `…Uuid`) in one positional list. `Uuid` is `string`, so swapped or shifted arguments compile. This is where primitive obsession bites in Miroir.

**Why.** A call that passes `deploymentUuid` where the signature expects `application` type-checks and runs on the wrong deployment.

**Fix.** Pass the uuids by name in one object.

```ts
// Before: the dispatcher passes 10 arguments, so deploymentUuid lands in `application`
type Handler = (step: Step, /* … 8 more … */ application?: Uuid, applicationDeploymentMap?: ApplicationDeploymentMap, deploymentUuid?: Uuid) => Result;
handler(step, /* … */ reduxDeploymentsState, deploymentUuid);

// After
type Handler = (step: Step, /* … */ scope: { application?: Uuid; applicationDeploymentMap?: ApplicationDeploymentMap; deploymentUuid?: Uuid }) => Result;
handler(step, /* … */ { deploymentUuid });
```

**Leave it** in a two-parameter helper whose call sites pass variables named like its parameters.

**Lint.** Lens only.

## module-state

Module-level `let`, `Map`, `Set`, or empty object filled at run time; a mutable static field, lazy singletons included; an exported `…ForTests` function that resets any of these.

**Why.** Every importer shares one copy. A setter creates call-order rules ("call X before Y"). Two instances in one process collide: an emulated server runs a client and a server cache side by side. Tests reset the state by hand and leak it when they forget. A lazy singleton keeps the arguments of its first call: `ViewParamsUpdateQueue.getInstance(config, domainController)` ignores both on every later call.

**Fix.** Keep the state in an instance that the composition root builds and passes in; a test builds its own. #339 did this for the external service client:

```ts
// Before: ExternalServiceClient.ts
const oauth2TokenCache = new Map<string, CachedToken>();
let persistRotatedSecret: PersistRotatedSecret | undefined;
export function setPersistRotatedSecret(f: PersistRotatedSecret) { persistRotatedSecret = f; }
export function clearExternalServiceTokenCacheForTests() { oauth2TokenCache.clear(); }

// After: the state is an environment, built per controller by 5_setup
export interface ExternalServiceEnvironment {
  readonly fetch: OutboundFetch;
  readonly tokenCache: ExternalServiceTokenCache;
  readonly persistRotatedSecret?: PersistRotatedSecret;
}
const client = createExternalServiceClient(defaultExternalServiceEnvironment({ fetch: fakeFetch }));
```

**Leave it** for the logger (`let log`, see `code-style.md`, and `MiroirLoggerFactory`'s process-wide registry), constants, a stable empty reference (`const EMPTY_ROWS = []`, names starting with `empty`, `default` or `none` are skipped), and a memo of a pure function that no test needs to reset.

**Lint.** Lens only.

## timing

Debounce or throttle, `setTimeout(…, 0)`, a timer inside an effect. AGENTS.md: "Debouncing is usually a sign of bad design; find the design fix first".

**Why.** The order of work depends on speed instead of on the event that makes the work valid. Tests need waits; a fast user lands in the window; a slow machine reorders steps.

**Fix.** Find the event the timer stands for, and act on it.

| Timer | Usually stands for | Do instead |
|---|---|---|
| debounce before pushing form values to a context | "the user finished editing" | push on blur, submit or an explicit save |
| `setTimeout(…, 0)` before reading state | "after React committed" | the effect or callback that runs after the commit, or the action's returned promise |
| timer on `mousemove` | "once per frame" | `requestAnimationFrame` |

```ts
// Before: a "throttle" that is a debounce: while the mouse moves, every call cancels the last one
if (throttleTimer) clearTimeout(throttleTimer);
throttleTimer = setTimeout(() => setCurrentWidth(clamp(window.innerWidth - e.clientX)), 16);

// After
cancelAnimationFrame(frame);
frame = requestAnimationFrame(() => setCurrentWidth(clamp(window.innerWidth - e.clientX)));
```

**Leave it** when time is the feature: a polling interval, a toast that hides itself, the test sandbox's step delay.

**Lint.** Lens only.

## duplicated-logic

A file with the same name and at least 90% of the same lines in another package. Often a leftover of a package split.

**Why.** A fix lands in one copy. The copies drift apart, and the next reader cannot tell which one is meant.

**Fix.** Keep one module, in the lowest package both copies depend on, and import it. `miroir-standalone-app` depends on `miroir-react`, so a theme file shared by both lives in `miroir-react`. When neither package depends on the other, move the module to `miroir-core`.

**Leave it** for files under 20 lines (one-line `constants.ts` files are alike by design; the runner skips them).

**Lint.** Runner only (it compares files across packages).

## type-escape

`any`, `as any`, and double casts (`as unknown as T`, `as any as T`).

**Why.** The compiler checks nothing at that point, and nothing downstream of it. Bugs hide behind the escape: the precedence traps above sit behind `(transformer as any)`.

**Fix.** Fix the type at its source. At a boundary (JSON import, HTTP response, store row), validate with the Zod schema generated from the ML schema; the generated schemas are named after their types (`metaModel` for `MetaModel`).

```ts
// Before
const libraryModel = libraryModelJson as unknown as MetaModel;
// After: `metaModel` is the generated Zod schema of MetaModel, exported by miroir-core
const libraryModel: MetaModel = metaModel.parse(libraryModelJson);
```

```ts
// Before
const interpolation = (transformer as any)["interpolation"];
// After
const interpolation = "interpolation" in transformer ? transformer.interpolation : undefined;
```

**Leave it** at an import boundary where a comment says why the cast is needed, as `Model.ts` does for the default meta-model (without it, declaration emit loses the type).

**Lint.** A double cast is an error (`miroir/type-escape`); existing ones are counted in `eslint-suppressions.json`. `no-explicit-any` is off in `eslint.config.mjs` (thousands of violations); the lens reports it.

## long-parameter-list

More than 5 parameters.

**Why.** Callers pass `undefined` placeholders to reach a later slot, and slots shift (see `positional-mixup`).

**Fix.** An options object for the optional tail; split the function when the parameters serve different jobs.

```ts
// Before
handleAction(action, applicationDeploymentMap, undefined, undefined, undefined, principal);
// After
handleAction(action, applicationDeploymentMap, { principal });
```

**Lint.** Lens (`lens/max-params` 5: `max-params`, reporting the whole parameter list).

## boolean-flag

A parameter typed `boolean`, or defaulted to `true` or `false`, next to other parameters.

**Why.** The call site reads `f(x, true)`: the reader has to open `f` to learn what `true` means, and `f` does two jobs.

**Fix.** Two functions, or a named option.

```ts
// Before
queue.queueUpdate(update, true);
// After
queue.queueUpdate(update);
queue.flushImmediately();
// or
queue.queueUpdate(update, { immediate: true });
```

**Leave it** in a platform signature you implement or forward (`addEventListener(type, handler, true)`), in component props, which are named at the call site, and in a one-parameter function whose boolean is the value it sets (`setShowTypes(show: boolean)`), which the lens skips.

**Lint.** Lens only.

## deep-nesting

Blocks nested more than 4 deep. AGENTS.md: "Early returns over deep nesting".

**Fix.** Return early on the exceptional case; extract a loop body into a named function.

```ts
// Before
for (const deployment of deployments) {
  if (deployment.model) {
    if (deployment.model.entityVersions) {
      for (const version of deployment.model.entityVersions) { /* … */ }
    }
  }
}
// After
for (const deployment of deployments) {
  indexEntityVersions(deployment.model?.entityVersions ?? []);
}
```

**Lint.** Error (`max-depth` 4); existing violations are counted in `eslint-suppressions.json`.

## dead-code

Commented-out code (3 or more lines that read as code), unused variables, files nothing renders or imports.

**Why.** Searches and reviews wade through code that does not run, and it rots: commented-out code no longer compiles against today's types. Git keeps the history.

**Fix.** Delete it. For a dead file, delete the file and the import that keeps it alive; a test that reaches a live function through the dead file imports the function's own module instead. A file named `…DEFUNCT` or `…DEPRECATED` that is still imported is not dead: either finish removing it or drop the suffix.

**Leave it** for a short `// e.g. f(x)` inside an explanation, and for a doc comment's `@example`.

**Lint.** `no-unused-vars` is off in `eslint.config.mjs`; the lens reports it, and the runner reports commented-out blocks.
