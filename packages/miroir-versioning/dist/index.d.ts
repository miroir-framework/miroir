import { ActionImplementationHandler, Entity, Query, RootReport, Report, Menu, EndpointDefinition, Runner, StoredMiroirTheme, TransformerDefinition, MlSchema, MiroirTestDefinition, ApplicationVersion, EntityVersion, ApplicationSection, MetaModel, EntityPresentModelDefinitionField, FreezeApplicationVersionActionPayload } from '@miroir-framework/core';

/**
 * #696: the implementation of ModelEndpoint's `freezeApplicationVersion`, moved out of core's DomainController.
 * It runs in the process that holds the stores (a remote client forwards the action), after the
 * DomainController checked the `versioning` capability, and only calls the DomainController through
 * `DomainControllerActionHost`.
 *
 * Phase 6 of #216: plan the freeze against the payload application's model, then persist the
 * SelfApplicationVersion, the historical versions and their Cross rows with createInstance.
 */

/** Freezes the application the payload names, from the model of its own deployment. */
declare const handleAction_freezeApplicationVersion: ActionImplementationHandler;

/**
 * #216 — Application Version freeze (Entities only, linear history, Option A diff).
 * #220 — Freeze-adjacent vocabulary uses EntityVersion only.
 * #227 — QueryVersion tracer (first non-Entity model element).
 * #227 — ReportVersion (second non-Entity model element).
 * #227 — MenuVersion (third non-Entity model element).
 * #227 — EndpointVersion (fourth non-Entity model element).
 * #227 — RunnerVersion (fifth non-Entity model element).
 * #227 — ThemeVersion (sixth non-Entity model element).
 * #227 — TransformerDefinitionVersion (ninth non-Entity model element).
 * #230 — MlSchemaVersion and MiroirTestVersion (full model snapshot).
 * #706 — BlobVersion, TestConfigurationVersion and TestVersion (rest of Miroir's data section).
 */

interface SnapshotOptions {
    /** UUID generator override for testing determinism. */
    newUuid?: () => string;
}
/** Live Query instance shape in MetaModel.storedQueries. */
type StoredQueryForFreeze = {
    uuid: string;
    name: string;
    definition: Query;
    description?: string;
    defaultLabel?: string;
    parentUuid?: string;
    parentName?: string;
};
/** Historical Query snapshot minted at freeze. */
type QueryVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "QueryVersion";
    name: string;
    queryUuid: string;
    definition: Query;
    description?: string;
    defaultLabel?: string;
};
/**
 * Deep-copy present-model Queries into new immutable QueryVersion instances.
 * Each output has a **new** UUID; `queryUuid` references the live Query.
 */
declare function snapshotQueriesAsHistoricalQueryVersions(queries: StoredQueryForFreeze[], options?: SnapshotOptions): QueryVersionSnapshot[];
/** Live Report instance shape in MetaModel.reports. */
type StoredReportForFreeze = {
    uuid: string;
    name: string;
    definition: RootReport;
    defaultLabel?: string;
    type?: Report["type"];
    description?: string;
    parentUuid?: string;
    parentName?: string;
};
/** Historical Report snapshot minted at freeze. */
type ReportVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "ReportVersion";
    name: string;
    reportUuid: string;
    definition: RootReport;
    defaultLabel?: string;
    type?: Report["type"];
    description?: string;
};
/**
 * Deep-copy present-model Reports into new immutable ReportVersion instances.
 * Each output has a **new** UUID; `reportUuid` references the live Report.
 */
declare function snapshotReportsAsHistoricalReportVersions(reports: StoredReportForFreeze[], options?: SnapshotOptions): ReportVersionSnapshot[];
/** Live Menu instance shape in MetaModel.menus. */
type StoredMenuForFreeze = {
    uuid: string;
    name: string;
    definition: Menu["definition"];
    defaultLabel?: string;
    description?: string;
    parentUuid?: string;
    parentName?: string;
};
/** Historical Menu snapshot minted at freeze. */
type MenuVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "MenuVersion";
    name: string;
    menuUuid: string;
    definition: Menu["definition"];
    defaultLabel?: string;
    description?: string;
};
/**
 * Deep-copy present-model Menus into new immutable MenuVersion instances.
 * Each output has a **new** UUID; `menuUuid` references the live Menu.
 */
