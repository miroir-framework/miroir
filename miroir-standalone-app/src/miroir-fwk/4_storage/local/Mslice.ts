import { PayloadAction } from "@reduxjs/toolkit";
import { MEntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { MinstanceActionPayload } from "src/miroir-fwk/4_storage/local/MInstanceSlice";


export type MinstanceAction = PayloadAction<MinstanceActionPayload,string>;
export type MentityAction = PayloadAction<MEntityDefinition[],string>;

export type Maction = MinstanceAction | MentityAction;

// export interface ActionWithPayloadCreator {
//   actionCreator: PayloadActionCreator;
//   getActionPayload:(state:any, action:ActionWithPayload)=>any;
// }