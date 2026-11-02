# How does Miroir load and manage its client cache today? {#miroir-cache-today}

The client keeps one Redux local cache per browser. A **refresh loads whole deployments eagerly**, reports fill only lazy entities on demand, and **writes update the cache in place without a refetch**.

- A `rollback` reads every model entity and every data entity whose `cache.cacheAllInstancesOnRefresh` is not `false`, one read per entity.[](source:refresh-loop)
- Only `Blob` and `PageLoadMeasurement` opt out today; a report fills them through `ReportQueryLoadService`, full, projected or by primary key.[](source:report-loader)
- A plain instance write goes to the store first, then the same action is applied to the cache; a transactional write stays in the cache until `commit`.[](source:write-through)
- Every cache write replaces the `current` object, so every memoized query selector recomputes.[](source:selectors)

@answer scope="Client local cache (miroir-localcache-redux) at commit fd3d979 on _integration. Server-side store caches out of scope. Line numbers from that commit. Re-render cost is read from the code, not measured."
@meta locale=en
@source cache-state title="Local cache state shape: loading / current zones, undo history" path=packages/miroir-core/src/0_interfaces/2_domain/LocalCacheInterface.ts lines=25:83
@source cache-key title="Cache key: deploymentUuid_section_entityUuid[__partial]" path=packages/miroir-core/src/2_domain/ReduxDeploymentsState.ts lines=11:19
@source segment title="Segment header: full / partial, fresh / stale" path=packages/miroir-core/src/1_core/localCache/localCacheSegment.ts lines=6:27
@source refresh-policy title="resolveEntitiesToFetchOnRefresh and the cacheAllInstancesOnRefresh rule" path=packages/miroir-core/src/1_core/localCache/cacheRefreshPolicy.ts lines=21:147
@source refresh-loop title="DomainController: one read per entity, then loadNewInstancesInLocalCache and rollback" path=packages/miroir-core/src/3_controllers/DomainController.ts lines=895:975
@source rollback-reducer title="LocalCacheSlice rollback: drop the deployment from current, merge loading" path=packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts lines=896:919
@source load-reducer title="loadNewEntityInstancesInLocalCache writes both loading and current" path=packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts lines=441:511
@source undo-reducer title="UndoRedoReducer: rollback and commit clear the undo history" path=packages/miroir-localcache-redux/src/4_services/localCache/UndoRedoReducer.ts lines=236:266
@source startup title="fetchMiroirAndAppConfigurations: Admin rollback, then one rollback per deployment" path=packages/miroir-react/src/services/ConfigurationService.ts lines=289:310
@source page-config title="usePageConfiguration: auto-fetch once per SPA lifetime" path=packages/miroir-react/src/services/usePageConfiguration.ts lines=117:128
@source refresh-button title="AppBar sync button reruns the full configuration fetch" path=packages/miroir-react/src/components/Page/AppBar.tsx lines=736:743
@source report-view title="ReportViewWithEditor builds the load request and ensures it" path=packages/miroir-react/src/components/Reports/ReportViewWithEditor.tsx lines=169:215
@source ensure-hook title="useEnsureReportQueryLoaded: effect keyed by service and fingerprint" path=packages/miroir-react/src/components/Reports/useEnsureReportQueryLoaded.ts lines=27:55
@source report-loader title="ReportQueryLoadService.ensureLoaded: single flight, sufficiency check, sticky error" path=packages/miroir-core/src/2_domain/ReportQueryLoadService.ts lines=105:160
@source load-executor title="createReportQueryLoadExecutor: per-target reads, then a direct cache load" path=packages/miroir-core/src/2_domain/createReportQueryLoadExecutor.ts lines=174:356
@source lazy-selector title="Lazy entity absent from cache reads as an empty index" path=packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts lines=405:424
@source write-through title="handleInstanceAction: write the store, then apply to the cache" path=packages/miroir-core/src/3_controllers/DomainController.ts lines=1370:1421
@source tx-action title="handleTransactionalInstanceAction: cache only" path=packages/miroir-core/src/3_controllers/DomainController.ts lines=4054:4080
@source commit title="commit: replay the undo history to the store" path=packages/miroir-core/src/3_controllers/DomainController.ts lines=2252:2441
@source strategies title="queryExecutionStrategy: localCacheOrFail default, ServerCache and localCacheOrFetch throw" path=packages/miroir-core/src/3_controllers/DomainController.ts lines=1134:1146
@source selectors title="Query selectors take the whole current object as input" path=packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSliceSelectors.ts lines=215:232
@source list-display title="ReportSectionListDisplay builds a new selector map on each render" path=packages/miroir-react/src/components/Reports/ReportSectionListDisplay.tsx lines=243:254
@source entity-cache title="Entity meta-class: the cache.cacheAllInstancesOnRefresh attribute" path=packages/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json lines=166:193
@source server-env title="Server: the local cache is never loaded; ServerModelEnvironments caches the model" path=packages/miroir-core/src/4_services/ServerModelEnvironments.ts lines=43:49
@source autocommit title="autocommit after UI actions flagged autocommitFromUI" path=packages/miroir-core/src/3_controllers/DomainController.ts lines=256:259

