import { promiseActionFactory } from '@teroneko/redux-saga-promise';
import { all, call, Effect, put, putResolve, takeEvery } from 'redux-saga/effects';


import { NetworkCRUDAction, RemoteStoreNetworkClientInterface, RestClientCallReturnType, RestClientInterface } from 'miroir-core';
import { DomainAction, StoreReturnType } from 'miroir-core';
import { stringTuple } from 'miroir-core';

import { handlePromiseActionForSaga } from 'sagaTools';
import {
  EntityAction,
  entitySliceActionsCreators,
  entitySliceInputActionNames,
  entitySliceInputActionNamesObject,
  entitySlicePromiseAction
} from "miroir-fwk/4_services/localStore/EntityReduxSlice";
import { PayloadAction } from '@reduxjs/toolkit';

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
export const EntitySagaOutputActionNames = stringTuple(
  'allEntityDefinitionsHaveBeenFetched',
);
export type EntitySagaOutputActionTypeString = typeof EntitySagaOutputActionNames[number];

function getPromiseActionStoreActionNames(promiseActionNames:string[]):string[] {
  return promiseActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}

// export interface

// export type SagaGenReturnType = Generator<Instance[]>;
export type SagaGenReturnType = Effect | Generator<StoreReturnType>;

//#########################################################################################
//# SAGA
//#########################################################################################
export class EntityRemoteAccessReduxSaga {
  // constructor(public client: RestClientInterface) {
  constructor(public client: RemoteStoreNetworkClientInterface) {
    // console.log("EntitySlice constructor",client)
  }

  public entitySagaInputActionNamesObject = {
    // fetchAllEntityDefinitionsFromRemoteDatastore: "fetchAllEntityDefinitionsFromRemoteDatastore",
    handleAction: "handleAction",
  };

  public entitySagaInputActionNames = Object.values(this.entitySagaInputActionNamesObject);
  public entitySagaGeneratedActionNames = getPromiseActionStoreActionNames(entitySliceInputActionNames);

  // public entitySagaPromiseAction = promiseActionFactory<StoreReturnType>().create(
  //   this.entitySagaInputActionNamesObject.fetchAllEntityDefinitionsFromRemoteDatastore
  // );

  public entitySagaRemoteCRUDActionHandler = promiseActionFactory<StoreReturnType>().create<DomainAction>(
    this.entitySagaInputActionNamesObject.handleAction
  );

  //#########################################################################################
  // public *fetchAllEntityDefinitionsFromRemoteDatastore(): SagaGenReturnType {
  //   // try {
  //     console.log("fetchAllEntityDefinitionsFromRemoteDatastore");
  //     // throw new Error("TEST");

  //   //   const result: RestClientCallReturnType = yield call(() =>
  //   //     this.client.get(miroirConfig.rootApiUrl + "/" + "Entity/all")
  //   //   );
  //   //   // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
  //   //   console.log("fetchAllEntityDefinitionsFromRemoteDatastore received", result.status, result.data);
  //   //   return yield { status: "ok", instances: [{ entity: "Entity", instances: result.data }] };
  //   // } catch (e: any) {
  //   //   console.warn("fetchAllEntityDefinitionsFromRemoteDatastore exception", e);
  //   //   yield put({ type: "entities/failure/entitiesNotReceived" });
  //   //   return {
  //   //     status: "error",
  //   //     errorMessage: e["message"],
  //   //     error: { errorMessage: e["message"], stack: [e["message"]] },
  //   //   } as StoreReturnType;
  //   // }
  // }

  //#########################################################################################
  public *handleRemoteCRUDAction(action: PayloadAction<NetworkCRUDAction>): SagaGenReturnType {
    try {
      console.log("EntityRemoteAccessReduxSaga handleRemoteCRUDAction",action);
      // throw new Error("TEST");

      const result: RestClientCallReturnType = yield call(() =>
        // this.client.get(miroirConfig.rootApiUrl + "/" + "Entity/all")
        this.client.handleNetworkAction(action.payload as NetworkCRUDAction)
      );
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("handleRemoteCRUDAction received result", result.status, result.data);
      return yield { status: "ok", instances: [{ entity: "Entity", instances: result.data }] };
    } catch (e: any) {
      console.warn("handleRemoteCRUDAction exception", e);
      yield put({ type: "entities/failure/entitiesNotReceived" });
      return {
        status: "error",
        errorMessage: e["message"],
        error: { errorMessage: e["message"], stack: [e["message"]] },
      } as StoreReturnType;
    }
  }

  // #########################################################################################
  public *entityRootSaga(): SagaGenReturnType {
    console.log("entityRootSaga running...", this);
    yield all([
      // takeEvery(
      //   this.entitySagaPromiseAction,
      //   handlePromiseActionForSaga(this.fetchAllEntityDefinitionsFromRemoteDatastore, this)
      // ),
      takeEvery(
        this.entitySagaRemoteCRUDActionHandler,
        handlePromiseActionForSaga(this.handleRemoteCRUDAction, this)
      ),
      // takeEvery(
      //   entitySlicePromiseAction,
      //   handlePromiseActionForSaga(function* (action: EntityAction): SagaGenReturnType {
      //     console.log("entityRootSaga entitySlicePromiseAction", action);
      //     yield putResolve(
      //       entitySliceActionsCreators[entitySliceInputActionNamesObject.replaceAllEntityDefinitions](action.payload)
      //     );
      //     return { entity: "Entity", instances: action.payload };
      //   })
      // ),
    ]);
  }

  //#########################################################################################
  //# ACTION DEFINITIONS
  //#########################################################################################
  public entitySagaInputActionsCreators = {
    // fetchAllEntityDefinitionsFromRemoteDatastore: () => this.entitySagaPromiseAction(),
    handleRemoteCRUDAction: this.entitySagaRemoteCRUDActionHandler,
    // [entitySliceInputActionNamesObject.replaceAllEntityDefinitions]: entitySliceActionsCreators[entitySliceInputActionNamesObject.replaceAllEntityDefinitions],
  };
} // end class EntitySlice
