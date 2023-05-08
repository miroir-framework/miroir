import { z } from "zod";


export const ZapplicationConceptLevel = z.union([z.literal("MetaModel"), z.literal("Model"), z.literal("Data")]);

export const ZinstanceSchema = z.object({
  uuid: z.string().uuid(),
  parentUuid: z.string().uuid(),
  parentName: z.string().optional(),
  conceptLevel: ZapplicationConceptLevel.optional(),
  // instanceOfThisInstanceConceptLevel: ZapplicationConceptLevel.optional(),
});

export type Zinstance = z.infer<typeof ZinstanceSchema>;

export const ZinstanceWithName = ZinstanceSchema.extend({
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


export const ModelStorageLocationSchema = z.object({
  // modelUuid: z.string().uuid(),
  location: ServerStorageLocation,
})

export type ModelStorageLocation = z.infer<typeof ModelStorageLocationSchema>;


export const ApplicationDeploymentSchema = ZinstanceWithName.extend({
  // uuid: z.string().uuid(),
  type: ClientServerDistributionMode,
  description: z.string(),
  // metaModel: ModelStorageLocation,
  model: ModelStorageLocationSchema.optional(),
  data: ModelStorageLocationSchema.optional(),
});

export type ApplicationDeployment = z.infer<typeof ApplicationDeploymentSchema>;

export const applicationDeploymentMiroirBootstrap: ApplicationDeployment = {
  uuid: 'f0d67153-0e37-4b5c-91cf-415dc7780043',
  type:'singleNode',
  model: {
    location: {
      type: 'sql',
      side:'server',
      connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
      schema: 'miroir',
    }
    // location: {
    //   type: 'filesystem',
    //   side:'server',
    //   directory:'C:/Users/nono/Documents/devhome/miroir-app/packages/miroir-core/src/assets'
    // }
  },
  data: {
    location: {
      type: 'sql',
      side:'server',
      connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
      schema: 'miroir',
    }
    // location: {
    //   type: 'filesystem',
    //   side:'server',
    //   directory:'C:/Users/nono/Documents/devhome/miroir-app/packages/miroir-core/src/assets'
    // }
  },
};

export const applicationDeploymentLibraryNew: ApplicationDeployment = {
  uuid: 'f714bb2f-a12d-4e71-a03b-74dcedea6eb4',
  type:'singleNode',
  model: {
    // location: {
    //   type: 'filesystem',
    //   side:'server',
    //   directory:'C:/Users/nono/Documents/devhome/miroir-app/packages/miroir-standalone-app/src/assets',
    // }
    location: {
      type: 'sql',
      side:'server',
      connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
      schema: 'library',
    }
  },
  data: {
    // location: {
    //   type: 'filesystem',
    //   side:'server',
    //   directory:'C:/Users/nono/Documents/devhome/miroir-app/packages/miroir-standalone-app/src/assets'
    // }
    location: {
      type: 'sql',
      side:'server',
      connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
      schema: 'library',
    }
  },
};