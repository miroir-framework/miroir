import { ActionCreatorWithPayload, createAction, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseActionFactory,
  SagaPromiseActionCreator
} from "@teroneko/redux-saga-promise";
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';


import { EntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { Instance } from 'src/miroir-fwk/0_interfaces/1_core/Instance';
import { stringTuple } from 'src/miroir-fwk/1_core/utils/utils';
import { handlePromiseActionForSaga } from 'src/miroir-fwk/4_storage/local/ReduxStore';
import { MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import instanceSliceObject, { instanceSliceInputActionNamesObject, instanceSliceInputActionNamesObjectTuple } from '../local/InstanceSlice';

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
export const instanceSagaInputActionNamesObject = {
  'fetchInstancesForEntityListFromRemoteDatastore':'fetchInstancesForEntityListFromRemoteDatastore',
  'fetchInstancesFromDatastoreForEntity':'fetchInstancesFromDatastoreForEntity',
};
type instanceSagaInputActionNamesObjectTuple = typeof instanceSagaInputActionNamesObject;
type instanceSagaInputActionNamesKey = keyof instanceSagaInputActionNamesObjectTuple;
export const instanceSagaInputActionNames:instanceSagaInputActionNamesKey[] = 
  Object.keys(instanceSagaInputActionNamesObject) as instanceSagaInputActionNamesKey[];
export const instanceSagaGeneratedActionNames = getPromiseActionStoreActionNames(instanceSagaInputActionNames);


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
export class InstanceSagas {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  constructor(private client: MclientI) // public mInstanceSlice:Slice,
  {}

  private entitiesToFetch: string[] = [];
  private entitiesAlreadyFetched: string[] = [];

  public instanceSagaInputPromiseActions:{
    [property in keyof instanceSagaInputActionNamesObjectTuple]
    : {
      name: property,
      creator:SagaPromiseActionCreator<
        any,
        any,
        property,
        ActionCreatorWithPayload<any, property>
      >,
      // generator:() => Generator<EntityDefinition[]>
      generator:(any) => Generator<any>
    }
  } = {
    fetchInstancesForEntityListFromRemoteDatastore:{
      name: "fetchInstancesForEntityListFromRemoteDatastore",
      creator: promiseActionFactory<EntityDefinition[]>().create<EntityDefinition[],"fetchInstancesForEntityListFromRemoteDatastore">(
        "fetchInstancesForEntityListFromRemoteDatastore"
      ),
      generator:this.fetchInstancesForEntityListFromRemoteDatastore.bind(this)
    },
    fetchInstancesFromDatastoreForEntity: {
      name: "fetchInstancesFromDatastoreForEntity",
      creator: promiseActionFactory<any>().create<string,"fetchInstancesFromDatastoreForEntity">("fetchInstancesFromDatastoreForEntity"),
      generator: this.fetchInstancesFromDatastoreForEntity.bind(this)
    }
  };

  public instanceSliceInputPromiseActions:{
    [property in keyof instanceSliceInputActionNamesObjectTuple]
    : {
      name: property,
      creator:SagaPromiseActionCreator<
        any,
        any,
        property,
        ActionCreatorWithPayload<any, property>
      >,
      // generator:() => Generator<EntityDefinition[]>
      generator:(any) => Generator<any>
    }
  } = {
    AddInstancesForEntity:{
      name: "AddInstancesForEntity",
      creator: promiseActionFactory<void>().create<Instance[],"AddInstancesForEntity">("AddInstancesForEntity"),
      generator: function *(action) {
        // console.log("entityRootSaga entitySlicePromiseAction",action)
        return yield putResolve(instanceSliceObject.actionCreators["AddInstancesForEntity"](action.payload))
      }
    },
    ReplaceInstancesForEntity: {
      name: "ReplaceInstancesForEntity",
      creator: promiseActionFactory<Instance[]>().create<string,"ReplaceInstancesForEntity">("ReplaceInstancesForEntity"),
      generator: function *(action) {
        console.log("instanceSliceInputPromiseActions ReplaceInstancesForEntity",action)
        yield putResolve(instanceSliceObject.actionCreators["ReplaceInstancesForEntity"](action.payload));
        return action.payload;
      }
    },
    UpdateInstancesForEntity: {
      name: "UpdateInstancesForEntity",
      creator: promiseActionFactory<Instance[]>().create<string,"UpdateInstancesForEntity">("UpdateInstancesForEntity"),
      generator: function *(action) {
        // console.log("entityRootSaga entitySlicePromiseAction",action)
        return yield putResolve(instanceSliceObject.actionCreators["UpdateInstancesForEntity"](action.payload))
      }
    },
  };


  private instanceSagaInternalActionNames = {
    fetchInstancesFromDatastoreForEntity: "instances/fetchInstancesFromDatastoreForEntity",
    instancesHaveBeenFecthedForEntity:  "instancesHaveBeenFecthedForEntity",
  };
  
  
  //#########################################################################################
  *fetchInstancesFromDatastoreForEntity(
    action: PayloadAction<string>
  ): any {
    console.log("fetchInstancesFromDatastoreForEntity", action)
    try {
      const result: {
        status: number;
        data: any;
        headers: Headers;
        url: string;
      } = yield call(() => this.client.get(miroirConfig.rootApiUrl + "/" + action.payload + "/all"));
      yield putResolve(
        instanceSliceObject.actionCreators[instanceSliceInputActionNamesObject.ReplaceInstancesForEntity]({
          instances: result.data,
          entity: action.payload,
        })
      );
      return yield put(
        this.instanceSagaInternalActionsCreators[this.instanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity](
          action.payload
        )
      );
    } catch (e) {
      console.warn("fetchInstancesForEntity", e);
      yield put({ type: "instance/failure/instancesNotReceived" });
    }
  }

  //#########################################################################################
  *fetchInstancesForEntityListFromRemoteDatastore(
    action: PayloadAction<EntityDefinition[]>
  ): any {
    console.log("fetchInstancesFromDatastoreForEntityList saga launched with action", action);
    const entityNames: string[] = action.payload.map((e: EntityDefinition) => e.name);
    this.entitiesToFetch = entityNames.slice();
    this.entitiesAlreadyFetched = [];
    console.log("fetchInstancesFromDatastoreForEntityList entitiesToFetch", this.entitiesToFetch);
    try {
      yield all(
        entityNames.map(
          (e: string) => {
            const action = this.instanceSagaInternalActionsCreators.fetchInstancesFromDatastoreForEntity(e);
            console.log("fetchInstancesFromDatastoreForEntityList fetching entity",action);
            return put(this.instanceSagaInternalActionsCreators.fetchInstancesFromDatastoreForEntity(e))
          }
        )
      );
      return action.payload;
    } catch (error) {
      console.log("fetchInstancesFromDatastoreForEntityList error", error);
    } finally {
      console.log("fetchInstancesFromDatastoreForEntityList finished");
    }
  }

  //#########################################################################################
  // takes entity fetch notifications into account and sends a global notification when done.
  *instancesHaveBeenFecthedForEntity(
    action: PayloadAction<string>
  ): any {
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

  //#########################################################################################
  public *instanceRootSaga(
  ) {
    yield all(
      [
        takeEvery(
          this.instanceSagaInternalActionNames.fetchInstancesFromDatastoreForEntity,
          this.fetchInstancesFromDatastoreForEntity.bind(this),
        ),
        takeEvery(
          this.instanceSagaInputPromiseActions.fetchInstancesForEntityListFromRemoteDatastore.name,
          handlePromiseActionForSaga(
            this.fetchInstancesForEntityListFromRemoteDatastore,
            this
          )
        ),
        ...Object.values(this.instanceSliceInputPromiseActions).map(
          a => takeEvery(
            a.creator,
            handlePromiseActionForSaga(a.generator)
          )
        )
      ]
    );
  }

  //#########################################################################################
  //# ACTIONS
  //#########################################################################################
  // actions sent by the InstanceSlice, to itself or to the oustide world.
  public instanceSagaInternalActionsCreators: any = {
    fetchInstancesFromDatastoreForEntity: createAction<string>(
      this.instanceSagaInternalActionNames.fetchInstancesFromDatastoreForEntity
    ),
    instancesHaveBeenFecthedForEntity: createAction<string>(
      this.instanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity
    ),
  };

  //#########################################################################################
  // interface of events creators allowing the outside world to send events to the InstanceSlice.
  public instanceSagaInputActionsCreators = {
    // fetchInstancesForEntityListFromRemoteDatastore: (action) => this.instanceSagaInputPromiseActions.fetchInstancesForEntityListFromRemoteDatastore(action),
    fetchInstancesForEntityListFromRemoteDatastore: this.instanceSagaInputPromiseActions.fetchInstancesForEntityListFromRemoteDatastore.creator,
  };

  //#########################################################################################
  //# SELECTORS
  //#########################################################################################
}// end class Mslice

export default InstanceSagas;

