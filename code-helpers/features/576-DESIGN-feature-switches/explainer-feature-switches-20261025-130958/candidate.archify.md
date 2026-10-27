# Feature switches in Miroir: where they stand and what blocks profiles {#feature-switches-576}

Miroir has seven kinds of switch, and only process capabilities behave like a switch system. Even those are declared in seven places, gate without unloading, and freeze at process start. A plain runtime needs one declaration per switch that joins **hide, refuse and load**. Gradual enablement also needs values that change after start.

- Adding one capability touches three ML schema copies, two code sites, a fail-closed constant and a hand-written doc table.[](source:analysis)
- Only `ai` ties its switch to a lazy chunk; `designerTools` hides menus but its route still renders, and `mcp` off still imports `miroir-mcp`.
- Viewing a report instance renders `TypedValueObjectEditor`, so a plain runtime would still load Formik and the ML editor stack.
- Values are global booleans read once at start, while a dark launch needs scopes, states and change without restart.

@answer scope="Survey of _integration at c61c724 · 2026-10-25 · no decision taken · bundle savings not measured"
@meta locale=en
@source analysis title="576 analysis: inventory and first roadblocks" path=code-helpers/features/576-DESIGN-feature-switches/analysis.md
@source issue title="Issue #576: industrialize feature switches" url=https://github.com/miroir-framework/miroir/issues/576
@source caps title="processCapabilities.ts" path=packages/miroir-core/src/1_core/processCapabilities.ts
@source capsdoc title="process-capabilities.md" path=docs/reference/process-capabilities.md
@source bundle title="bundle-policy.json" path=packages/miroir-standalone-app/bundle-policy.json

## Which kinds of switch exist today? {#kinds}

The word "feature" covers seven mechanisms with different owners and lifetimes. Only the first three decide what code a process carries.

| Kind | Who sets it | When it can change | Example |
| --- | --- | --- | --- |
| Load boundary | the code, by dynamic `import()` | on first use | 11 lazy routes in `PageDispatcher.tsx`, `ensureYamlParser()` |
| Build profile | the build, by `define` or alias | per build | `MIROIR_IS_SANDBOX`, `nodeStoreStub.js` |
| Process capability | the environment `features` | at process start {caution:Frozen} | `ai`, `mcp`, `designerTools` |
| Access right | Admin `MiroirRight` | at runtime {good:Live} | designer tools with authentication on |
| Application mode | SelfApplication row | at runtime {good:Live} | `versioningMode` |
| UI toggle | `sessionStorage` | per tab | `showModelTools`, `showDebugInfo` |
| Diagnostic | environment variable | at process start | `MIROIR_EVOLUTION_TRACE` |

UI toggles and diagnostics are not feature switches. The analysis lists them so the G6 decision excludes them explicitly.

## How does a process capability travel from config to gate? {#capability-path}

@architecture id=capability-flow title="Process capability path (#273)"
| envfile | environments/env.json | external | source:analysis |
| resolver | miroir-env resolver | backend |
| snapshot | getProcessCapabilities | backend | source:caps |
| http | GET /capabilities | cloud |
| ui | UI hides what is off | frontend |
| dc | DomainController | backend |
| refuse | FeatureUnavailable | security |
| chunk | Lazy chunk (ai only) | frontend |
| envfile > resolver | features |
| resolver > snapshot | MiroirConfigServer |
| snapshot > http | snapshot |
| http > ui | fetch |
| snapshot > dc | set |
| dc > refuse | assert | security |
| ui > chunk | ai on | dashed |

@steps id=capability-steps
| s1 | environments/env.json | Declares `ai`, `mcp`, `agentBackend`, `agentModel`, `designerTools`. Test environments declare none. | capability-flow | envfile |
| s2 | getProcessCapabilities | Applies defaults and vetoes in code, once at start. The sandbox veto on `ai` works only because the sandbox computes its own snapshot. | capability-flow | snapshot |
| s3 | GET /capabilities | Serves the snapshot over HTTP, `RestClientStub` or Electron IPC. The UI keeps the copy fetched before login. | capability-flow | http |
| s4 | FeatureUnavailable | `assertProcessCapability` refuses leftover actions with an `Action2Error`. | capability-flow | refuse |
| s5 | Lazy chunk (ai only) | The only place where "off" also means "not loaded", written by hand twice. | capability-flow | chunk |

## Does "off" mean hidden, refused and not loaded? {#three-legs}

For a plain runtime the three must coincide at one seam. Today each capability covers a different subset.

| Capability | Hidden | Refused | Not loaded |
| --- | --- | --- | --- |
| `ai` | AppBar icons | route not mounted | client and server chunks {good:Yes} |
| `mcp` | MCP runners | `runMcpToolRunner` | static import in `server.ts` {bad:No} |
| `agentBackend` | backend picker | `/api/copilotkit` 403 | only the picked SDK {good:Yes} |
| `designerTools` | AppBar, model menus | Transformer Builder URL still renders {bad:No} | ships in the main build {bad:No} |
| store types | backend picker | `createStore` | on demand in Electron, all at start on the server {caution:Split} |

## Why is a plain runtime not a matter of turning switches off? {#runtime-editor}

Viewing code depends on editing code, and two bundling choices keep the editor in the eager path.

