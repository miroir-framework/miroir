/**
 * #696: what core keeps of application versioning once the freeze moved to `@miroir-framework/versioning`:
 * the action type and its payload, the uuids of the version Entities (read by section routing, the
 * local caches and the reports), and the names of the implementations the package provides. The
 * versioning modes stay in `versioningMode.ts`.
 */

/** Model Endpoint actionType for user-triggered freeze (ADR D1-a). */
export const FREEZE_APPLICATION_VERSION_ACTION_TYPE = "freezeApplicationVersion" as const;

export type FreezeApplicationVersionActionType = typeof FREEZE_APPLICATION_VERSION_ACTION_TYPE;

/** Payload shape for Model Endpoint `freezeApplicationVersion`. */
export type FreezeApplicationVersionActionPayload = {
  application: string;
  versionName: string;
  description?: string;
  branch?: string;
};

/** The package that implements the versioning actions, named in a refusal when it is not registered. */
export const VERSIONING_PACKAGE_NAME = "@miroir-framework/versioning";

/**
 * The `inMemoryImplementationFunctionName`s of the Endpoint actions `@miroir-framework/versioning`
 * implements; a host registers them with `registerLazyActionImplementations`.
 */
export const VERSIONING_ACTION_IMPLEMENTATION_NAMES: readonly string[] = [
  "handleAction_freezeApplicationVersion",
  "handleAction_appendEvolutionTraceRecord",
];

/** #708: the Entity of evolution trace records, stored in an application's `modelVersion` section. */
export const EVOLUTION_TRACE_RECORD_ENTITY_UUID = "854c47bd-af74-4305-bdea-aa6bddfa8899";

/** #708: Model Endpoint action that appends one record to an application's evolution trace. */
export const APPEND_EVOLUTION_TRACE_RECORD_ACTION_TYPE = "appendEvolutionTraceRecord" as const;

/** #708: what a record says: the model Actions of a commit, or a marker of a version or of a re-baseline. */
export type EvolutionTraceRecordKind = "commit" | "version" | "rebaseline";

/** #708: payload of `appendEvolutionTraceRecord`; the package sets the sequence number and the previous record. */
export type AppendEvolutionTraceRecordPayload = {
  application: string;
  kind: EvolutionTraceRecordKind;
  commitUuid?: string;
  actions?: unknown[];
  complete?: boolean;
  version?: string;
  gitCommit?: string;
};

/** #708: a stored evolution trace record. */
export type EvolutionTraceRecordRow = AppendEvolutionTraceRecordPayload & {
  uuid: string;
  parentName: string;
  parentUuid: string;
  sequenceNumber: number;
  previousTrace?: string;
  timestamp: string;
};

export {
  assertApplicationVersioningEnabled,
  getFreezeAvailability,
  isApplicationVersioningEnabled,
  isVersioningAppBarItemVisible,
  resolveVersioningMode,
  type FreezeAvailability,
  type VersioningMode,
  type VersioningModeInput,
} from "./versioningMode.js";

/** Historical QueryVersion Entity UUID (#227). */
export const QUERY_VERSION_ENTITY_UUID = "7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c";
/** ApplicationVersionCrossQueryVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID =
  "9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d";
/** Historical ReportVersion Entity UUID (#227). */
export const REPORT_VERSION_ENTITY_UUID = "f1a2b3c4-d5e6-4789-a0a1-b2c3d4e5f6a7";
/** ApplicationVersionCrossReportVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID =
  "f2b3c4d5-e6f7-4890-a1b2-c3d4e5f6a7b8";
/** Historical MenuVersion Entity UUID (#227). */
export const MENU_VERSION_ENTITY_UUID = "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7";
/** ApplicationVersionCrossMenuVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_MENU_VERSION_UUID =
  "b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8";
/** Historical EndpointVersion Entity UUID (#227). */
export const ENDPOINT_VERSION_ENTITY_UUID = "c2d3e4f5-a6b7-4789-a0b1-d2e3f4a5b6c7";
/** ApplicationVersionCrossEndpointVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID =
  "d3e4f5a6-b7c8-4890-b1c2-e3f4a5b6c7d8";
/** Historical RunnerVersion Entity UUID (#227). */
export const RUNNER_VERSION_ENTITY_UUID = "e5f6a7b8-c9d0-4012-a3b4-c5d6e7f8a9b0";
/** ApplicationVersionCrossRunnerVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID =
  "f6a7b8c9-d0e1-4123-a4b5-c6d7e8f9a0b1";
/** Historical ThemeVersion Entity UUID (#227). */
export const THEME_VERSION_ENTITY_UUID = "a7b8c9d0-e1f2-4012-a3b4-c5d6e7f8a9c0";
/** ApplicationVersionCrossThemeVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_THEME_VERSION_UUID =
  "b8c9d0e1-f2a3-4123-a4b5-c6d7e8f9a0c1";
/** Historical TransformerDefinitionVersion Entity UUID (#227). */
export const TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID =
  "e1f2a3b4-c5d6-4012-a3b4-c5d6e7f8a9d0";
/** ApplicationVersionCrossTransformerDefinitionVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID =
  "f2a3b4c5-d6e7-4123-a4b5-c6d7e8f9a0d1";
/** Historical MlSchemaVersion Entity UUID (#230). */
export const ML_SCHEMA_VERSION_ENTITY_UUID = "426cd199-8f38-498e-bd81-af636321b864";
/** ApplicationVersionCrossMlSchemaVersion Entity UUID (#230). */
export const APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID =
  "da27d98d-6b52-412a-9317-557325ec4030";
/** Historical MiroirTestVersion Entity UUID (#230). */
export const MIROIR_TEST_VERSION_ENTITY_UUID = "a2b1c33a-b0db-45b4-829c-c8fafc4a6110";
/** ApplicationVersionCrossMiroirTestVersion Entity UUID (#230). */
export const APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID =
  "81af0bd1-388b-4f80-aabc-4004578c7ded";
/** Historical BlobVersion Entity UUID (#706). */
export const BLOB_VERSION_ENTITY_UUID = "4fbc43fa-8970-41b8-845e-20303002147e";
/** ApplicationVersionCrossBlobVersion Entity UUID (#706). */
export const APPLICATION_VERSION_CROSS_BLOB_VERSION_UUID = "28ed918a-5514-4dc2-a3f3-a6f353270dd5";
/** Historical TestConfigurationVersion Entity UUID (#706). */
export const TEST_CONFIGURATION_VERSION_ENTITY_UUID = "9b0f81d3-8b80-454f-9dfc-57489969a112";
/** ApplicationVersionCrossTestConfigurationVersion Entity UUID (#706). */
export const APPLICATION_VERSION_CROSS_TEST_CONFIGURATION_VERSION_UUID =
  "8bd811bf-82fa-4547-93e1-082c97589069";
/** Historical TestVersion Entity UUID (#706). */
export const TEST_VERSION_ENTITY_UUID = "fe94c683-89d3-482e-a653-9ce1eeb4ef34";
/** ApplicationVersionCrossTestVersion Entity UUID (#706). */
export const APPLICATION_VERSION_CROSS_TEST_VERSION_UUID = "be1d3cf3-b77c-464e-966c-6d23375a4d6f";
