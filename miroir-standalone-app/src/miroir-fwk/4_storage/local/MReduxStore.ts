import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call, takeEvery } from 'redux-saga/effects'

import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity'
import { Minstance } from 'src/miroir-fwk/0_interfaces/1_core/Instance'
import { MLocalStoreEvent, MLocalStoreI, MLocalStoreObserver } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreI'
import EntitySlice from 'src/miroir-fwk/4_storage/local/EntitySlice'
import MInstanceSlice, { MinstanceSliceState } from 'src/miroir-fwk/4_storage/local/MInstanceSlice'
import {
  createUndoableReducer,
  MreduxWithUndoRedoReducer,
  MreduxWithUndoRedoStore
} from "src/miroir-fwk/4_storage/local/undoableReducer"
import { EntitySagas } from 'src/miroir-fwk/4_storage/remote/EntitySagas'
import { InstanceSagas } from 'src/miroir-fwk/4_storage/remote/InstanceSagas'
import { Maction } from './Mslice'


//#########################################################################################
//# INSTANCE INTERACTOR
//#########################################################################################
/**
 * The external view of the world for the domain model
 */

export interface MDatastoreInputActionsI {
  fetchInstancesFromDatastoreForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForAllEntities(entities:MEntityDefinition[]):void;
}

export interface MDatastoreOutputNotificationsI {
  allInstancesRefreshed():void;
}



// const persistedState = loadFromLocalStorage();

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<MEntityDefinition>;
  miroirInstances: MinstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;

export class MreduxStore implements MLocalStoreI {
  private store:MreduxWithUndoRedoStore;
  private staticReducers:MreduxWithUndoRedoReducer;
  private sagaMiddleware:any;
  // private asyncDispatchMiddleware:any;//TODO: set proper type
  private listeners: Set<MLocalStoreObserver> = new Set();

  // ###############################################################################
  constructor(
    public entitySagasObject: EntitySagas,
    public instanceSagasObject: InstanceSagas,
  ) {
    this.staticReducers = createUndoableReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: MInstanceSlice.reducer,
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
  } //end constructor

  // ###############################################################################
  getInnerStore() {
    return this.store;
  }
  // ###############################################################################
  listenerSubscribe(listener:MLocalStoreObserver) {
    console.log('listenerSubscribe', listener);
    this.listeners.add(listener);
  }
  // ###############################################################################
  listenerUnsubscribe(listener:MLocalStoreObserver) {
    this.listeners.delete(listener);
  }

  // ###############################################################################
  public run():void {
    this.sagaMiddleware.run(
      this.rootSaga, this
    );
  }

  // ###############################################################################
  fetchFromApiAndReplaceInstancesForEntity(entityName:string):void {
    // this.dispatch(this.entitySagasObject.mEntitySagaActionsCreators.fetchMiroirEntities())
  }

  // ###############################################################################
  fetchInstancesFromDatastoreForEntityList(entities:MEntityDefinition[]):void {
    this.store.dispatch(this.instanceSagasObject.mInstanceSagaActionsCreators.fetchInstancesFromDatastoreForEntityList(entities))
  }

  // ###############################################################################
  fetchFromApiAndReplaceInstancesForAllEntities():void {
    this.store.dispatch(this.entitySagasObject.mEntitySagaActionsCreators.fetchAllMEntitiesFromDatastore())
  }

  // ###############################################################################
  addInstancesForEntity(entityName:string,instances:Minstance[]):void { 
    this.store.dispatch(
      MInstanceSlice.actionCreators[MInstanceSlice.inputActionNames.AddInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }

  // ###############################################################################
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void{
    this.store.dispatch(
      MInstanceSlice.actionCreators[MInstanceSlice.inputActionNames.UpdateInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }


  // ###############################################################################
  *handleEntitySagaOutput (
    _this:MreduxStore,
    event:MLocalStoreEvent<any>,
  ):any {
    console.log("MreduxStore handleEntitySagaOutput, event", event);
    const listener:MLocalStoreObserver=Array.from(_this.listeners.keys())[0];
    yield call([listener,listener.notify],event)
  }

  // ###############################################################################
  *handleInstanceSagaOutput (
    _this:MreduxStore,
    event:MLocalStoreEvent<any>,
  ):any {
    console.log("MreduxStore handleInstanceSagaOutput");
    const listener:MLocalStoreObserver=Array.from(_this.listeners.keys())[0];
    yield call([listener,listener.notify],event)
  }

  // ###############################################################################
  public *rootSaga(_this:MreduxStore):any {
    console.log("MreduxStore rootSaga");
    const entitySagaOutputChannel:Channel<MLocalStoreEvent<any>> = yield call(channel);
    const instanceSagaOutputChannel:Channel<MLocalStoreEvent<any>> = yield call(channel);
    yield all(
      [
        takeEvery(entitySagaOutputChannel, _this.handleEntitySagaOutput, _this),
        takeEvery(instanceSagaOutputChannel, _this.handleInstanceSagaOutput, _this),
        _this.entitySagasObject.entityRootSaga(_this.entitySagasObject, entitySagaOutputChannel),
        _this.instanceSagasObject.instanceRootSaga(_this.instanceSagasObject, instanceSagaOutputChannel),
      ]
    );
  }
}

  // ###############################################################################
  export default MreduxStore;