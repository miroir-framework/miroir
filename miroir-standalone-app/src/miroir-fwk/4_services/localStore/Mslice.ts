import { PayloadAction } from "@reduxjs/toolkit";
import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { InstanceCollection } from "src/miroir-fwk/0_interfaces/1_core/Instance";


export type MinstanceAction = PayloadAction<InstanceCollection,string>;
export type MentityAction = PayloadAction<EntityDefinition[],string>;

export type Maction = MinstanceAction | MentityAction;

// export interface ActionWithPayloadCreator {
//   actionCreator: PayloadActionCreator;
//   getActionPayload:(state:any, action:ActionWithPayload)=>any;
// }