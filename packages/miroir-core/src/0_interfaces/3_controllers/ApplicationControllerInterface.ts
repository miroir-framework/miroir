import { z } from "zod";

export const DataStoreApplicationTypeSchema = z.enum(['miroir', 'app']);

export type DataStoreApplicationType = z.infer<typeof DataStoreApplicationTypeSchema>;
