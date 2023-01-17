import { promiseActionFactory } from '@teroneko/redux-saga-promise';
import { all, call, Effect, put, putResolve, takeEvery } from 'redux-saga/effects';
import { Instance } from 'src/miroir-fwk/0_interfaces/1_core/Instance';
import { StoreReturnType } from 'src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface';


import { stringTuple } from 'src/miroir-fwk/1_core/utils/utils';
import { handlePromiseActionForSaga } from 'src/miroir-fwk/4_storage/local/ReduxStore';
import { MClientCallReturnType, MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { EntityAction, entitySliceActionsCreators, entitySliceInputActionNames, entitySliceInputActionNamesObject, entitySlicePromiseAction } from '../local/EntitySlice';

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
    // ['saga' + entitySliceInputActionNamesObject.replaceAllEntityDefinitions]:'saga' + entitySliceInputActionNamesObject.replaceAllEntityDefinitions,
  }

  
  public entitySagaInputActionNames = Object.values(this.entitySagaInputActionNamesObject);
  public entitySagaGeneratedActionNames = getPromiseActionStoreActionNames(entitySliceInputActionNames);

  public entitySagaPromiseAction = promiseActionFactory<StoreReturnType>().create(this.entitySagaInputActionNamesObject.fetchAllEntityDefinitionsFromRemoteDatastore);

  //#########################################################################################
  public *fetchAllEntityDefinitionsFromRemoteDatastore(
    action:any
  ):SagaGenReturnType {
    try {
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore action",action,"start client",this.client);
      throw new Error("TEST");
      

      const result:MClientCallReturnType = yield call(
        () => this.client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore received", result.status, result.data);
      return yield result.data
    } catch (e:any) {
      console.warn("fetchAllEntityDefinitionsFromRemoteDatastore exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
      return {errorMessage: e['message']};
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
              return {instances: action.payload};
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
