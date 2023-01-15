import { promiseActionFactory } from '@teroneko/redux-saga-promise';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';


import { stringTuple } from 'src/miroir-fwk/1_core/utils/utils';
import { handlePromiseActionForSaga } from 'src/miroir-fwk/4_storage/local/ReduxStore';
import { MClientCallReturnType, MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { mEntitySliceActionsCreators, mEntitySliceInputActionNames } from '../local/EntitySlice';

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
    fetchAllEntityDefinitionsFromRemoteDatastore:"entities/fetchAllEntityDefinitionsFromRemoteDatastore",
  }
  public entitySagaInputActionNames = Object.values(this.entitySagaInputActionNamesObject);

  public entitySagaPromiseAction = promiseActionFactory<any>().create(this.entitySagaInputActionNamesObject.fetchAllEntityDefinitionsFromRemoteDatastore);

  //#########################################################################################
  public *fetchAllEntityDefinitionsFromRemoteDatastore(
    action:any
  ):any {
    try {
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore action",action,"start client",this.client)
      const result:MClientCallReturnType = yield call(
        () => this.client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore received", result.status, result.data);
      yield putResolve(mEntitySliceActionsCreators[mEntitySliceInputActionNames.replaceEntities](result.data))
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore return yield");
      return yield result.data
    } catch (e) {
      console.log("fetchAllEntityDefinitionsFromRemoteDatastore exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
    }
  }

  // #########################################################################################
  public *entityRootSaga(
  ) {
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
      ]
    )
  }

  //#########################################################################################
  //# ACTION DEFINITIONS
  //#########################################################################################
  public mEntitySagaInputActionsCreators = {
    fetchAllEntityDefinitionsFromRemoteDatastore:()=>this.entitySagaPromiseAction(),
  }
} // end class EntitySlice
