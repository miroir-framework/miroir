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

- industrialization: **creating a clean build / Continuous Integration environment**, having serverless tests pass on CI platform
- industrialization: adding custom logger, configurable each software layer.
- factored Rest service in webapp and server: **almost** the same code is executed in both cases.
- consolidation: various refactorings / simplifications / cleanup.

- 

## 2023-12

### studies & design

- evaluating architectural concepts for Domain level: Deployments, Bundles, Actions and Endpoints.


### development: 52 commits (miroir)

- **refactor domain level: introducing Actions and Endpoints**.
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

- added initial version of **Miroir Query Language (MQL)**!!! Queries!
- have Query interface on REST
- implement basic blocs for alterEntityAttribute ModelAction
- refactor existing code to ModelActions (tbc.)

## 2024-03

### studies & design

### development: 48 commits (miroir)

- added **many-to-many joins in MQL**
- Refactor ("simplify") LocalStoreController and DomainController: use ModelActions (continued), **start using DomainController on Server**
- started using styled components
- Display based on JzodSchema: JzodElementEditor, MtableComponent

## 2024-04

### studies & design

Try to answer:
- what is a Miroir Application?
- what is Miroir Action Script (MAS)?

### development: 48 commits (miroir)

- **create & deploy a new application** ([EXPERIMENT: create & deploy a new Application](https://github.com/miroir-framework/miroir/issues/26))

## 2024-05

### studies & design

### development: 15 commits (miroir)

- initialization of **Miroir Action Script (MAS)** ([EXPERIMENT: create basic elements for Miroir Action Script (MAS), migrate Tools.submit to MAS #28](https://github.com/miroir-framework/miroir/issues/28))
- GUI: taking the decalred JzodSchema of an element to facilitate editing this element [Form / JzodElementEditor: allow to extend an Entity Instance based on the Entity's known structure #29](https://github.com/miroir-framework/miroir/issues/29)

## 2024-06

### studies & design

### development: 16 commits (miroir), 7 commits (Jzod), 5 commits (Jzod-ts),

- released Jzod 0.7.0 started 0.8.0: carry-on types, heteronomous unions [add carry-on types and manyfold object union types #8](https://github.com/miroir-framework/jzod/issues/8)
- migrate Miroir to Jzod 0.7.0
- **added QueryTemplates**: generate queries from parameters, using carryOn types.

## 2024-07

### studies & design

### development: 13 commits (miroir)

- Miroir Action Script
- 
## 2024-08

### studies & design

The Extractor / Combiner / Transformer architecture for Queries.

### development: 26 commits (miroir)

- Miroir Action Script: implement extractors on many storages (sql, filesytem, indexedDb), separate joins (combiners) from extractors
- **added count / unique / distinct / goup by / order by operations for MQL (in-memory)**

## 2024-09

### studies & design

Using Transformers in Queries: pure functions (Transformers) shall be used everywhere needed (Actions, Queries, Templates), no other computational mechanism shall exist.

### development: 26 commits (miroir)

- MAS

## From now on, the main topic becomes PRAGMATIC aspects:

- what is the shape of the MAS / MQL, especially regarding to their use of Transformers, and the use of Transformers in general?
- How to chain (ie compose via Composite) Actions?
- how can tests be included in the development process, in and out of the GUI?
- how do Actions and Queries interact with Transactions? What constitutes an Applicative Transaction, at Miroir Level?


## 2024-10

### studies & design


### development: 32 commits (miroir)

- [FEATURE: execute Queries on relational database #10](https://github.com/miroir-framework/miroir/issues/10)
- [EXPERIMENT: create basic elements for Miroir Action Script (MAS), migrate Tools.submit to MAS #28](https://github.com/miroir-framework/miroir/issues/28)


## 2024-11

### studies & design


### development: 26 commits (miroir)

- [FEATURE: allow to compose CompositeActions #38](https://github.com/miroir-framework/miroir/issues/38)
- removed QueryTemplates, parameterization of Queries shall happen through Transformers.

## 2024-12

### studies & design


### development: 43 commits (miroir)

- [FEATURE: add run-time Tests #16](https://github.com/miroir-framework/miroir/issues/16)
- [REFACTOR: refactor existing tests to elicit test interface #39](https://github.com/miroir-framework/miroir/issues/39)



## 2025-01

### studies & design

Practical issue: too many logs when running integration tests!

### development: 31 commits (miroir)

- [REFACTOR: refactor existing tests to elicit test interface #39](https://github.com/miroir-framework/miroir/issues/39)
- [FEATURE: have "business"-oriented log management #42](https://github.com/miroir-framework/miroir/issues/42)

## 2025-02

### studies & design


### development: 25 commits (miroir)

- [FEATURE: execute Queries on relational database #10](https://github.com/miroir-framework/miroir/issues/10)

## 2025-03

### studies & design


### development: 30 commits (miroir)

- [push Transformers to 1st class citizen and create Menu Transformer, with miroir-core implementation #36](https://github.com/miroir-framework/miroir/issues/36)
- [FEATURE: execute Queries on relational database #10](https://github.com/miroir-framework/miroir/issues/10)

## 2025-04

### studies & design


### development: 54 commits (miroir)

- Added Transformer Implementation, that can be "libraryImplementation" or "transformer" [push Transformers to 1st class citizen and create Menu Transformer, with miroir-core implementation #36](https://github.com/miroir-framework/miroir/issues/36)
- [FEATURE: allow to compose CompositeActions #38](https://github.com/miroir-framework/miroir/issues/38)
-


## 2025-05

### studies & design

### development: 41 commits (miroir)

- Make applicative.Library.integ.test with CreateNewEntity action executable from the standalone webapp and the Vitest CLI [#50 FEATURE: enable the creation of custom actions in MAS](https://github.com/miroir-framework/miroir/issues/50)
- Refactored MAS execution pipeline to support async/await for custom actions.
- Added support for dynamic registration of Transformers at runtime.
- Improved MAS/Query integration tests to cover error propagation and rollback scenarios.

## 2025-06 (AI generated, it looks good but relevance & representativity are a bit difficult to assess)

### studies & design

- Explored advanced MAS extensibility patterns and error propagation strategies.
- Designed improved rollback and transactional semantics for MAS/Query integration.

### development: 38 commits (miroir)

- Enabled dynamic registration and execution of custom MAS actions.
- Refactored MAS execution pipeline to fully support async/await and transactional rollbacks.
- Improved error handling and propagation in MAS and Query workflows.
- Added new integration and regression tests for MAS and Query scenarios.
- Enhanced MAS/Query developer experience with better test coverage and debugging support.

## 2025-07 (AI generated, it looks good but relevance & representativity are a bit difficult to assess)

### studies & design

- Focused on MAS/Query stability, performance, and developer tooling.
- Designed advanced composition scenarios for MAS and Query.

### development: 29 commits (miroir)

- Continued MAS and Query integration, addressing edge cases and improving stability.
- Enhanced logging and debugging tools for MAS/Query execution.
- Added support for advanced Query/Action composition and chaining.
- Optimized MAS execution for better performance in large workflows.
- Updated documentation and provided new usage examples for MAS/Query features.

# AI Analysis of the document, run 2025/08/08

## prompt (Claude Sonnet 6.7 Thinking)
can you check for inconsisencies between the works.md and the git history of the repo? It's not relevant if a described activity starts a bit early compared to the time given for it, or ends a bit after. Are there any "major" activities missing in the descriptions?

## Analysis of works.md vs Git History
After comparing the works.md file with the git history, I don't see any major inconsistencies or missing activities. The works.md document provides a good high-level summary of the development activities that are reflected in the git commit history.

Here are some observations:

1. The timeline progression in works.md aligns well with the commit history, showing the evolution from:

   *  Basic entity concepts to model historization
   *  Development of Jzod as a meta-language
   *  Implementation of MQL (Miroir Query Language)
   *  Development of MAS (Miroir Action Script)
   *  Work on Extractors/Combiners/Transformers
   *  CompositeActions implementation
   *  Test infrastructure improvements

2. The commit messages show detailed implementation of the high-level goals described in works.md. For example:

   * The MAS development spans multiple months (May 2024 onward) with numerous commits
   * The evolution of query handling from simple queries to templates to transformer-based approach
   * The progression of the testing framework

3. The commit volume generally aligns with what's described in works.md (e.g., 43 commits for 2024-01, 48 for 2024-04, etc.)

All major architectural shifts and feature implementations mentioned in the git history appear to be captured in the works.md document at an appropriate level of abstraction.