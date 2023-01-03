import { combineReducers, configureStore, EntityState, Store } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call } from 'redux-saga/effects'
import { MiroirEntity } from '../entities/Entity'
import { EntitySagas } from '../entities/EntitySagas'
import EntitySlice from '../entities/EntitySlice'
import { Minstance } from '../entities/Instance'
import { InstanceSagas } from '../entities/InstanceSagas'
import InstanceSlice, { MinstanceSliceState } from '../entities/InstanceSlice'
import { MactionPayloadType } from '../entities/Mslice'
import { createUndoableReducer } from './undoableReducer'


/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
declare interface MreduxStoreI {
  entitySliceObject: EntitySagas,
  instanceSagasObject: InstanceSagas,
}
// const persistedState = loadFromLocalStorage();

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<MiroirEntity>;
  miroirInstances: MinstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:MactionPayloadType) => any;

export class MreduxStore implements MreduxStoreI{
  public store:Store;
  public staticReducers:any;
  public sagaMiddleware:any;
  public dispatch: typeof this.store.dispatch;
  public asyncDispatchMiddleware:any;//TODO: set proper type

  constructor(
    public entitySliceObject: EntitySagas,
    public instanceSagasObject: InstanceSagas,
  ) {

    this.staticReducers = createUndoableReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: InstanceSlice.reducer,
        }
      )
    );
    this.sagaMiddleware = createSagaMiddleware()

    this.store = configureStore(
      {
        reducer: this.staticReducers,
        middleware: (getDefaultMiddleware) => (
          getDefaultMiddleware()
          .concat(this.sagaMiddleware)
        )
      }
    );
    this.dispatch = this.store.dispatch;

    // create indexedDb local storage, in the case the DB accessed through REST runs in a distinct process.
    // if REST API accesses the indexedDb local storage itself, then the Redux store systematically invalidates
    // any data found in it, and thus re-calls the Rest API for any access. The Redux store is then not used,
    // at least not as a store.

  } //end constructor

  public *rootSaga(_this:MreduxStore):any {
    console.log("Mstore rootSaga");
    const sliceChannel:Channel<any> = yield call(channel);
    yield all(
      [
        _this.entitySliceObject.entityRootSaga(_this.entitySliceObject, sliceChannel),
        _this.instanceSagasObject.instanceRootSaga(_this.instanceSagasObject, sliceChannel),
      ]
    );
  }
}