# Architecture Overview

Miroir follows a layered, domain-driven design (Clean / Hexagonal). Implementation dependencies flow **down** (`3_controllers` may use `2_domain` and `1_core`; `1_core` must not import implementations from layer 3). Interfaces may be referenced in both directions.

```
0_interfaces/  → types and Jzod schemas
1_core/        → tools, constants, domain state
2_domain/      → selectors, transformers, query runners
3_controllers/ → DomainController, ActionRunner
4_services/    → persistence stores, REST, logging
4_views/       → UI
5_setup/       → composition / wiring
```

Runtime is **two DomainControllers** (client + server) sharing the same action types. The client owns a **localCache** (Redux or Zustand) and talks to persistence through a REST facade. The server owns **PersistenceStoreController** instances and the storage backends (Postgres, filesystem, IndexedDB, MongoDB, bundled).

How those pieces talk depends on **action** and **profile**. Rather than one encyclopedic data-flow chapter, internals are documented as **action workflows**: one action, one profile, with log signatures.

## Action workflows

| Document | Action | Profile | Status |
|----------|--------|---------|--------|
| [runBoxedQueryAction on emulated server](architecture/workflows/runQuery-emulated-server.md) | `runBoxedQueryAction` / `compositeRunBoxedQueryAction` | `emulatedServer-sql` | First note — template for the series |

Later notes will cover other actions (`rollback`, `commit`, instance CRUD), other emulated backends, and `realServer-*`.

## Related

- [Core Concepts](core-concepts.md) — Entity, Query, Transformer, Action, Report
- [Data architecture and deployments](../reference/data-architecture-deployments.md) — model vs data, store layout
- [Testing reference](../reference/testing.md) — `emulatedServer-*` vs `realServer-*` profiles
- [Query API](../reference/api/query.md) — query shapes (sketch)