declare function snapshotMenusAsHistoricalMenuVersions(menus: StoredMenuForFreeze[], options?: SnapshotOptions): MenuVersionSnapshot[];
/** Live Endpoint instance shape in MetaModel.endpoints. */
type StoredEndpointForFreeze = {
    uuid: string;
    name: string;
    version: string;
    application: string;
    definition: EndpointDefinition["definition"];
    description?: string;
    transactionalEndpoint?: boolean;
    parentUuid?: string;
    parentName?: string;
};
/** Historical Endpoint snapshot minted at freeze. */
type EndpointVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "EndpointVersion";
    name: string;
    endpointUuid: string;
    version: string;
    application: string;
    definition: EndpointDefinition["definition"];
    description?: string;
    transactionalEndpoint?: boolean;
};
/**
 * Deep-copy present-model Endpoints into new immutable EndpointVersion instances.
 * Each output has a **new** UUID; `endpointUuid` references the live Endpoint.
 */
declare function snapshotEndpointsAsHistoricalEndpointVersions(endpoints: StoredEndpointForFreeze[], options?: SnapshotOptions): EndpointVersionSnapshot[];
/** Live Runner instance shape in MetaModel.runners. */
type StoredRunnerForFreeze = {
    uuid: string;
    name: string;
    application: string;
    defaultLabel: string;
    description?: string;
    definition: Runner["definition"];
    parentUuid?: string;
    parentName?: string;
};
/** Historical Runner snapshot minted at freeze. */
type RunnerVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "RunnerVersion";
    name: string;
    runnerUuid: string;
    application: string;
    defaultLabel: string;
    description?: string;
    definition: Runner["definition"];
};
/**
 * Deep-copy present-model Runners into new immutable RunnerVersion instances.
 * Each output has a **new** UUID; `runnerUuid` references the live Runner.
 */
declare function snapshotRunnersAsHistoricalRunnerVersions(runners: StoredRunnerForFreeze[], options?: SnapshotOptions): RunnerVersionSnapshot[];
/** Live Theme instance shape in MetaModel.themes. */
type StoredThemeForFreeze = {
    uuid: string;
    name: string;
    defaultLabel?: string;
    description?: string;
    definition: StoredMiroirTheme["definition"];
    parentUuid?: string;
    parentName?: string;
};
/** Historical Theme snapshot minted at freeze. */
type ThemeVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "ThemeVersion";
    name: string;
    themeUuid: string;
    defaultLabel?: string;
    description?: string;
    definition: StoredMiroirTheme["definition"];
};
/**
 * Deep-copy present-model Themes into new immutable ThemeVersion instances.
 * Each output has a **new** UUID; `themeUuid` references the live Theme.
 */
declare function snapshotThemesAsHistoricalThemeVersions(themes: StoredThemeForFreeze[], options?: SnapshotOptions): ThemeVersionSnapshot[];
/** Body stored on TransformerDefinitionVersion.definition at freeze. */
type TransformerDefinitionVersionBody = {
    classification?: string;
    runnableAsSql?: boolean;
    transformerInterface: TransformerDefinition["transformerInterface"];
    transformerImplementation: TransformerDefinition["transformerImplementation"];
};
/** Live TransformerDefinition instance shape in MetaModel.transformerDefinitions. */
type StoredTransformerDefinitionForFreeze = {
    uuid: string;
    name: string;
    defaultLabel: string;
    description?: string;
    classification?: string;
    runnableAsSql?: boolean;
    transformerInterface: TransformerDefinition["transformerInterface"];
    transformerImplementation: TransformerDefinition["transformerImplementation"];
    parentUuid?: string;
    parentName?: string;
};
/** Historical TransformerDefinition snapshot minted at freeze. */
type TransformerDefinitionVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "TransformerDefinitionVersion";
    name: string;
    transformerUuid: string;
    defaultLabel: string;
    description?: string;
    definition: TransformerDefinitionVersionBody;
};
/**
 * Deep-copy present-model TransformerDefinitions into new immutable TransformerDefinitionVersion instances.
 * Each output has a **new** UUID; `transformerUuid` references the live TransformerDefinition.
 */