@architecture id=runtime-coupling title="What a report page drags in"
| report | Report instance page | frontend |
| section | ReportSectionEntityInstance | frontend |
| tvoe | TypedValueObjectEditor | frontend |
| formik | Formik context | frontend |
| mlstack | ML element editor stack | frontend |
| entry | Entry chunk | cloud | source:bundle |
| metamodel | miroir-app-miroir deployment | database |
| core | miroir-core single bundle | backend |
| report > section | renders |
| section > tvoe | display | emphasis |
| tvoe > formik | useFormikContext |
| tvoe > mlstack | imports |
| entry > metamodel | eager, 3.4 MB cap | emphasis |
| entry > core | splitting off |

@steps id=coupling-steps
| c1 | TypedValueObjectEditor | 11 modules render it, including instance display and report inputs. A plain runtime needs a read-only display module with a small interface. | runtime-coupling | tvoe |
| c2 | ML element editor stack | `components/ValueObjectEditor/` holds 9189 lines of TSX. | runtime-coupling | mlstack |
| c3 | miroir-app-miroir deployment | The meta-model sits in the entry chunk, MiroirTest component test instances included. | runtime-coupling | metamodel |
| c4 | miroir-core single bundle | tsup with `splitting: false` inlines its own dynamic imports, so core editing logic cannot become a lazy chunk without a subpath entry or package split. | runtime-coupling | core |

@callout level=open-question title="How much would a plain runtime save?"
Nobody knows yet. The first measurement is a bundle report of the home page plus a report page, designer tools off versus on.

## Where could a switch value come from? {#value-levels}

A dark launch needs values that change after start and vary by scope. Admin data already does that for rights and application modes, but some switches decide what to load before Admin opens.

@workflow id=value-levels-flow title="Candidate value levels (one reading of F2 and F3)"
| lane build | Build time |
| lane boot | Process start |
| lane run | Runtime |
| profile | Build profile ceiling | backend | build |
| env | Environment features | external | boot |
| boot | Boot-time switches | backend | boot |
| admin | Admin switch rows | database | run |
| scoped | Scoped value | frontend | run |
| profile > env | bounds |
| env > boot | resolves |
| boot > admin | opens Admin |
| admin > scoped | user, app, share | emphasis |

@steps id=level-steps
| l1 | Build profile ceiling | `define` constants per profile (`runtime`, `platform`, `sandbox`) let Rollup drop code. Without a ceiling rule, an environment could turn on code the build removed. | value-levels-flow | profile |
| l2 | Boot-time switches | Switches that choose chunks or stores must be known before Admin opens: the boot-order problem #321 settled for environments. | value-levels-flow | boot |
| l3 | Admin switch rows | Follows the `MiroirRight` and SelfApplication precedents: model data, editable at runtime, scoped. | value-levels-flow | admin |

| Need for gradual enablement | Today |
| --- | --- |
| Change without restart | "Restart the process after you edit flags" {bad:Missing} |
| Scope: user, role, application, share of users | process-wide; only rights and application rows vary {caution:Partial} |
| States beyond on and off: dark, preview | booleans {bad:Missing} |
| Owner and removal date per switch | none; the `features.cursor` alias shows the cost {bad:Missing} |
| Audit of who turned it on | none {bad:Missing} |

## Which roadblock blocks which goal? {#roadblocks}

Roadblocks are ordered by when the work hits them. B1 is the prerequisite and the cheapest; B3 is the largest and has no quick fix.

| Roadblock | Blocks | Decision frame |
| --- | --- | --- |
| B1 No single declaration | G6 one place, G7 visible state | F1 {caution:First} |
| B2 Gating and loading separate | G1 plain runtime, G3 pay on use | F1, F4 |
| B3 Runtime and editor mixed | G1, G2 editing platform | F4 {bad:Largest} |
| B4 One build carries everything | G1, G4 dark launch | F3 |
| B5 Frozen, global, boolean | G4, G5 gradual enablement | F2, F5 |
| B6 Scattered environment detection | G1, G7 | F3 |
| B7 Tests run defaults only | G4 | F6 |
| B8 Docs drift | G7 | F1, derived doc table |

@facts
| B6 detection sites | 4 sites, 3 different tests for Electron or sandbox |
| B7 test environments | `test-*` declare no `features`: `ai` and `mcp` off, `designerTools` on |
| B8 drifts | `dev` sets `agentBackend: "claude"`; Electron main config comes from the `desktop` environment since #345 |

## What are the open decisions? {#frames}

| Frame | Question | Options |
| --- | --- | --- |
| F1 | What is a switch? | extend `ProcessCapabilities`; a registry module in `miroir-core`; an Entity in the meta-model |
| F2 | Where do values live? | environment only; environment plus Admin rows; external flag service behind an adapter |
| F3 | Build profile versus capability | runtime only; profile is the ceiling; one build per environment |
| F4 | Runtime and editor seam | lazy editor behind a display module; separate `miroir-runtime` and `miroir-designer` packages; lazy routes only |
| F5 | First runtime scopes | user, role, application, deployment, share of users |
| F6 | CI rule for dark launch | which switch profiles nonreg runs; whether a new switch defaults off |

## What comes next? {#next}

- [ ] Confirm goals G1 to G7.
- [ ] Settle F1 to F6, starting with F1 because B1 gates the rest.
- [ ] Measure B3: bundle report of home plus report page, designer tools off versus on.
- [ ] Fix the two doc drifts in `process-capabilities.md`.
- [ ] Write `tdd-implementation-plan.md` once the frames are settled.