## Which parts hold and move cached data? {#parts}

@architecture id=cache-parts title="Client cache: readers, writers and the store path"
| ui | React reports | frontend | source:report-view |
| sel | Memoized selectors | frontend | source:selectors |
| loader | ReportQueryLoadService | frontend | source:report-loader |
| dc | Client DomainController | backend | source:refresh-loop |
| cache | Redux LocalCache | database | source:rollback-reducer |
| saga | PersistenceReduxSaga | backend | source:load-executor |
| server | REST server | backend | source:server-env |
| stores | Persistence stores | database | source:write-through |
| ui > sel | select | |
| sel > cache | read current | |
| ui > loader | ensureLoaded | |
| loader > saga | read missing | |
| loader > cache | load instances | emphasis |
| ui > dc | actions | |
| dc > saga | store actions | |
| dc > cache | cache actions | emphasis |
| saga > server | HTTP | |
| server > stores | read / write | |

@steps id=parts-steps
| s-cache | Redux LocalCache | Holds a `loading` zone, a `current` zone and an undo history. Readers only see `current`. | cache-parts | cache |
| s-sel | Memoized selectors | Run queries synchronously over `current`. A missing lazy entity reads as an empty index, not an error. | cache-parts | sel |
| s-dc | Client DomainController | Owns full refreshes (`rollback`), writes and `commit`. It is the only writer apart from the report loader. | cache-parts | dc |
| s-loader | ReportQueryLoadService | Fetches what a report needs and is missing, then writes it straight into the cache. | cache-parts | loader |
| s-server | REST server | Answers reads from the stores. Its own LocalCache is never loaded. | cache-parts | server |

@facts
| Cache key | `deploymentUuid_section_entityUuid`, plus `__partial` for projected rows |
| Sections | `model`, `data`, `modelVersion`, `devData` |
| Segment header | `full` or `partial`, `fresh` or `stale` |
| Per-entity policy | `Entity.cache.cacheAllInstancesOnRefresh`, default `true` |

## What happens on startup or refresh? {#refresh}

@sequence id=refresh-flow title="Full refresh of one deployment (rollback)"
| actor page | Page (usePageConfiguration) | frontend | source:page-config |
| actor cfg | ConfigurationService | frontend | source:startup |
| actor dc | DomainController | backend | source:refresh-loop |
| actor store | Persistence store | database | source:write-through |
| actor cache | LocalCache | database | source:rollback-reducer |
| phase | Startup or AppBar sync button |
| page | cfg | fetchMiroirAndAppConfigurations |
| cfg | dc | rollback Admin, then one per deployment |
| phase | Per deployment |
| dc | store | read Entity list |
| store | dc | Entity rows | return |
| dc | store | one read per model entity |
| dc | store | one read per eager data entity |
| store | dc | all instances | return |
| dc | cache | loadNewInstancesInLocalCache | emphasis |
| dc | cache | rollback: loading replaces current | emphasis |
| cache | page | new current, selectors rerun | return |

@steps id=refresh-steps
| r-start | ConfigurationService | Runs once per SPA lifetime on the first page mount, or again on the AppBar sync button. It loads every deployment listed in Admin. | refresh-flow | cfg |
| r-reads | Persistence store | Each read is `GET /CRUD/{deployment}/{section}/entity/{entity}/all`. Model entities are always read in full. | refresh-flow | store |
| r-load | LocalCache | One action loads every collection into `loading` and `current`. The reducer then drops the deployment's keys from `current` and merges `loading`. | refresh-flow | cache |

The refresh is all-or-nothing per deployment. The local `rollback` also clears the undo history, so it discards uncommitted changes. Switching deployment in the UI triggers no load.[](source:undo-reducer)

## How does a report fill a lazy entity? {#report-load}

@sequence id=report-load-flow title="Report-triggered load of a missing entity"
| actor rv | ReportViewWithEditor | frontend | source:report-view |
| actor sel | Selectors | frontend | source:lazy-selector |
| actor svc | ReportQueryLoadService | frontend | source:report-loader |
| actor srv | REST server | backend | source:load-executor |
| actor cache | LocalCache | database | source:load-reducer |
| rv | sel | useQueryTemplateResults |
| sel | cache | read current |
| cache | sel | empty index for lazy entity | return |
| rv | svc | ensureLoaded(fingerprint) |
| svc | cache | segment sufficient? |
| cache | svc | missing or stale | return |
| svc | srv | one read per target |
| srv | svc | instances | return |
| svc | cache | loadNewInstancesInLocalCache | emphasis |
| cache | sel | new current, recompute | return |
| sel | rv | rows | return |