declare function snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(transformerDefinitions: StoredTransformerDefinitionForFreeze[], options?: SnapshotOptions): TransformerDefinitionVersionSnapshot[];
/** Live MlSchema instance shape in MetaModel.mlSchemas. */
type StoredMlSchemaForFreeze = {
    uuid: string;
    name: string;
    defaultLabel?: string;
    description?: string;
    definition?: MlSchema["definition"];
    parentUuid?: string;
    parentName?: string;
};
/** Historical MlSchema snapshot minted at freeze (#230). */
type MlSchemaVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "MlSchemaVersion";
    name: string;
    mlSchemaUuid: string;
    defaultLabel?: string;
    description?: string;
    definition?: MlSchema["definition"];
};
/**
 * Deep-copy present-model MlSchemas into new immutable MlSchemaVersion instances.
 * Each output has a **new** UUID; `mlSchemaUuid` references the live MlSchema.
 * An MlSchema without a definition is snapshotted without one: the live row allows it.
 */
declare function snapshotMlSchemasAsHistoricalMlSchemaVersions(mlSchemas: StoredMlSchemaForFreeze[], options?: SnapshotOptions): MlSchemaVersionSnapshot[];
/** Live MiroirTest instance shape in MetaModel.tests. */
type StoredMiroirTestForFreeze = {
    uuid: string;
    name?: string;
    description?: string;
    skip?: boolean;
    tags?: MiroirTestDefinition["tags"];
    issue?: string;
    definition: MiroirTestDefinition["definition"];
    parentUuid?: string;
    parentName?: string;
};
/** Historical MiroirTest snapshot minted at freeze (#230). */
type MiroirTestVersionSnapshot = {
    uuid: string;
    parentUuid: string;
    parentName: "MiroirTestVersion";
    name?: string;
    miroirTestUuid: string;
    description?: string;
    skip?: boolean;
    tags?: string[];
    issue?: string;
    definition: MiroirTestDefinition["definition"];
};
/**
 * Deep-copy present-model MiroirTests into new immutable MiroirTestVersion instances.
 * Each output has a **new** UUID; `miroirTestUuid` references the live MiroirTest.
 */
declare function snapshotMiroirTestsAsHistoricalMiroirTestVersions(tests: StoredMiroirTestForFreeze[], options?: SnapshotOptions): MiroirTestVersionSnapshot[];
/**
 * A live Blob, TestConfiguration or Test instance (#706). These are read from the store at freeze
 * time: the MetaModel has no collection for them.
 */
type StoredInstanceForFreeze = {
    uuid: string;
    parentUuid?: string;
    parentName?: string;
    parentDefinitionVersionUuid?: string;
    conceptLevel?: string;
    [attribute: string]: unknown;
};
/** Historical snapshot minted at freeze for a Blob, TestConfiguration or Test (#706). */
type InstanceVersionSnapshot<P extends string, K extends string> = {
    uuid: string;
    parentUuid: string;
    parentName: P;
} & {
    [key in K]: string;
} & Record<string, unknown>;
type BlobVersionSnapshot = InstanceVersionSnapshot<"BlobVersion", "blobUuid">;
type TestConfigurationVersionSnapshot = InstanceVersionSnapshot<"TestConfigurationVersion", "testConfigurationUuid">;
type TestVersionSnapshot = InstanceVersionSnapshot<"TestVersion", "testUuid">;
/** Deep-copy live Blobs into new BlobVersion instances; `blobUuid` references the live Blob (#706). */
declare function snapshotBlobsAsHistoricalBlobVersions(blobs: StoredInstanceForFreeze[], options?: SnapshotOptions): BlobVersionSnapshot[];
/**
 * Deep-copy live TestConfigurations into new TestConfigurationVersion instances;
 * `testConfigurationUuid` references the live TestConfiguration (#706).
 */
