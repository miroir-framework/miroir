import { z } from "zod";


export const ZapplicationConceptLevel = z.union([z.literal("MetaModel"), z.literal("Model"), z.literal("Data")]);

export const Zinstance = z.object({
  uuid: z.string().uuid(),
  parentUuid: z.string().uuid(),
  parentName: z.string().optional(),
  conceptLevel: ZapplicationConceptLevel.optional(),
  instanceOfThisInstanceConceptLevel: ZapplicationConceptLevel.optional(),
});

export const ZinstanceWithName = Zinstance.extend({
  name: z.string(),
});

export const Zmodel = ZinstanceWithName.extend({
  description: z.string(),
})

export const StorageType = z.enum([
  "sql",
  "filesystem",
  "indexedDb",
]);

export const ClientServerDistributionMode = z.enum([
  "singleNode",
  "MultiNode",
]);

export const DeploymentSide = z.enum([
  "client",
  "server",
]);

export const ClientFileStorage = z.object({
  type: z.literal(StorageType.enum.filesystem),
  side: z.literal(DeploymentSide.enum.client),
  location: z.string(),
});

export const ServerFileStorage = z.object({
  type: z.literal(StorageType.enum.filesystem),
  side: z.literal(DeploymentSide.enum.server),
  directory: z.string(),
});

export const FileStorage = z.union([
  ClientFileStorage,
  ServerFileStorage
]);

export const ServerSqlStorage = z.object({
  type: z.literal(StorageType.enum.sql),
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


export const ModelStorageLocation = z.object({
  // modelUuid: z.string().uuid(),
  location: ServerStorageLocation,
})



export const DataflowConfiguration = z.object({
  type: ClientServerDistributionMode,
  // metaModel: ModelStorageLocation,
  model: ModelStorageLocation.optional(),
  data: ModelStorageLocation.optional(),
});
