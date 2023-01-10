import { PayloadAction } from "@reduxjs/toolkit";
import { MEntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { InstanceActionPayload } from "src/miroir-fwk/4_storage/local/InstanceSlice";


export type MinstanceAction = PayloadAction<InstanceActionPayload,string>;
export type MentityAction = PayloadAction<MEntityDefinition[],string>;

export type Maction = MinstanceAction | MentityAction;

// export interface ActionWithPayloadCreator {
//   actionCreator: PayloadActionCreator;
//   getActionPayload:(state:any, action:ActionWithPayload)=>any;
// }