declare function snapshotTestConfigurationsAsHistoricalTestConfigurationVersions(testConfigurations: StoredInstanceForFreeze[], options?: SnapshotOptions): TestConfigurationVersionSnapshot[];
/** Deep-copy live Tests into new TestVersion instances; `testUuid` references the live Test (#706). */
declare function snapshotTestsAsHistoricalTestVersions(testInstances: StoredInstanceForFreeze[], options?: SnapshotOptions): TestVersionSnapshot[];
/**
 * Deep-copy present-model Entity fields into new immutable EntityVersion instances.
 * Each output has a **new** UUID; `entityUuid` references the live Entity.
 *
 * Throws if any Entity lacks `mlSchema` (incomplete present model).
 *
 * Do **not** use UUID-reuse compat helpers (e.g. presentEntityAsRedundant…) for freeze —
 * those reuse the live Entity uuid and are unsafe for historical minting (#220 / #216).
 */
declare function snapshotEntitiesAsHistoricalEntityVersions(entities: Entity[], options?: SnapshotOptions): EntityVersion[];
/** Cross row linking an Application Version to a historical EntityVersion. */
type ApplicationVersionCrossEntityVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    entityVersion: string;
};
/** Cross row linking an Application Version to a historical QueryVersion. */
type ApplicationVersionCrossQueryVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    queryVersion: string;
};
/** Cross row linking an Application Version to a historical ReportVersion. */
type ApplicationVersionCrossReportVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    reportVersion: string;
};
/** Cross row linking an Application Version to a historical MenuVersion. */
type ApplicationVersionCrossMenuVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    menuVersion: string;
};
/** Cross row linking an Application Version to a historical EndpointVersion. */
type ApplicationVersionCrossEndpointVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    endpointVersion: string;
};
/** Cross row linking an Application Version to a historical RunnerVersion. */
type ApplicationVersionCrossRunnerVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    runnerVersion: string;
};
/** Cross row linking an Application Version to a historical ThemeVersion. */
type ApplicationVersionCrossThemeVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    themeVersion: string;
};
/** Cross row linking an Application Version to a historical TransformerDefinitionVersion. */
type ApplicationVersionCrossTransformerDefinitionVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    transformerDefinitionVersion: string;
};
/** Cross row linking an Application Version to a historical MlSchemaVersion (#230). */
type ApplicationVersionCrossMlSchemaVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    mlSchemaVersion: string;
};
/** Cross row linking an Application Version to a historical MiroirTestVersion (#230). */
type ApplicationVersionCrossMiroirTestVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    miroirTestVersion: string;
};
/** Cross row linking an Application Version to a historical BlobVersion (#706). */
type ApplicationVersionCrossBlobVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    blobVersion: string;
};
/** Cross row linking an Application Version to a historical TestConfigurationVersion (#706). */
type ApplicationVersionCrossTestConfigurationVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    testConfigurationVersion: string;
};
/** Cross row linking an Application Version to a historical TestVersion (#706). */
type ApplicationVersionCrossTestVersionRow = {
    uuid: string;
    parentUuid: string;
    parentName?: string;
    applicationVersion: string;
    testVersion: string;
};
type FreezeApplicationVersionPlan = {
    selfApplicationVersion: ApplicationVersion;
    entityVersions: EntityVersion[];
    crossEntityVersions: ApplicationVersionCrossEntityVersionRow[];
    /** Persist section for EntityVersion rows (Miroir data / Library model). */
    entityVersionApplicationSection: ApplicationSection;
    queryVersions: QueryVersionSnapshot[];
    crossQueryVersions: ApplicationVersionCrossQueryVersionRow[];
    /** Persist section for QueryVersion rows (#227). */
    queryVersionApplicationSection: ApplicationSection;
    reportVersions: ReportVersionSnapshot[];
    crossReportVersions: ApplicationVersionCrossReportVersionRow[];
    /** Persist section for ReportVersion rows (#227). */
    reportVersionApplicationSection: ApplicationSection;
    menuVersions: MenuVersionSnapshot[];
    crossMenuVersions: ApplicationVersionCrossMenuVersionRow[];
    /** Persist section for MenuVersion rows (#227). */
    menuVersionApplicationSection: ApplicationSection;
    endpointVersions: EndpointVersionSnapshot[];
    crossEndpointVersions: ApplicationVersionCrossEndpointVersionRow[];
    /** Persist section for EndpointVersion rows (#227). */
    endpointVersionApplicationSection: ApplicationSection;
    runnerVersions: RunnerVersionSnapshot[];
    crossRunnerVersions: ApplicationVersionCrossRunnerVersionRow[];
    /** Persist section for RunnerVersion rows (#227). */
    runnerVersionApplicationSection: ApplicationSection;
    themeVersions: ThemeVersionSnapshot[];
    crossThemeVersions: ApplicationVersionCrossThemeVersionRow[];
    /** Persist section for ThemeVersion rows (#227). */
    themeVersionApplicationSection: ApplicationSection;
    transformerDefinitionVersions: TransformerDefinitionVersionSnapshot[];
    crossTransformerDefinitionVersions: ApplicationVersionCrossTransformerDefinitionVersionRow[];
    /** Persist section for TransformerDefinitionVersion rows (#227). */
    transformerDefinitionVersionApplicationSection: ApplicationSection;
    mlSchemaVersions: MlSchemaVersionSnapshot[];
    crossMlSchemaVersions: ApplicationVersionCrossMlSchemaVersionRow[];
    /** Persist section for MlSchemaVersion rows (#230). */
    mlSchemaVersionApplicationSection: ApplicationSection;
    miroirTestVersions: MiroirTestVersionSnapshot[];
    crossMiroirTestVersions: ApplicationVersionCrossMiroirTestVersionRow[];
    /** Persist section for MiroirTestVersion rows (#230). */
    miroirTestVersionApplicationSection: ApplicationSection;
    blobVersions: BlobVersionSnapshot[];
    crossBlobVersions: ApplicationVersionCrossBlobVersionRow[];
    testConfigurationVersions: TestConfigurationVersionSnapshot[];
    crossTestConfigurationVersions: ApplicationVersionCrossTestConfigurationVersionRow[];
    testVersions: TestVersionSnapshot[];
    crossTestVersions: ApplicationVersionCrossTestVersionRow[];
};
type BuildFreezeApplicationVersionPlanInput = {
    selfApplicationUuid: string;
    branchUuid: string;
    versionName: string;
    entities: Entity[];
    /** Present-model Queries to snapshot (#227). Defaults to empty. */
    storedQueries?: StoredQueryForFreeze[];
    /** Present-model Reports to snapshot (#227). Defaults to empty. */
    reports?: StoredReportForFreeze[];
    /** Present-model Menus to snapshot (#227). Defaults to empty. */
    menus?: StoredMenuForFreeze[];
    /** Present-model Endpoints to snapshot (#227). Defaults to empty. */
    endpoints?: StoredEndpointForFreeze[];
    /** Present-model Runners to snapshot (#227). Defaults to empty. */
    runners?: StoredRunnerForFreeze[];
    /** Present-model Themes to snapshot (#227). Defaults to empty. */
    themes?: StoredThemeForFreeze[];
    /** Present-model TransformerDefinitions to snapshot (#227). Defaults to empty. */
    transformerDefinitions?: StoredTransformerDefinitionForFreeze[];
    /** Present-model MlSchemas to snapshot (#230). Defaults to empty. */
    mlSchemas?: StoredMlSchemaForFreeze[];
    /** Present-model MiroirTests to snapshot (#230). Defaults to empty. */
    tests?: StoredMiroirTestForFreeze[];
    /** Live Blobs to snapshot (#706). Defaults to empty. */
    blobs?: StoredInstanceForFreeze[];
    /** Live TestConfigurations to snapshot (#706). Defaults to empty. */
    testConfigurations?: StoredInstanceForFreeze[];
    /** Live instances of the Test Entity (not MiroirTests, which are `tests`) to snapshot (#706). */
    testInstances?: StoredInstanceForFreeze[];
    /** Existing SAVs for this app+branch — used for duplicate label detection and tip resolution. */
    existingApplicationVersions?: ApplicationVersion[];
    /**
     * Explicit previous SAV uuid. When omitted, auto-resolves via
     * {@link resolvePreviousApplicationVersion} using `freezeProducedVersionUuids`.
     */
    previousVersionUuid?: string;
    /**
     * SAV uuids known to be freeze-produced (have Entity-covering Cross).
     * Used when auto-resolving `previousVersion` (Phase 3).
     */
    freezeProducedVersionUuids?: ReadonlySet<string> | readonly string[];
    /**
     * Previous freeze EntityVersion snapshots (Option A diff → `modelCUDMigration`).
     * Omit on first freeze.
     */
    previousEntityVersions?: EntityVersion[];
    description?: string;
    newUuid?: () => string;
};
type ModelCudMigrationCandidate = {
    kind: "createEntity";
    entityUuid: string;
    name: string;
} | {
    kind: "dropEntity";
    entityUuid: string;
    name: string;
} | {
    kind: "renameEntity";
    entityUuid: string;
    /** Name in previous snapshot. */
    name: string;
    /** Name in next snapshot. */
    targetName: string;
} | {
    kind: "alterEntityAttribute";
    entityUuid: string;
    name: string;
    differingFields: EntityPresentModelDefinitionField[];
};
/**
 * Option A: rough migration candidates from consecutive EntityVersion snapshots,
 * keyed by live `entityUuid`. Rename vs drop+create is uuid-based only (no fuzzy match).
 *
 * Order: creates → drops → per shared entity (rename then alter), each group sorted by entityUuid.
 */
