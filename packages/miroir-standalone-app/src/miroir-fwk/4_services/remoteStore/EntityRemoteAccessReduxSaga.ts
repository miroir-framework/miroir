import { promiseActionFactory } from '@teroneko/redux-saga-promise';
import { all, call, Effect, put, putResolve, takeEvery } from 'redux-saga/effects';


import { RemoteStoreAction, RemoteStoreNetworkClientInterface, RestClientCallReturnType, RestClientInterface } from 'miroir-core';
import { DomainAction, RemoteStoreActionReturnType } from 'miroir-core';
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
export type SagaGenReturnType = Effect | Generator<RemoteStoreActionReturnType>;

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

  // public entitySagaPromiseAction = promiseActionFactory<RemoteStoreActionReturnType>().create(
  //   this.entitySagaInputActionNamesObject.fetchAllEntityDefinitionsFromRemoteDatastore
  // );

  public entitySagaRemoteCRUDActionHandler = promiseActionFactory<RemoteStoreActionReturnType>().create<DomainAction>(
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
  //   //   } as RemoteStoreActionReturnType;
  //   // }
  // }

  //#########################################################################################
  public *handleRemoteStoreAction(action: PayloadAction<RemoteStoreAction>): SagaGenReturnType {
    try {
      console.log("EntityRemoteAccessReduxSaga handleRemoteStoreAction",action);
      // throw new Error("TEST");

      const result: RestClientCallReturnType = yield call(() =>
        // this.client.get(miroirConfig.rootApiUrl + "/" + "Entity/all")
        this.client.handleNetworkAction(action.payload as RemoteStoreAction)
      );
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("handleRemoteStoreAction received result", result.status, result.data);
      return yield { status: "ok", instances: [{ entity: "Entity", instances: result.data }] };
    } catch (e: any) {
      console.warn("handleRemoteStoreAction exception", e);
      yield put({ type: "entities/failure/entitiesNotReceived" });
      return {
        status: "error",
        errorMessage: e["message"],
        error: { errorMessage: e["message"], stack: [e["message"]] },
      } as RemoteStoreActionReturnType;
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
        handlePromiseActionForSaga(this.handleRemoteStoreAction, this)
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
    handleRemoteStoreAction: this.entitySagaRemoteCRUDActionHandler,
    // [entitySliceInputActionNamesObject.replaceAllEntityDefinitions]: entitySliceActionsCreators[entitySliceInputActionNamesObject.replaceAllEntityDefinitions],
  };
} // end class EntitySlice
