import { Action, PayloadActionCreator } from "@reduxjs/toolkit";


// TODO: user type PayloadAction<P,T,M,E> as root
// and interface Action<T = any>
export interface ActionWithPayload  extends Action<string>{
  payload: any;
}

export interface MactionWithAsyncDispatchType extends ActionWithPayload{
  asyncDispatch:(asyncAction:any) => void; // brought by asyncDispatchMiddleware
}


export interface ActionWithPayloadCreator {
  actionCreator: PayloadActionCreator;
  getActionPayload:(state:any, action:ActionWithPayload)=>any;
}

export interface Mslice {
  // actionToDispatchMap:Map<string,ActionWithPayloadCreator[]>;
}