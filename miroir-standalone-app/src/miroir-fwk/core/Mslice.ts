import { PayloadAction } from "@reduxjs/toolkit";
import { mEntities } from "./Entity";
import { MinstanceActionPayload } from "./InstanceSlice";


export type MinstanceAction = PayloadAction<MinstanceActionPayload,string>;
export type MentityAction = PayloadAction<mEntities,string>;

export type Maction = MinstanceAction | MentityAction;

// export interface ActionWithPayloadCreator {
//   actionCreator: PayloadActionCreator;
//   getActionPayload:(state:any, action:ActionWithPayload)=>any;
// }