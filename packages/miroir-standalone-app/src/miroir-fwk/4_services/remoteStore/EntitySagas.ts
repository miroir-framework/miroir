import { promiseActionFactory } from '@teroneko/redux-saga-promise';
import { StoreReturnType } from 'miroir-core';
import { all, call, Effect, put, putResolve, takeEvery } from 'redux-saga/effects';


import { handlePromiseActionForSaga } from 'src/miroir-fwk/4_services/localStore/ReduxStore';
import { MClientCallReturnType, MclientI } from 'src/miroir-fwk/4_services/remoteStore/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { stringTuple } from 'src/miroir-fwk/tools';
import {
  EntityAction,
  entitySliceActionsCreators,
  entitySliceInputActionNames,
  entitySliceInputActionNamesObject,
  entitySlicePromiseAction
} from "../localStore/EntitySlice";

// import entityEntity from "src/miroir-fwk/assets/entities/Entity.json"
// import entityReport from "src/miroir-fwk/assets/entities/Report.json"
// import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

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
export class EntitySagas {
  constructor(
    public client: MclientI,
  ) {
    // console.log("EntitySlice constructor",client)
  }

  public entitySagaInputActionNamesObject = {
    fetchAllEntityDefinitionsFromRemoteDatastore:"fetchAllEntityDefinitionsFromRemoteDatastore",
  }

  
  public entitySagaInputActionNames = Object.values(this.entitySagaInputActionNamesObject);
  public entitySagaGeneratedActionNames = getPromiseActionStoreActionNames(entitySliceInputActionNames);

  public entitySagaPromiseAction = promiseActionFactory<StoreReturnType>().create(this.entitySagaInputActionNamesObject.fetchAllEntityDefinitionsFromRemoteDatastore);

  //#########################################################################################
  public *fetchAllEntityDefinitionsFromRemoteDatastore(
    // action:any
  ):SagaGenReturnType {
    try {
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore");
      // throw new Error("TEST");
      

      const result:MClientCallReturnType = yield call(
        () => this.client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore received", result.status, result.data);
      return yield {status:'ok',  instances:[{entity:'Entity', instances:result.data}]}
    } catch (e:any) {
      console.warn("fetchAllEntityDefinitionsFromRemoteDatastore exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
      return {status:'error', errorMessage: e['message'], error:{errorMessage: e['message'], stack:[e['message']]}} as StoreReturnType;
    }
  }

  // [entitySliceInputActionNamesObject.replaceAllEntityDefinitions]

  // #########################################################################################
  public *entityRootSaga(
    // action: PayloadAction<EntityDefinition[]>
  ):SagaGenReturnType {
    console.log("entityRootSaga running...", this);
    yield all(
      [
        takeEvery(
          this.entitySagaPromiseAction,
          handlePromiseActionForSaga(
            this.fetchAllEntityDefinitionsFromRemoteDatastore,
            this
          )
        ),
        takeEvery(
          entitySlicePromiseAction,
          handlePromiseActionForSaga(
            function *(action:EntityAction):SagaGenReturnType {
              console.log("entityRootSaga entitySlicePromiseAction",action)
              yield putResolve(entitySliceActionsCreators[entitySliceInputActionNamesObject.replaceAllEntityDefinitions](action.payload));
              return {entity: 'Entity', instances: action.payload};
            }
          )
        ),
      ]
    )
  }

  //#########################################################################################
  //# ACTION DEFINITIONS
  //#########################################################################################
  public entitySagaInputActionsCreators = {
    fetchAllEntityDefinitionsFromRemoteDatastore:()=>this.entitySagaPromiseAction(),
    // [entitySliceInputActionNamesObject.replaceAllEntityDefinitions]: entitySliceActionsCreators[entitySliceInputActionNamesObject.replaceAllEntityDefinitions],
  }
} // end class EntitySlice
