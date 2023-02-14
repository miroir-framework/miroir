import { PayloadAction } from "@reduxjs/toolkit";
import { EntityDefinition } from 'miroir-core';
import { InstanceCollection } from 'miroir-core';


export type MinstanceAction = PayloadAction<InstanceCollection,string>;
export type MentityAction = PayloadAction<EntityDefinition[],string>;

export type Maction = MinstanceAction | MentityAction;

// export interface ActionWithPayloadCreator {
//   actionCreator: PayloadActionCreator;
//   getActionPayload:(state:any, action:ActionWithPayload)=>any;
// }