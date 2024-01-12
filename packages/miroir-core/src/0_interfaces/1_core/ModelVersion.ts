import { z } from "zod";
import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance";
import { ModelReplayableUpdateSchema } from "../../0_interfaces/2_domain/ModelUpdateInterface";
import { LocalCacheEntityActionWithDeploymentSchema } from "../4-services/LocalCacheInterface";

export const MiroirApplicationVersionSchema = EntityInstanceWithNameSchema.extend({
  description: z.string().optional(),
  application: z.string(),
  branch: z.string(),
  previousVersion: z.string().optional(),
  modelCUDMigration: z.array(ModelReplayableUpdateSchema).optional(),
  modelStructureMigration: z.array(z.union([ModelReplayableUpdateSchema, LocalCacheEntityActionWithDeploymentSchema])).optional(),
  // modelCUDMigration: z.array(z.any()).optional(),
  // modelStructureMigration: z.array(z.any()).optional(),
});
export type MiroirApplicationVersion = z.infer<typeof MiroirApplicationVersionSchema>;