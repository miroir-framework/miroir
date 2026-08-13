# Bundles and Versioning

Versioning in Miroir applies to the **model** (Entities, EntityVersions, Reports, Queries, Transformers, …) of applications, not to application data. Data insertions, updates and deletes are performed directly, similar to "auto-commit" mode of some RDBMS. User-controlled data versioning will be handled separately.

## Bundling

Create an Bundle Repository application, that stores bundles and sample data of applications that can be deployed.

how to distribute applications with versioned-external versioning? they must have a link to the git / github repo. Full version points to a tag for git repo reference?

Bundles can come in various flavors:

- **dev** -  one accesses full history of the application, and tests
- **prod** - "clean" version without versioning history, without tests

There must be a **push** or **publish** action to the repository.

for unversioned applications, dev and prod bundles may differ by the presence of tests for the app.

One may get an prod deployment from a dev bundle by trimming (potentially) tests & versioning information.

## Versioning

A Miroir application can be created in UNVERSIONED mode. In this mode, like in a spreadsheet, any modification on the model of the application, like the data modification of its deployments, is performed instantly. There is no possibility to go back outside of using the limited undo/redo functionality.

## Versioning Use Cases

Again, versioning in Miroir applies for now to the **model** (Entities, EntityVersions, Reports, Queries, Transformers, …), not to application data. Data versioning is a separate concern.

### Model Evolution

- let model updates to an application be performed through actions of the Model Endpoint (and some others endpoints?)
- identify differences between the current model of a deployment and a previous version of the application's model (linear history)
- "Freeze" the current model of a deployment as a new model version for the application
- create migration script for both model and data to enable conversion of the model and data of a given deployment from version X of an application to version X+1
<!-- - Keep old `EntityVersion` snapshots as schema  ernal VCS (see *versioned-external*) -->

This will enable differentiated "development" and "production" environment, where developpers collaborate to create a new version of an application, that can be later used to evolve production deployments of said application.

### Deployment & Environment Promotion

- Promote a model from development → staging → production
- `versioned-external`: the external VCS (Git) is the source of truth; Miroir deployment assets (`assets/` directories) are committed like code
- `versioned-internal`: Miroir itself stores the version history in the `modelVersion` store section — useful for applications whose model is managed entirely inside the running system

### Reporting on Version History

- Query past model states (which EntityVersion was active at a given point?)
- Audit trail: which Reports / Queries / Transformers were associated with which model version
- In `versioned-external` mode: feed a GitProxy application's read-only tools into Reports to display git log, diffs, or branch topology directly in the Miroir UI

### Actions — Mapping from Git Concepts

| Git action | Miroir equivalent | Exists / To Be Implemented
|---|---|---|
| `git init` | Create a new Application deployment with a versioned store | similar to create application with versioned-external versioning |
| `git clone` | Copy a deployment's `model` + `data` store sections to a new environment | deploy existing application from repository app |
| `git commit` | "Freeze" a model as a new commit / snapshot in the `modelVersion` section | YES |
| `git checkout <branch>` | Load a different model snapshot into the active deployment | NO - for now only linear history is allowed |
| `git diff` | Compare two EntityVersion snapshots (mlSchema diffing) | TODO: internal implementation not relying on Git's |
| `git log` | List `SelfApplicationModelBranch` / version history entries | NO |
| `git merge` | Reconcile two divergent model histories (manual or tooled) | NO |
| `git push/pull` | Sync `modelVersion` section between environments (remote server mode) | NO |


### Implementation: versioned-external

- Only the **current** model is stored in Miroir; history lives in Git
- Deployment assets (`assets/miroir_model/`, `assets/miroir_data/`) are committed to the repo like source code
- A **GitProxy** application exposes Git MCP server actions as Miroir Endpoints / Runners, making git history queryable from Reports
- `ApplicationUuid` is a required payload parameter for all cross-app Queries and Actions
- Endpoint is currently hand-crafted for a known Git MCP schema; auto-discovery from MCP server metadata is a future goal

### Implementation: versioned-internal

- The full version history of the application's model is stored in the **`modelVersion` store section** of the deployment (separate from live `model` and application `data` — see [Data Architecture: Deployments](../reference/data-architecture-deployments.md#modelversion-version-history-optional))
- Meta-model Entity types that participate in freeze history are marked **`scope: "versioning"`** on their Entity row (e.g. `EntityVersion`, `SelfApplicationVersion`, `ApplicationVersionCross*`). That metadata classifies versioning infrastructure vs ordinary **`modeling`** concepts; runtime section routing currently uses an explicit UUID registry in code, not a scan of `scope`. See [Entity API — scope](../reference/api/entity.md#meta-model-classification-scope--logicaldatamodel).
- Enables in-app rollback, branching, and audit without any external VCS
- Suited for end-user applications where the model evolves at runtime (no developer Git workflow)
- Heavier storage footprint; periodic pruning of old snapshots recommended for long-lived deployments
- **Bundled (sandbox) deployments cannot persist `modelVersion` history** — the bundled Miroir profile omits the `modelVersion` store section entirely and excludes Version History instances from bundled `model`/`data`. Use filesystem, IndexedDB, MongoDB, or PostgreSQL for writable version history.
- **Git deployment assets** for `versioned-internal` applications mirror the four-folder layout: live model under `*_model/`, domain data under `*_data/`, and Version History under `*_modelVersion/` (see [Data Architecture: Deployments](../reference/data-architecture-deployments.md#deployment-package-asset-folders)).

