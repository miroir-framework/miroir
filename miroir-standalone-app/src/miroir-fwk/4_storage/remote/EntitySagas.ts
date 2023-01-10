import { createAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';

import { MClientCallReturnType, MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';

import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { mEntitySliceActionsCreators, mEntitySliceInputActionNames} from '../local/EntitySlice';
import { LocalStoreEvent } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreInterface';

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
// const mEntitySagaInternalActionNames = {
//   allMEntitiesHaveBeenStored:"allMEntitiesHaveBeenStored",
// }

const mEntitySagaInputActionNames = {
  fetchAllMEntitiesFromDatastore:"entities/fetchAllMEntitiesFromDatastore",
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
    outputChannel:Channel<LocalStoreEvent>,
  ):any {
    try {
      const _client = _this.client;
      console.log("fetchAllMEntitiesFromDatastore start client",_client)
      const result:MClientCallReturnType = yield call(
        () => _client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchAllMEntitiesFromDatastore received", result.status, result.data);
      yield putResolve(mEntitySliceActionsCreators[mEntitySliceInputActionNames.replaceEntities](result.data))
      console.log("fetchMentities calling allMEntitiesHaveBeenStored");
      // yield put(_this.mEntitySagaActionsCreators[mEntitySagaInternalActionNames.allMEntitiesHaveBeenStored](result.data))
      yield put(outputChannel, {eventName:"allMEntitiesHaveBeenStored",status:'OK', param:result.data})
    } catch (e) {
      console.log("fetchAllMEntitiesFromDatastore exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
    }
  }

  // //#########################################################################################
  // *allMEntitiesHaveBeenStored(
  //   _this: EntitySagas,
  //   outputChannel:Channel<any>,
  //   action:{type:string, payload:MEntityDefinition[]},
  // ):any {
  //   console.log("Entity saga allMEntitiesHaveBeenStored called with action", action)
  //   yield put(outputChannel, action)
  // }

  //#########################################################################################
  public *entityRootSaga(
    _this: EntitySagas,
    outputChannel:Channel<LocalStoreEvent>,
  ) {
    // take
    yield all(
      [
        takeEvery(
          mEntitySagaInputActionNames.fetchAllMEntitiesFromDatastore, 
          _this.fetchAllMEntitiesFromDatastore,
          _this,
          outputChannel,
        ),
        // takeEvery(
        //   EntitySagaInternalActionNames.allMEntitiesHaveBeenStored, 
        //   _this.allMEntitiesHaveBeenStored,
        //   _this,
        //   outputChannel,
        // ),
      ]
    )
  }

  //#########################################################################################
  //# ACTION DEFINITIONS
  //#########################################################################################
  public mEntitySagaActionsCreators = {
    fetchAllMEntitiesFromDatastore:createAction(mEntitySagaInputActionNames.fetchAllMEntitiesFromDatastore),
    // allMEntitiesHaveBeenStored:createAction(EntitySagaOutputActionNames.allMEntitiesHaveBeenStored),
  }

} // end class EntitySlice

