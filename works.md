# The Miroir Framework creation process




## 2022-11

### studies & design (2022-11 / 2022-12)

- discovering React: principles (Components, hooks,...), doing tryouts, tutorials, etc.
- studying React / Webapp architecture: with / without global store, etc.
- studying global store solutions: Redux, Zustand, etc. (opting for Redux / Sagas in first approximation)
- studying persistence solutions: GraphQL (Apollo implementation)
- finding a display grid solutions: opting for [Ag-grid](https://npmjs.com/package/ag-grid-react)
- finding a solution for serverless deployment & REST stub for testing : [MSW](https://www.npmjs.com/package/msw) (comes in handy for testing also)
- architecture studies: [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design), [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)...

### development: 12 commits

- repo creation
- **adding simple concepts: Entities, Reports, Instances**
- **no persistence at all**, data is kept in (temporary) memory, reloaded anew on each page reload
- **using Redux / thunk to fetch data**
- no Rest server access: MSW provides the stub, returned data is hard-coded

## 2022-12

### studies & design

finding transparent access to IndexedDb in browser and nodejs: using [level](https://www.npmjs.com/package/level)

### development: 9 commits

- creating first Slice tests at Saga level
- considering Json Schemas for data / Entity validation (will be reverted to Jzod later on)
- migrating to Redux Sagas for asynchronous data fetching
- **adding undo / redo to webapp**
- **adding persistence in browser's IndexedDb, accessed through (stubbed) REST calls.**

## 2023-01

### studies & design

- finding a way to execute user-level asynchronous code / inject data into pages for rendering / having a service-like interface (analog to Angular services): using [redux-saga-promises](https://www.npmjs.com/package/redux-saga-promises)
- finding a solution for package organization: **going for mono-repo**, using [Lerna](https://www.npmjs.com/package/lerna) (the "old school" way, before Nx, without npm workspaces) 
- understanding dataflow for updates in React

### development: 32 commits

- **refactoring to "clean" architecture** (on-going effort):
  - creating first packages: miroir-core and miroir-react.
  - adding controllers, separating RemoteDataPersistenceStoreController / LocalDataPersistenceStoreController / "what would become the domain" layers.
  - **refactoring to use Promises at user / client level in the webapp**
- **first try of interactive data edition in webapp.**
- created tests at Redux Slice level, then **creating first "integration"-level tests** at react level (integration tests will be used from now on, until 2023-11)
- adding ConfigurationService and MiroirContext for injecting selfApplication parameters, etc.
- LocalDataPersistenceStoreController allows to load persisted state through REST call

## 2023-02

### studies & design

**Determine which operations shall be transactional or not**; this question will remain partially unanswered for several months, until 2023-05 / 2023-06

### development: 26 commits

- **creating Domain Layer / interface: DomainController**, first attempt at DSL for Model edition (create, update, delete Entity)
- adding Author / Book running example for interactive and automated tests.
- adding domain-level transactions: **rollback, commit.**
- further separating into packages: miroir-redux (creating corresponding interfaces in miroir-core)
- Separating transactional / non-transactional operations

## 2023-03

### studies & design

- Determine **how to maximize code reuse between webapp and server**
- Determine how to connect to Relational database on server side, without the need to provide a static model at startup

### development: 18 commits

- using MSW on server side, first tries of webapp/server connexion (REST)
- using IndexedDb (through "level" library) on server side
- **using [Sequelize](https://www.npmjs.com/package/sequelize) to connect server to Relational Database**
- add database clear and initialization operations: creating "clean" data structures needed to persist Entities, Reports, Instances...
- make integration-level tests work with relational DB (postgres) in addition to IndexedDb
- create empty, error-generating implementation of miroir-datastore-postgres for use in the webapp (the webapp has the dependency, but can not access a database)
- **allowing to rename entities: indexation by uuid**

## 2023-04

### studies & design

Figure out needs for model evolution: entities definitions may have many versions, thus there exist model versions, one may migrate from one version to a later one...

### development: 36 commits

- **adding Model historization: one entity can have many EntityDefinitions, grouped into ModelVersions**
- added Model entities: SelfApplication, ApplicationVersion, ApplicationModelBranch, SelfApplicationDeploymentConfiguration.
- creating EntityViewer to display the details of the definition of an Entity
- **creating miroir-store-filesystem**

## 2023-05

### studies & design

Figure out how validation and modeling itself could benefit from use of a common meta-language; as Typescript types provide a complete-enough meta-language, looking for a way to
express type-related logic at run-time. This led to the use of [Zod](https://www.npmjs.com/package/zod). 

### development: 37 commits

- **storing model and data in different schemas** (postgres) or different databases (indexedDb) or different directories (filesystem) for a deployment
- refactor miroir-store-postgres, miroir-store-filesystem and miroir-store-indexedDb to mixins, avoiding some code duplication.
- starting to use [Zod](https://www.npmjs.com/package/zod) for data validation

## 2023-06

Note: took 1 week off.

### studies & design

Design a bootstrapped meta-language to describe Entites, Reports, etc. This will lead to Jzod (see below).

### development: 34 commits

- prototyping: creating Entity / Entity Definition from Excel Sheet (all columns are converted to string type)
- refactor: converting "static" hand-written TS types (for Entity, Entity Definition, Report, etc.) to Zod.
- **adding routes / routing / Links in webapp, to display many pages**
- **Enhanced capacities of Report display in webapp, adding ReportPage function component**

## 2023-07

### studies & design

Foresee possible uses of Jzod.

### development: 24 commits (miroir), 7 commits (jzod)

- **release of [Jzod](https://www.npmjs.com/package/jzod) 0.1**
- migrate existing plain editor to using jzod schemas
- **using "clean" code for data handling and transformation**: unit-tested reducers / hooks for domain operations are defined exploiting data coming from Redux. There is no external dependencies in this code.

## 2023-08

### studies & design

Global review of approach, reframed for the use of a meta-language (Jzod).

### development: 17 commits (miroir), 7 commits (jzod), 2 commits (jzod-ts)

- **allowing Jzod Schema display and Jzod Schema interactive edition in webapp**
- jzod: added support for types: intersection, map, promise, set, tuple. Added "nullable" property.
- jzod: added zodToJzod conversion function.


## 2023-09

### studies & design

### development: 22 commits (miroir), 8 commits (jzod), 12 commits (jzod-ts)

- **release of [Jzod](https://www.npmjs.com/package/jzod) and [Jzod-ts](https://www.npmjs.com/package/jzod-ts), version 0.5.X.**
- Jzod: added support for object "extends" clause, added support for strict and non-strict objects.
- using Jzod in Report Definitions: separating display aspects (creating the "display" DSL) and the specification of data to be fecthed for the report (creating the "Data fetch" DSL).
- create domainSelector.unit.test.ts, **first domain-level unit test**

## 2023-10

### studies & design

### development: 27 commits (miroir)

- **compute and display first data cross-join in webapp, implemented in domain layer**
- refactor: push domain layer implementation into miroir-core (used through hooks in React webapp).
- consolidation, solved platform technical issues.
- migrating to Vite for webapp build and vitest for webapp tests.
  

## 2023-11

### studies & design

- industrialization: selecting technologies for a Continuous Integration environment: Docker, Jenkins, Docker-in-Docker ("did"), Verdaccio
- release preparation: initiating a retrospective document (this document)

### development: 109 commits (miroir)

- industrialization: **creating a clean compilation / Continuous Integration environment**, having serverless tests pass on CI platform
- industrialization: adding custom logger, configurable each software layer.
- factored Rest service in webapp and server: **almost** the same code is executed in both cases.
- consolidation: various refactorings / simplifications / cleanup.

- 

## 2023-12

### studies & design

- evaluating architectural concepts for Domain level: Deployments, Bundles, Actions and Endpoints.


### development: 52 commits (miroir)

- refactor domain level: introducing Actions and Endpoints.
- transferring store parameters to client-defined configuration.
- first version of "delpoyApplication" action.
- technical: using vite 4.5, tsup for build.

## 2024-01

Remark: started teaching the "Website design & implementation" class.

### studies & design

Look for a "ubiquitous" query language, that can be executed on client, server and (relational) database or NoSQL (as background maintenance job)

### development: 43 commits (miroir)

## 2024-02

Remark: continued teaching the "Website design & implementation" class.

### studies & design

### development: 77 commits (miroir)

- Miroir Query Language!!! Queries!
- have Query interface on REST
- implement basic blocs for alterEntityAttribute ModelAction
- refactor existing code to ModelActions (tbc.)

## 2024-03

### studies & design

### development: 34 commits (miroir)

- Refactor ("simplify") LocalStoreController and DomainController: use ModelActions (continued)
- started using styled components
- 
