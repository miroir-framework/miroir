import { createAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';

import { MClientCallReturnType, MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';

import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { mEntityActionsCreators, mEntitySliceInputActionNames } from '../local/EntitySlice';

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
const mEntitySliceSagaActionNames = {
  fetchAllMEntitiesFromDatastore:"entities/fetchAllMEntitiesFromDatastore",
  allMEntitiesHaveBeenStored:"allMEntitiesHaveBeenStored",
}

//#########################################################################################
//# DATA TYPES
//#########################################################################################
declare type MentitySliceStateType = MEntityDefinition[];
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
  *fetchAllMEntitiesFromDatastore(
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
      yield put(_this.mEntitySagaActionsCreators[mEntitySliceSagaActionNames.allMEntitiesHaveBeenStored](result.data))
    } catch (e) {
      console.log("fetchEntitiesFromDatastore exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
    }
  }

  //#########################################################################################
  *entitiesStored(
    _this: EntitySagas,
    sliceChannel:Channel<any>,
    action:{type:string, payload:MEntityDefinition[]},
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
        mEntitySliceSagaActionNames.fetchAllMEntitiesFromDatastore, 
        _this.fetchAllMEntitiesFromDatastore,
        _this,
        sliceChannel,
      ),
      takeEvery(
        mEntitySliceSagaActionNames.allMEntitiesHaveBeenStored, 
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
    fetchAllMEntitiesFromDatastore:createAction(mEntitySliceSagaActionNames.fetchAllMEntitiesFromDatastore),
    allMEntitiesHaveBeenStored:createAction(mEntitySliceSagaActionNames.allMEntitiesHaveBeenStored),
  }

} // end class EntitySlice

