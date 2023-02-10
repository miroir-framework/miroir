import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseActionFactory,
  SagaPromiseActionCreator
} from "@teroneko/redux-saga-promise";
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';


import {
  EntityDefinition,
  Instance,
  InstanceCollection,
  RemoteStoreAction, RemoteStoreActionReturnType, RemoteStoreNetworkClientInterface, stringTuple
} from "miroir-core";
import { SagaGenReturnType } from 'miroir-fwk/4_services/remoteStore/EntityRemoteAccessReduxSaga';
import miroirConfig from "miroir-fwk/assets/miroirConfig.json";
import { handlePromiseActionForSaga } from 'sagaTools';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

export function getPromiseActionStoreActionNames(promiseActionNames:string[]):string[] {
  return promiseActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}


//#########################################################################################
//# ACTION NAMES
//#########################################################################################
const instanceSagaInputActionNamesObject = {
  'fetchInstancesForEntityListFromRemoteDatastore':'fetchInstancesForEntityListFromRemoteDatastore',
  'fetchInstancesForEntityFromRemoteDatastore':'fetchInstancesForEntityFromRemoteDatastore',
  'handleRemoteStoreAction':'handleRemoteStoreAction',
};
export type instanceSagaInputActionName = keyof typeof instanceSagaInputActionNamesObject;
export const instanceSagaInputActionNamesArray:instanceSagaInputActionName[] = 
  Object.keys(instanceSagaInputActionNamesObject) as instanceSagaInputActionName[];
export const instanceSagaGeneratedActionNames = getPromiseActionStoreActionNames(instanceSagaInputActionNamesArray);


//#########################################################################################
// events sent by the InstanceSlice, that can be intercepted and acted upon by the outside world
export const instanceSagaOutputActionNames = stringTuple(
  'instancesRefreshedForEntity', 'allInstancesRefreshed'
);
export type instanceSagaOutputActionTypeString = typeof instanceSagaOutputActionNames[number];

//#########################################################################################
//# SLICE
//#########################################################################################
export type InstanceSagaStringActionPayload = string;
export type InstanceSagaEntitiesActionPayload = EntityDefinition[];

export type InstanceSagaAction = PayloadAction<InstanceSagaEntitiesActionPayload|InstanceSagaStringActionPayload>;


//#########################################################################################
//# SLICE
//#########################################################################################
export class InstanceRemoteAccessReduxSaga {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  constructor(private client: RemoteStoreNetworkClientInterface) // public mInstanceSlice:Slice,
  {}

  private entitiesToFetch: string[] = [];
  private entitiesAlreadyFetched: string[] = [];

