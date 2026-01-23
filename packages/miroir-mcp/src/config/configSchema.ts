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

// Main MCP configuration schema
export const MiroirMcpConfigSchema = z.object({
  applicationDeploymentMap: z.record(z.string(), z.string()),
  storeSectionConfiguration: z.record(z.string(), StoreUnitConfigurationSchema),
  logConfig: LoggerConfigSchema.optional(),
});

export type MiroirMcpConfig = z.infer<typeof MiroirMcpConfigSchema>;
export type StoreSectionConfiguration = z.infer<typeof StoreSectionConfigurationSchema>;
export type StoreUnitConfiguration = z.infer<typeof StoreUnitConfigurationSchema>;
export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;