declare function diffEntityVersionSnapshots(previous: EntityVersion[], next: EntityVersion[]): ModelCudMigrationCandidate[];
/**
 * #216 ADR D6 / Phase 7 — SAV names that are never freeze tips.
 * Fixture `"Initial"` and legacy commit placeholder labels are ignored for tip
 * resolution even when `freezeProducedVersionUuids` is omitted.
 */
declare const APPLICATION_VERSION_PLACEHOLDER_NAMES: ReadonlySet<string>;
declare function isApplicationVersionPlaceholder(sav: {
    name: string;
}): boolean;
type ResolvePreviousApplicationVersionOptions = {
    selfApplicationUuid: string;
    branchUuid: string;
    /**
     * SAV uuids produced by freeze (have Entity-covering Cross rows).
     * When provided, only those SAVs are eligible as tip.
     * When omitted, all non-placeholder SAVs for app+branch are eligible
     * (#216 Phase 7: `"Initial"` / commit TODO labels always excluded).
     */
    freezeProducedVersionUuids?: ReadonlySet<string> | readonly string[];
};
/**
 * Resolve the linear tip (chain head) for an application+branch.
 *
 * Tip = SAV for app+branch that is not referenced as `previousVersion` by any
 * other eligible SAV. Placeholders (`"Initial"`, commit TODO labels) are never
 * tips. When `freezeProducedVersionUuids` is provided, only those SAVs are
 * considered. Throws if multiple chain heads remain.
 */
