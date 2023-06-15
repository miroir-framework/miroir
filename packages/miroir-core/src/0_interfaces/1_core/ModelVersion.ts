import { z } from "zod";
import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance";
import { ModelReplayableUpdateSchema } from "../../0_interfaces/2_domain/ModelUpdateInterface";

export const MiroirApplicationVersionSchema = EntityInstanceWithNameSchema.extend({
  description: z.string().optional(),
  // model?: MiroirMetaModel;
  application: z.string(),
  branch: z.string(),
  previousVersion: z.string(),
  modelStructureMigration: z.array(ModelReplayableUpdateSchema).optional(),
  modelCUDMigration: z.array(ModelReplayableUpdateSchema).optional(),
});
export type MiroirApplicationVersion = z.infer<typeof MiroirApplicationVersionSchema>;

// export type MiroirModelHistory = MiroirApplicationVersion[]; // branches?
