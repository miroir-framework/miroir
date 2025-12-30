import instanceEndpointV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json" assert { type: "json" };
import modelEndpointV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json" assert { type: "json" };
import storeManagementEndpointV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json" assert { type: "json" };


export const entityInstanceActions = [
  ...instanceEndpointV1.definition.actions.map(
  (actionDef:any) => actionDef.actionParameters.actionType.definition
),
  ...storeManagementEndpointV1.definition.actions.map(
  (actionDef:any) => actionDef.actionParameters.actionType.definition
),
...modelEndpointV1.definition.actions.map(
  (actionDef:any) => actionDef.actionParameters.actionType.definition
)]
