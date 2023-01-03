import { PayloadAction, PayloadActionCreator } from "@reduxjs/toolkit";
import { MiroirEntities } from "./Entity";
import { Minstances, MinstanceWithName } from "./Instance";

export type MpayloadType = MiroirEntities | {entity:string, instances:Minstances};

export interface MinstanceAction {
  entity:string, instances:MinstanceWithName[]
}

// TODO: user type PayloadAction<P,T,M,E> as root
// and interface Action<T = any>
// export interface ActionWithPayload  extends Action<string>{
// export interface ActionWithPayload  extends PayloadAction<string>{
//   // payload: any;
//   payload: any;
// }

export type InstancePayloadAction = PayloadAction<MinstanceAction,string>;
export type EntityPayloadAction = PayloadAction<MiroirEntities,string>;

export type MactionPayloadType = InstancePayloadAction | EntityPayloadAction;

// export interface MactionWithAsyncDispatchType extends ActionWithPayload{
//   asyncDispatch:(asyncAction:any) => void; // brought by asyncDispatchMiddleware
// }


// export interface ActionWithPayloadCreator {
//   actionCreator: PayloadActionCreator;
//   getActionPayload:(state:any, action:ActionWithPayload)=>any;
// }

export interface Mslice {
  // actionToDispatchMap:Map<string,ActionWithPayloadCreator[]>;
}