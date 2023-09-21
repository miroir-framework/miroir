import { JzodReference } from "@miroir-framework/jzod-ts";
import { Uuid } from "../1_core/EntityDefinition";
import { ApplicationSection } from "../1_core/Instance";
import { SelectObjectListQuery } from "../1_core/preprocessor-generated/server-generated";

export interface DomainEntityInstancesSelectorParams {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
}


export type EntityInstanceListQueryParams = {localCacheSelectorParams: DomainEntityInstancesSelectorParams, query: SelectObjectListQuery};

export type MiroirSelectorParams =
  | { type: "DomainEntityInstancesSelectorParams"; definition: DomainEntityInstancesSelectorParams }
  | { type: "EntityInstanceListQueryParams"; definition: EntityInstanceListQueryParams }
;

// export const miroirSelectorParams: JzodReference = {
//   type: "schemaReference",
//   context: {

//     miroirSelectorParams: {
//       type: "object",
//       definition: {}
//     }
//   },
//   definition: {
//     relativePath: "miroirSelectorParams"
//   }
// }
