import { createAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';
import { MClientCallReturnType, MclientI } from 'src/api/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { mEntities } from './Entity';
import { mEntityActionsCreators, mEntitySliceInputActionNames } from './EntitySlice';

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
const mEntitySliceSagaActionNames = {
  fetchMiroirEntities:"entities/fetchMiroirEntities",
  entitiesStored:"entitiesStored",
}

//#########################################################################################
//# DATA TYPES
//#########################################################################################
declare type MentitySliceStateType = mEntities;
// export interface MentitySliceActionPayloadType extends ActionWithPayload{
//   payload: MentitySliceStateType; // TODO: correct type, not necessarily all actions should receive a list of Entity as parameter!
// }




//#########################################################################################
//# SLICE
//#########################################################################################
export class EntitySagas {
  constructor(
    public client: MclientI,
  ) {
    // console.log("EntitySlice constructor",client)
  }

  //#########################################################################################
  *fetchEntitiesFromDatastore(
    _this:EntitySagas,
    sliceChannel:Channel<any>,
  ):any {
    try {
      const _client = _this.client;
      console.log("fetchEntitiesFromDatastore start client",_client)
      const result:MClientCallReturnType = yield call(
        () => _client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchEntitiesFromDatastore received", result.status);
      yield putResolve(mEntityActionsCreators[mEntitySliceInputActionNames.replaceEntities](result.data))
      // console.log("fetchMentities calling entitiesStored");
      yield put(_this.mEntitySagaActionsCreators[mEntitySliceSagaActionNames.entitiesStored](result.data))
    } catch (e) {
      console.log("fetchEntitiesFromDatastore exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
    }
  }

  //#########################################################################################
  *entitiesStored(
    _this: EntitySagas,
    sliceChannel:Channel<any>,
    action:{type:string, payload:mEntities},
  ):any {
    // console.log("saga entitiesStored called", action)
    yield put(sliceChannel, action)
  }

  //#########################################################################################
  public *entityRootSaga(
    _this: EntitySagas,
    sliceChannel:Channel<any>,
  ) {
    // take
    yield all([
      takeEvery(
        mEntitySliceSagaActionNames.fetchMiroirEntities, 
        _this.fetchEntitiesFromDatastore,
        _this,
        sliceChannel,
      ),
      takeEvery(
        mEntitySliceSagaActionNames.entitiesStored, 
        _this.entitiesStored,
        _this,
        sliceChannel,
      ),
    ])
  }


  //#########################################################################################
  //# ACTION DEFINITIONS
  //#########################################################################################
  public mEntitySagaActionsCreators:any = {
    fetchMiroirEntities:createAction(mEntitySliceSagaActionNames.fetchMiroirEntities),
    entitiesStored:createAction(mEntitySliceSagaActionNames.entitiesStored),
  }

} // end class EntitySlice