@steps id=report-load-steps
| l-fp | ReportQueryLoadService | Keys each request by a fingerprint of report, query, params and projection. One request per key runs at a time. | report-load-flow | svc |
| l-skip | LocalCache | A fresh segment of the right kind, and the row for a primary-key target, makes the load a no-op. | report-load-flow | cache |
| l-read | REST server | Instance-list targets use a full or projected read. Primary-key targets run a `storage` query merged into the segment. | report-load-flow | srv |
| l-done | Selectors | The loader writes the cache directly, with no `rollback`, so the report re-renders from the selector. | report-load-flow | sel |

@callout level=note title="External extractors bypass the cache"
| A query on an external data source runs on the server with the `storage` strategy. Its result is kept in the service's per-fingerprint map, not in the cache. |

## What happens to the cache on a write? {#writes}

@workflow id=write-flow title="Write paths through the cache"
| act | UI action | frontend |
| tx | Transactional? | backend |
| wstore | Write store first | database |
| apply | Apply to current | database |
| patch | Apply with undo patch | database |
| commit | Commit | backend |
| replay | Replay to store | database |
| clear | Clear undo history | backend |
| act > tx | |
| tx > wstore | no |
| wstore > apply | ok |
| tx > patch | yes |
| patch > commit | auto or manual |
| commit > replay | |
| replay > clear | |

| Write | Store | Cache | Undo history |
| --- | --- | --- | --- |
| `createInstance`, `updateInstance`, `deleteInstance` | Written first | Same action applied to `current` after success | Not recorded |
| `transactionalInstanceAction` (model edits from the UI) | Not touched until `commit` | Applied at once | Patch recorded |
| `commit` | Replays the recorded actions | Unchanged | Cleared |
| `rollback` | Read again | Deployment replaced | Cleared |

Neither path refetches after the write. UI actions flagged `autocommitFromUI` are committed at once, so model edits from the UI reach the store without a manual commit.[](source:autocommit) Writes from another client or process never reach this cache until the next full refresh.

## When is the cache read, and what re-renders? {#reads}

| `queryExecutionStrategy` | Behaviour on the client | Status |
| --- | --- | --- |
| `localCacheOrFail` | Runs over the cache `DomainState` | Default {good:Implemented} |
| `storage` | Runs on the server over the stores | Used by loaders and services {good:Implemented} |
| `localCacheOrFetch` | Would read the cache, then fetch on a miss | {bad:Throws} |
| `ServerCache` | Would use a server-side cache | {bad:Throws} |

The two unimplemented strategies are already declared in the schema, so they are a natural extension point.[](source:strategies)

Reports read through `createSelector` selectors whose first input is the whole `current` object. Any cache write therefore recomputes every mounted query selector, and a new result object re-renders its component.[](source:selectors) No cache keyed by query exists; the `queriesResultsCache` field is reset on each action but has no reader. `ReportSectionListDisplay` also creates a new selector map on every render, so its memoization never hits.[](source:list-display)

## Where are the gaps for the target evolutions? {#gaps}

| Goal | Today | Gap |
| --- | --- | --- |
| Load only the needed data | Per-entity opt-out, eager by default. Model always full. Every deployment loaded at startup. | {caution:Coarse} No per-page or per-query scope at startup; reads fetch `/all` without filter or paging. |
| Refresh only when needed | Own writes patch the cache in place. Full refresh only on startup, the sync button or a runner `rollback`. | {bad:Blind} No staleness signal for other clients' writes. A refresh drops the deployment's report-loaded segments, which then load again. |
| Smooth UX | Report shows a loading message per fingerprint. Sync selectors stay quiet for lazy entities. | {caution:Re-renders} Any cache write recomputes all selectors. A failed load stays failed for its fingerprint, without retry. |
| Server reuse | Server `LocalCache` exists but is never loaded. `ServerModelEnvironments` caches models and forgets them on writes. | {caution:Unused} `ServerCache` strategy throws; no shared server-side instance cache.[](source:server-env) |

@callout level=open-question title="Points to check before building on this"
| The rollback reducer merges the whole `loading` zone, for all deployments, then empties it. Startup runs one rollback per deployment in parallel. This is safe only while each deployment's load and rollback run back-to-back; it is not covered by a test. |
| `UndoRedoReducer` handles `commit` itself and never calls the slice's `commit` branch, so that branch is dead under Redux. |
| A comment in `saveInstanceFromUI.ts` says the user commits model changes, but `autocommitFromUI` commits them at once. |

## What to decide next {#next}

- [ ] Decide the loading unit: entity (today), report query, or page. Then decide whether startup loads only the active deployment.
- [ ] Decide how staleness is detected: per-segment `freshness` on server change, version stamps, or a push channel.
- [ ] Keep report-loaded segments across a `rollback`, or mark them `stale` instead of dropping them.
- [ ] Implement `localCacheOrFetch` as the single entry point for "read cache, fetch on miss".
- [ ] Narrow selector inputs to the needed cache keys, so a write to one entity re-renders only its readers.
- [ ] Add a retry path for a failed report load.
