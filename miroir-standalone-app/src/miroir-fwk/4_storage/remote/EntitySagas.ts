import { createAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';

import { MClientCallReturnType, MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';

import { LocalStoreEvent } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreInterface';
import { stringTuple } from 'src/miroir-fwk/1_core/utils/utils';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { mEntitySliceActionsCreators, mEntitySliceInputActionNames } from '../local/EntitySlice';

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
export const EntitySagaOutputActionNames = stringTuple(
  'allEntityDefinitionsHaveBeenLocallyStored',
);
export type EntitySagaOutputActionTypeString = typeof EntitySagaOutputActionNames[number];

const mEntitySagaInputActionNames = {
  fetchAllEntityDefinitionsFromDatastore:"entities/fetchAllEntityDefinitionsFromDatastore",
}

//#########################################################################################
//# SAGA
//#########################################################################################
export class EntitySagas {
  constructor(
    public client: MclientI,
  ) {
    // console.log("EntitySlice constructor",client)
  }

  //#########################################################################################
  *fetchAllEntityDefinitionsFromDatastore(
    // _this:EntitySagas,
    outputChannel:Channel<LocalStoreEvent>,
  ):any {
    try {
      // const _client = _this.client;
      console.log("fetchAllMEntitiesFromDatastore start client",this.client)
      const result:MClientCallReturnType = yield call(
        () => this.client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchAllMEntitiesFromDatastore received", result.status, result.data);
      yield putResolve(mEntitySliceActionsCreators[mEntitySliceInputActionNames.replaceEntities](result.data))
      console.log("fetchMentities calling allEntityDefinitionsHaveBeenLocallyStored");
      yield put(
        outputChannel, 
        {eventName:"allEntityDefinitionsHaveBeenLocallyStored",status:'OK', param:result.data}
      );
      // yield put(outputChannel, {eventName:"allEntityDefinitionsHaveBeenLocallyStored",status:'OK', param:result.data})
    } catch (e) {
      console.log("fetchAllMEntitiesFromDatastore exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
    }
  }

  //#########################################################################################
  public *entityRootSaga(
    // _this: EntitySagas,
    outputChannel:Channel<LocalStoreEvent>,
  ) {
    // take
    yield all(
      [
        takeEvery(
          mEntitySagaInputActionNames.fetchAllEntityDefinitionsFromDatastore, 
          this.fetchAllEntityDefinitionsFromDatastore.bind(this),
          // this,
          outputChannel,
        ),
      ]
    )
  }

  //#########################################################################################
  //# ACTION DEFINITIONS
  //#########################################################################################
  public mEntitySagaInputActionsCreators = {
    fetchAllMEntitiesFromDatastore:createAction(mEntitySagaInputActionNames.fetchAllEntityDefinitionsFromDatastore),
  }

  // public entitySagaOutputActionsCreators = {
  //   // [EntitySagaOutputActionNames['allEntityDefinitionsHaveBeenLocallyStored']]:createAction<LocalStoreEvent>(EntitySagaOutputActionNames['allEntityDefinitionsHaveBeenLocallyStored']),
  // }
} // end class EntitySlice

