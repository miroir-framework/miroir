import { z } from "zod";

// Storage section configuration schemas
const FilesystemStoreSectionConfigurationSchema = z.object({
  emulatedServerType: z.literal("filesystem"),
  directory: z.string(),
});

const IndexedDbStoreSectionConfigurationSchema = z.object({
  emulatedServerType: z.literal("indexedDb"),
  indexedDbName: z.string(),
});

const SqlStoreSectionConfigurationSchema = z.object({
  emulatedServerType: z.literal("sql"),
  connectionString: z.string(),
  schema: z.string(),
});

const StoreSectionConfigurationSchema = z.union([
  FilesystemStoreSectionConfigurationSchema,
  IndexedDbStoreSectionConfigurationSchema,
  SqlStoreSectionConfigurationSchema,
]);

// Store unit configuration (admin + model + data)
const StoreUnitConfigurationSchema = z.object({
  admin: StoreSectionConfigurationSchema,
  model: StoreSectionConfigurationSchema,
  data: StoreSectionConfigurationSchema,
});

// Logger configuration
const SpecificLoggerOptionsSchema = z.object({
  level: z.string().optional(),
  template: z.string().optional(),
});

const LoggerConfigSchema = z.object({
  defaultLevel: z.string(),
  defaultTemplate: z.string(),
  specificLoggerOptions: z.record(z.string(), SpecificLoggerOptionsSchema).optional(),
});

// Main CLI configuration schema
export const MiroirCliConfigSchema = z.object({
  client: z.object({
    emulateServer: z.boolean().optional().default(false),
    rootApiUrl: z.string().optional().default("http://localhost:3080"),
    applicationDeploymentMap: z.record(z.string(), z.string()),
    deploymentStorageConfig: z.record(z.string(), StoreUnitConfigurationSchema),
    logConfig: LoggerConfigSchema.optional(),
  }),
});

export type MiroirCliConfig = z.infer<typeof MiroirCliConfigSchema>;
export type StoreSectionConfiguration = z.infer<typeof StoreSectionConfigurationSchema>;
export type StoreUnitConfiguration = z.infer<typeof StoreUnitConfigurationSchema>;
export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;
