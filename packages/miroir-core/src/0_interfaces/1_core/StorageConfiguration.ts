import { z } from "zod";
import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance.js";
import { storeUnitConfiguration } from "./preprocessor-generated/miroirFundamentalType.js";



export const StorageTypeSchema = z.enum([
  "sql",
  "filesystem",
  "indexedDb",
]);

export type StorageType = z.infer<typeof StorageTypeSchema>;

export const ClientServerDistributionModeSchema = z.enum([
  "singleNode",
  "MultiNode",
]);

export const DeploymentSide = z.enum([
  "client",
  "server",
]);

export const ClientFileStorage = z.object({
  type: z.literal(StorageTypeSchema.enum.filesystem),
  side: z.literal(DeploymentSide.enum.client),
  location: z.string(),
});

export const ServerFileStorage = z.object({
  type: z.literal(StorageTypeSchema.enum.filesystem),
  side: z.literal(DeploymentSide.enum.server),
  directory: z.string(),
});

export const FileStorage = z.union([
  ClientFileStorage,
  ServerFileStorage
]);

export const ServerSqlStorage = z.object({
  type: z.literal(StorageTypeSchema.enum.sql),
  side: z.literal(DeploymentSide.enum.server),
  connectionString: z.string(),
  schema: z.string(),
});


export const StorageLocation = z.union([
  ClientFileStorage,
  ServerFileStorage,
  ServerSqlStorage,
])

export const ServerStorageLocation = z.discriminatedUnion('type',[
  ServerFileStorage,
  ServerSqlStorage,
])


export const ModelStorageLocationSchema = z.object({
  // modelUuid: z.string().uuid(),
  location: ServerStorageLocation,
})

export type ModelStorageLocation = z.infer<typeof ModelStorageLocationSchema>;

export const ApplicationModelLevelSchema = z.enum([
  "model",
  "metamodel",
]);
export type ApplicationModelLevel = z.infer<typeof ApplicationModelLevelSchema>;


export const AdminApplicationDeploymentConfigurationSchema = EntityInstanceWithNameSchema.extend({
  // uuid: z.string().uuid(),
  type: ClientServerDistributionModeSchema,
  defaultLabel: z.string(),
  description: z.string(),
  // metaModel: ModelStorageLocation,
  selfApplication:z.string().uuid().optional(),
  applicationVersion:z.string().uuid().optional(),
  applicationModelLevel: ApplicationModelLevelSchema,
  // model: ModelStorageLocationSchema.optional(), // in the case of a designer access, the zone where the model can be edited.
  // data: ModelStorageLocationSchema.optional(),
  configuration: storeUnitConfiguration
});

export type AdminApplicationDeploymentConfiguration = z.infer<typeof AdminApplicationDeploymentConfigurationSchema>;



// export const SelfApplicationDeploymentConfigurationSchema = EntityInstanceWithNameSchema.extend({
//   // uuid: z.string().uuid(),
//   type: ClientServerDistributionModeSchema,
//   defaultLabel: z.string(),
//   description: z.string(),
//   // metaModel: ModelStorageLocation,
//   selfApplication:z.string().uuid().optional(),
//   applicationVersion:z.string().uuid().optional(),
//   applicationModelLevel: ApplicationModelLevelSchema,
//   model: ModelStorageLocationSchema.optional(), // in the case of a designer access, the zone where the model can be edited.
//   data: ModelStorageLocationSchema.optional(),
// });

// export type SelfApplicationDeploymentConfiguration = z.infer<typeof SelfApplicationDeploymentConfigurationSchema>;