declare function resolvePreviousApplicationVersion(versions: ApplicationVersion[], options: ResolvePreviousApplicationVersionOptions): ApplicationVersion | undefined;
/**
 * Pure plan for a freeze: new SAV + historical EntityVersions + Cross rows.
 * Does not call the versioning gate — use {@link planFreezeApplicationVersion} for Action entry.
 */
declare function buildFreezeApplicationVersionPlan(input: BuildFreezeApplicationVersionPlanInput): FreezeApplicationVersionPlan;
/**
 * The Entities a freeze snapshots as EntityVersions (#230).
 *
 * For an ordinary application, its own Entities: the meta-model Entities (Entity, Report, …),
 * which can show up in its current model, are left out.
 * For Miroir itself, those meta-model Entities *are* its Entities, so all of them are kept,
 * apart from the version-history Entities (stored in `modelVersion`) and the devData Entities.
 */
declare function selectEntitiesToFreeze(applicationUuid: string, entities: Entity[], metaModelEntityUuids: ReadonlySet<string>): Entity[];
type PlanFreezeApplicationVersionInput = BuildFreezeApplicationVersionPlanInput & {
    selfApplication: {
        versioningEnabled?: boolean | undefined;
    };
};
/**
 * Action-facing entry: enforce `versioningEnabled`, then build the freeze plan.
 */