  // public instanceSagaHandlePromiseAction = promiseActionFactory<RemoteStoreActionReturnType>().create<DomainAction>(
  //   this.instanceSagaInputActionNamesObject.handleLocalCacheAction
  // );

//#########################################################################################
public instanceSagaInputPromiseActions:{
    [property in instanceSagaInputActionName]
    : {
      name: property,
      creator:SagaPromiseActionCreator<
        any,
        any,
        property,
        ActionCreatorWithPayload<any, property>
      >,
      generator:(any) => SagaGenReturnType
    }
  } = {
    fetchInstancesForEntityListFromRemoteDatastore:{
      name: "fetchInstancesForEntityListFromRemoteDatastore",
      creator: promiseActionFactory<InstanceCollection[]>().create<EntityDefinition[],"fetchInstancesForEntityListFromRemoteDatastore">(
        "fetchInstancesForEntityListFromRemoteDatastore"
      ),
      generator:function* (
        action: PayloadAction<EntityDefinition[]>
      ): SagaGenReturnType {
        console.log("fetchInstancesForEntityListFromRemoteDatastore saga launched with action", action);
        const entityNames: string[] = action.payload.map((e: EntityDefinition) => e.name);
        this.entitiesToFetch = entityNames.slice();
        this.entitiesAlreadyFetched = [];
        console.log("fetchInstancesForEntityListFromRemoteDatastore entitiesToFetch", this.entitiesToFetch);
        try {
          const receivedInstances:RemoteStoreActionReturnType[] = yield all(
            entityNames.map(
              (e: string) => {
                console.log("fetchInstancesForEntityListFromRemoteDatastore fetching entity",e);
                return putResolve(this.instanceSagaInputPromiseActions.fetchInstancesForEntityFromRemoteDatastore.creator(e))
              }
            )
          );
          console.log("fetchInstancesForEntityListFromRemoteDatastore received all instances",receivedInstances);
          return {status: 'ok', instances:receivedInstances.map(i=>i.instances)};
        } catch (error) {
          console.log("fetchInstancesForEntityListFromRemoteDatastore error", error);
        } finally {
          console.log("fetchInstancesForEntityListFromRemoteDatastore finished");
        }
      }.bind(this)
    },
    fetchInstancesForEntityFromRemoteDatastore: {
      name: "fetchInstancesForEntityFromRemoteDatastore",
      creator: promiseActionFactory<Instance[]>().create<string,"fetchInstancesForEntityFromRemoteDatastore">("fetchInstancesForEntityFromRemoteDatastore"),
      generator: function*(action:PayloadAction<string>):SagaGenReturnType {
        console.log("fetchInstancesForEntityFromRemoteDatastore", action);
        try {
          const result: {
            status: number,
            data: any,
            headers: Headers,
            url: string,
          } = yield call(() => this.client.get(miroirConfig.rootApiUrl + "/" + action.payload + "/all"));
          return {status:'ok', instances:{entity:action.payload, instances:result['data']}};
        } catch (e) {
          console.warn("fetchInstancesForEntityFromRemoteDatastore", e);
          yield put({ type: "instance/failure/instancesNotReceived" });
        }
      }.bind(this)
    },
    handleRemoteStoreAction: {
      name: "handleRemoteStoreAction",
      creator: promiseActionFactory<Instance[]>().create<string,"handleRemoteStoreAction">("handleRemoteStoreAction"),
      generator: function*(action:PayloadAction<RemoteStoreAction>):SagaGenReturnType {
        try {
          console.log("InstanceRemoteAccessReduxSaga handleRemoteStoreAction",action);
          const result:RemoteStoreActionReturnType = yield putResolve(this.instanceSagaInputPromiseActions.fetchInstancesForEntityListFromRemoteDatastore.creator(action.payload.objects));
          console.log("InstanceRemoteAccessReduxSaga handleRemoteStoreAction received result", result.status, result.instances);
          return yield { status: "ok", instances: result.instances };
        } catch (e: any) {
          console.warn("InstanceRemoteAccessReduxSaga handleRemoteStoreAction exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreActionReturnType;
        }
      }.bind(this)
    },
  };

//#########################################################################################
// public instanceSliceInputPromiseActions:{
//   [property in keyof instanceSliceInputActionNamesObjectTuple]
//   : 
//     {
//       name: property,
//       creator:SagaPromiseActionCreator<
//         any,
//         any,
//         property,
//         ActionCreatorWithPayload<any, property>
//       >,
//       // generator:() => Generator<EntityDefinition[]>
//       // generator:(any) => Generator<SagaGenReturnType>
//       generator:(any) => SagaGenReturnType
//     }
// } = {
//   AddInstancesForEntity:{
//     name: "AddInstancesForEntity",
//     creator: promiseActionFactory<void>().create<Instance[],"AddInstancesForEntity">("AddInstancesForEntity"),
//     generator: function *(action):SagaGenReturnType {
//       // console.log("entityRootSaga entitySlicePromiseAction",action)
//       return yield putResolve(InstanceSlice.actionCreators["AddInstancesForEntity"](action.payload))
//     }
//   },
//   ReplaceInstancesForEntity: {
//     name: "ReplaceInstancesForEntity",
//     creator: promiseActionFactory<void>().create<InstanceCollection,"ReplaceInstancesForEntity">("ReplaceInstancesForEntity"),
//     generator: function *(action:PayloadAction<InstanceCollection>):SagaGenReturnType {
//       console.log("instanceSliceInputPromiseActions ReplaceInstancesForEntity",action);
//       yield putResolve(InstanceSlice.actionCreators["ReplaceInstancesForEntity"](action.payload));
//       return undefined;
//     }
//   },
//   // ReplaceAllInstances: {
//   //   name: "ReplaceAllInstances",
//   //   creator: promiseActionFactory<void>().create<string,"ReplaceAllInstances">("ReplaceAllInstances"),
//   //   generator: 
//   //     function *(action:PayloadAction<InstanceCollection[]>):SagaGenReturnType {
//   //       const putResolves = action.payload.map(
//   //         function (a) {
//   //           // return {entity:a.entity, put:putResolve(this.instanceSliceInputPromiseActions.ReplaceInstancesForEntity.creator(a))}
//   //           return {entity:a.entity, put:putResolve(InstanceSlice.actionCreators["ReplaceInstancesForEntity"](a))}
//   //         },this
//   //       );
//   //       console.log("instanceSliceInputPromiseActions ReplaceAllInstances",action,putResolves);
//   //       for(let f of putResolves) {
//   //         console.log("instanceSliceInputPromiseActions yield for entity",f.entity);
//   //         yield f.put;
//   //       }
//   //       return undefined;
//   //     }.bind(this)
//   // },
//   UpdateInstancesForEntity: {
//     name: "UpdateInstancesForEntity",
//     creator: promiseActionFactory<Instance[]>().create<string,"UpdateInstancesForEntity">("UpdateInstancesForEntity"),
//     generator: function *(action):SagaGenReturnType {
//       // console.log("entityRootSaga entitySlicePromiseAction",action)
//       return yield putResolve(InstanceSlice.actionCreators["UpdateInstancesForEntity"](action.payload))
//     }
//   },
// };
  
  // //#########################################################################################
  // *fetchInstancesForEntityListFromRemoteDatastore(
  //   action: PayloadAction<EntityDefinition[]>
  // ): SagaGenReturnType {
  //   console.log("fetchInstancesForEntityListFromRemoteDatastore saga launched with action", action);
  //   const entityNames: string[] = action.payload.map((e: EntityDefinition) => e.name);
  //   this.entitiesToFetch = entityNames.slice();
  //   this.entitiesAlreadyFetched = [];
  //   console.log("fetchInstancesForEntityListFromRemoteDatastore entitiesToFetch", this.entitiesToFetch);
  //   // console.log("fetchInstancesForEntityListFromRemoteDatastore this.instanceSagaInputPromiseActions.fetchInstancesForEntityFromRemoteDatastore", this.instanceSagaInputPromiseActions.fetchInstancesForEntityFromRemoteDatastore);
  //   try {
  //     const receivedInstances:RemoteStoreActionReturnType[] = yield all(
  //       entityNames.map(
  //         (e: string) => {
  //           // const action = this.instanceSagaInternalActionsCreators.fetchInstancesFromDatastoreForEntity(e);
  //           console.log("fetchInstancesForEntityListFromRemoteDatastore fetching entity",e);
  //           // return put(this.instanceSagaInternalActionsCreators.fetchInstancesFromDatastoreForEntity(e))
  //           return putResolve(this.instanceSagaInputPromiseActions.fetchInstancesForEntityFromRemoteDatastore.creator(e))
  //         }
  //       )
  //     );
  //     console.log("fetchInstancesForEntityListFromRemoteDatastore received all instances",receivedInstances);
  //     return {status: 'ok', instances:receivedInstances.map(i=>i.instances)};
  //   } catch (error) {
  //     console.log("fetchInstancesForEntityListFromRemoteDatastore error", error);
  //   } finally {
  //     console.log("fetchInstancesForEntityListFromRemoteDatastore finished");
  //   }
  // }

  //#########################################################################################
  // takes entity fetch notifications into account and sends a global notification when done.
  *instancesHaveBeenFecthedForEntity(
    action: PayloadAction<string>
  ): SagaGenReturnType {
    try {
      console.log("instancesHaveBeenFecthedForEntity", action, "left to fetch", this.entitiesToFetch);
      const id: number = this.entitiesToFetch.indexOf(action.payload);
      if (id !== undefined) {
        this.entitiesAlreadyFetched.push(this.entitiesToFetch[id]);
        this.entitiesToFetch.splice(id, 1);
      }
      console.log(
        "instancesHaveBeenFecthedForEntity",
        action.payload,
        id,
        "left to fetch",
        this.entitiesToFetch,
        "already fetched",
        this.entitiesAlreadyFetched
      );
      if (this.entitiesToFetch.length == 0) {
        return yield put({ type: "allInstancesRefreshed", status: "OK" });
      }
    } catch (error) {
      console.log("instancesHaveBeenFecthedForEntity error", error);
    } finally {
      console.log("instancesHaveBeenFecthedForEntity finished");
    }
  }

    // //#########################################################################################
    // public *handleLocalCacheAction(action: PayloadAction<DomainAction>): SagaGenReturnType {
    //   try {
    //     console.log("EntityRemoteAccessReduxSaga handleAction",action);
    //     // throw new Error("TEST");
  
    //     const result: RestClientCallReturnType = yield call(() =>
    //       // this.client.get(miroirConfig.rootApiUrl + "/" + "Entity/all")
    //       this.client.handleNetworkAction(action.payload as RemoteStoreAction)
    //     );
    //     // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
    //     console.log("handleAction received result", result.status, result.data);
    //     return yield { status: "ok", instances: [{ entity: "Entity", instances: result.data }] };
    //   } catch (e: any) {
    //     console.warn("handleAction exception", e);
    //     yield put({ type: "entities/failure/entitiesNotReceived" });
    //     return {
    //       status: "error",
    //       errorMessage: e["message"],
    //       error: { errorMessage: e["message"], stack: [e["message"]] },
    //     } as RemoteStoreActionReturnType;
    //   }
    // }
  
  //#########################################################################################
  public *instanceRootSaga(
  ):SagaGenReturnType {
    yield all(
      [
        ...Object.values(this.instanceSagaInputPromiseActions).map(
          a => takeEvery(
            a.creator,
            handlePromiseActionForSaga(a.generator)
          )
        ),
        // ...Object.values(this.instanceSliceInputPromiseActions).map(
        //   a => takeEvery(
        //     a.creator,
        //     handlePromiseActionForSaga(a.generator)
        //   )
        // )
      ]
    );
  }

  //#########################################################################################
  // interface of events creators allowing the outside world to send events to the InstanceSlice.
  public instanceSagaInputActionsCreators = {
    // fetchInstancesForEntityListFromRemoteDatastore: (action) => this.instanceSagaInputPromiseActions.fetchInstancesForEntityListFromRemoteDatastore(action),
    // handleRemoteStoreAction: this.entitySagaRemoteCRUDActionHandler,
    fetchInstancesForEntityListFromRemoteDatastore: this.instanceSagaInputPromiseActions.fetchInstancesForEntityListFromRemoteDatastore.creator,
  };

  //#########################################################################################
  //# SELECTORS
  //#########################################################################################
}// end class Mslice

export default InstanceRemoteAccessReduxSaga;

