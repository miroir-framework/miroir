import instanceEndpointV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json" assert { type: "json" };


export const entityInstanceActions = instanceEndpointV1.definition.actions.map(
  (actionDef:any) => actionDef.actionParameters.actionType.definition
)
