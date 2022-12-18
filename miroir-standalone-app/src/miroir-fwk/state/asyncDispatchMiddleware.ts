// import { Store } from "@reduxjs/toolkit";
// import { ActionWithPayload, ActionWithPayloadCreator, Mslice } from "../entities/Mslice";


// /**
//  * adds the asyncDispatch function to actions, that can be used in the reducer to trigger an outgoing event.
//  */
// const asyncDispatchMiddlewareForSlices =
//   (slices:Mslice[]) =>
//   (store:Store) => 
//   (nextDispatch:(asyncAction:any) => void) => 
//   (action:ActionWithPayload) => 
//   {
//     let syncActivityFinished = false;
//     let actionQueue:any[] = [];
//     const filteredSlices:Mslice[] = slices.filter((s:Mslice)=>s.actionToDispatchMap.size > 0);
//     const actionToDispatches:Map<string,ActionWithPayloadCreator[]>[] = filteredSlices.map((s:Mslice)=>s.actionToDispatchMap);
//     const actionToDispatchesArray:[string,ActionWithPayloadCreator[]][] = actionToDispatches.map((m:Map<string,ActionWithPayloadCreator[]>)=><[string,ActionWithPayloadCreator[]]>[...m].flat());
//     // console.log("actionToDispatchesArray",actionToDispatchesArray);

//     const actionToDispatchMap:Map<string,ActionWithPayloadCreator[]>=new Map(
//       actionToDispatchesArray
//     );

//     // const getActionToDispatchFromActionType

//     function flushQueue(i:number) {
//       console.log(
//         "asyncDispatchMiddleware action", action.type, "actionToDispatchMap", 
//         // actionToDispatchMap,
//         actionToDispatchMap.get(action.type),
//       );
//       actionToDispatchMap.get(action.type)?.forEach(
//         (actionCreator:ActionWithPayloadCreator) => {
//           const actionToDispatch:ActionWithPayload = actionCreator.actionCreator(actionCreator.getActionPayload(store,action));
//           console.warn('asyncDispatchMiddleware flushQueue automatically dispatching', actionToDispatch, 'for',i,action.type);
//           // store.dispatch(actionToDispatch);
//         }
//       )
//       actionQueue.forEach(
//         a => {
//           console.warn('asyncDispatchMiddleware flushQueue dispatching ',i,a, JSON.stringify(store));
//           store.dispatch(a);
//         }
//       ); // flush queue
//       actionQueue = [];
//     }

//     function asyncDispatch(asyncAction:{type:string}) {
//       console.warn('asyncDispatchMiddleware action ',action.type, 'explicitly dispatching',asyncAction.type);
//       actionQueue = actionQueue.concat([asyncAction]);

//       if (syncActivityFinished) {
//         flushQueue(1);
//       }
//     }

//     const actionWithAsyncDispatch = Object.assign({}, action, { asyncDispatch });

//     nextDispatch(actionWithAsyncDispatch);
//     syncActivityFinished = true;
//     flushQueue(2);
//   };

// export default asyncDispatchMiddlewareForSlices;