declare function planFreezeApplicationVersion(input: PlanFreezeApplicationVersionInput): FreezeApplicationVersionPlan;
/** MetaModel fields needed to plan a freeze without LocalCache. */
type FreezeMetaModelSlice = {
    applications: Array<{
        uuid: string;
        versioningEnabled?: boolean | undefined;
    }>;
    entities: Entity[];
    storedQueries?: StoredQueryForFreeze[];
    reports?: StoredReportForFreeze[];
    menus?: StoredMenuForFreeze[];
    endpoints?: StoredEndpointForFreeze[];
    runners?: StoredRunnerForFreeze[];
    themes?: StoredThemeForFreeze[];
    transformerDefinitions?: StoredTransformerDefinitionForFreeze[];
    mlSchemas?: StoredMlSchemaForFreeze[];
    tests?: StoredMiroirTestForFreeze[];
    /** Read from the store at freeze time (#706): the MetaModel has no collection for them. */
    blobs?: StoredInstanceForFreeze[];
    testConfigurations?: StoredInstanceForFreeze[];
    testInstances?: StoredInstanceForFreeze[];
    applicationVersions: ApplicationVersion[];
    entityVersions: EntityVersion[];
    applicationVersionCrossEntityVersion: MetaModel["applicationVersionCrossEntityVersion"];
    applicationVersionCrossQueryVersion?: MetaModel["applicationVersionCrossQueryVersion"];
    queryVersions?: MetaModel["queryVersions"];
    applicationVersionCrossReportVersion?: MetaModel["applicationVersionCrossReportVersion"];
    reportVersions?: MetaModel["reportVersions"];
    applicationVersionCrossMenuVersion?: MetaModel["applicationVersionCrossMenuVersion"];
    menuVersions?: MetaModel["menuVersions"];
    applicationVersionCrossEndpointVersion?: MetaModel["applicationVersionCrossEndpointVersion"];
    endpointVersions?: MetaModel["endpointVersions"];
    applicationVersionCrossRunnerVersion?: MetaModel["applicationVersionCrossRunnerVersion"];
    runnerVersions?: MetaModel["runnerVersions"];
    applicationVersionCrossThemeVersion?: MetaModel["applicationVersionCrossThemeVersion"];
    themeVersions?: MetaModel["themeVersions"];
    applicationVersionCrossTransformerDefinitionVersion?: MetaModel["applicationVersionCrossTransformerDefinitionVersion"];
    transformerDefinitionVersions?: MetaModel["transformerDefinitionVersions"];
    applicationVersionCrossMlSchemaVersion?: MetaModel["applicationVersionCrossMlSchemaVersion"];
    mlSchemaVersions?: MetaModel["mlSchemaVersions"];
    applicationVersionCrossMiroirTestVersion?: MetaModel["applicationVersionCrossMiroirTestVersion"];
    miroirTestVersions?: MetaModel["miroirTestVersions"];
};
/** #232 — overlay modelVersion-persisted rows onto the in-memory slice used for freeze planning. */
declare function mergeVersionHistoryIntoFreezeMetaModel(metaModel: FreezeMetaModelSlice, persisted: Partial<FreezeMetaModelSlice>): FreezeMetaModelSlice;
type ModelVersionInstanceLoader = (parentEntityUuid: string) => Promise<Array<{
    uuid: string;
}>>;
/** #232 — read all version-history collections from the modelVersion section for freeze chaining. */
declare function loadVersionHistoryFreezeSlice(loadInstances: ModelVersionInstanceLoader): Promise<Partial<FreezeMetaModelSlice>>;
/**
 * Resolve SelfApplication + Entities + tip context from MetaModel, then plan.
 * DomainController calls this for `freezeApplicationVersion`; Phase 6 persists the plan.
 */
