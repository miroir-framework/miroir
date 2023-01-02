import { createAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';
import { MClientCallReturnType, MclientI } from 'src/api/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { MiroirEntities } from './Entity';
import EntitySlice, { mEntitySliceStoreActionNames } from './EntitySlice';
import { Mslice } from './Mslice';

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
declare type MentitySliceStateType = MiroirEntities;
// export interface MentitySliceActionPayloadType extends ActionWithPayload{
//   payload: MentitySliceStateType; // TODO: correct type, not necessarily all actions should receive a list of Entity as parameter!
// }




//#########################################################################################
//# SLICE
//#########################################################################################
export class EntitySagas implements Mslice {
  constructor(
    public client: MclientI,
  ) {
    // console.log("EntitySlice constructor",client)
  }

  //#########################################################################################
  *fetchMentities(
    _this:EntitySagas,
    sliceChannel:Channel<any>,
  ):any {
    try {
      const _client = _this.client;
      const result:MClientCallReturnType = yield call(
        () => _client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchMentities received", result.status);
      yield putResolve(_this.mEntityActionsCreators[mEntitySliceStoreActionNames.storeEntities](result.data))
      // console.log("fetchMentities calling entitiesStored");
      yield put(_this.mEntityActionsCreators[mEntitySliceSagaActionNames.entitiesStored](result.data))
    } catch (e) {
      console.error("fetchMentities exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
    }
  }

  //#########################################################################################
  *entitiesStored(
    _this: EntitySagas,
    sliceChannel:Channel<any>,
    action:{type:string, payload:MiroirEntities},
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
        _this.fetchMentities,
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
  public mEntityActionsCreators:any = {
    fetchMiroirEntities:createAction(mEntitySliceSagaActionNames.fetchMiroirEntities),
    entitiesStored:createAction(mEntitySliceSagaActionNames.entitiesStored),
    ...EntitySlice.actions
  }

} // end class EntitySlice