declare function planFreezeApplicationVersionFromMetaModel(payload: FreezeApplicationVersionActionPayload, metaModel: FreezeMetaModelSlice, options?: SnapshotOptions): FreezeApplicationVersionPlan;

/**
 * @miroir-framework/versioning (#696): application versioning, out of core. A process with the
 * `versioning` capability loads it on first use, through the lazy registration of core
 * (`registerLazyActionImplementations`): never import it statically from a host.
 */

/** The action implementations of the package, by the `inMemoryImplementationFunctionName` of their Endpoint action. */
declare const actionImplementations: Record<string, ActionImplementationHandler>;

export { APPLICATION_VERSION_PLACEHOLDER_NAMES, actionImplementations, buildFreezeApplicationVersionPlan, diffEntityVersionSnapshots, handleAction_freezeApplicationVersion, isApplicationVersionPlaceholder, loadVersionHistoryFreezeSlice, mergeVersionHistoryIntoFreezeMetaModel, planFreezeApplicationVersion, planFreezeApplicationVersionFromMetaModel, resolvePreviousApplicationVersion, selectEntitiesToFreeze, snapshotBlobsAsHistoricalBlobVersions, snapshotEndpointsAsHistoricalEndpointVersions, snapshotEntitiesAsHistoricalEntityVersions, snapshotMenusAsHistoricalMenuVersions, snapshotMiroirTestsAsHistoricalMiroirTestVersions, snapshotMlSchemasAsHistoricalMlSchemaVersions, snapshotQueriesAsHistoricalQueryVersions, snapshotReportsAsHistoricalReportVersions, snapshotRunnersAsHistoricalRunnerVersions, snapshotTestConfigurationsAsHistoricalTestConfigurationVersions, snapshotTestsAsHistoricalTestVersions, snapshotThemesAsHistoricalThemeVersions, snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions };
export type { ApplicationVersionCrossBlobVersionRow, ApplicationVersionCrossEndpointVersionRow, ApplicationVersionCrossEntityVersionRow, ApplicationVersionCrossMenuVersionRow, ApplicationVersionCrossMiroirTestVersionRow, ApplicationVersionCrossMlSchemaVersionRow, ApplicationVersionCrossQueryVersionRow, ApplicationVersionCrossReportVersionRow, ApplicationVersionCrossRunnerVersionRow, ApplicationVersionCrossTestConfigurationVersionRow, ApplicationVersionCrossTestVersionRow, ApplicationVersionCrossThemeVersionRow, ApplicationVersionCrossTransformerDefinitionVersionRow, BlobVersionSnapshot, BuildFreezeApplicationVersionPlanInput, EndpointVersionSnapshot, FreezeApplicationVersionPlan, FreezeMetaModelSlice, InstanceVersionSnapshot, MenuVersionSnapshot, MiroirTestVersionSnapshot, MlSchemaVersionSnapshot, ModelCudMigrationCandidate, ModelVersionInstanceLoader, PlanFreezeApplicationVersionInput, QueryVersionSnapshot, ReportVersionSnapshot, ResolvePreviousApplicationVersionOptions, RunnerVersionSnapshot, SnapshotOptions, StoredEndpointForFreeze, StoredInstanceForFreeze, StoredMenuForFreeze, StoredMiroirTestForFreeze, StoredMlSchemaForFreeze, StoredQueryForFreeze, StoredReportForFreeze, StoredRunnerForFreeze, StoredThemeForFreeze, StoredTransformerDefinitionForFreeze, TestConfigurationVersionSnapshot, TestVersionSnapshot, ThemeVersionSnapshot, TransformerDefinitionVersionBody, TransformerDefinitionVersionSnapshot };
