import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call, takeEvery } from 'redux-saga/effects'

import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity'
import { Minstance } from 'src/miroir-fwk/0_interfaces/1_core/Instance'
import { LocalStoreEvent, LocalStoreEventTypeString, LocalStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreInterface'
import { EventManager, EventMatchParameters } from 'src/miroir-fwk/1_core/utils/EventManager'
import EntitySlice from 'src/miroir-fwk/4_storage/local/EntitySlice'
import instanceSliceObject, { InstanceSliceState } from 'src/miroir-fwk/4_storage/local/InstanceSlice'
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
  fetchInstancesFromDatastoreForEntityList(entities:MEntityDefinition[]):void;
}

export interface MDatastoreOutputNotificationsI {
  allInstancesRefreshed():void;
}



// const persistedState = loadFromLocalStorage();

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<MEntityDefinition>;
  miroirInstances: InstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;

/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface {
  private store:MreduxWithUndoRedoStore;
  private staticReducers:MreduxWithUndoRedoReducer;
  private sagaMiddleware:any;
  private eventManager: EventManager<LocalStoreEvent,LocalStoreEventTypeString> = new EventManager<LocalStoreEvent,LocalStoreEventTypeString>();

  // ###############################################################################
  constructor(
    public entitySagasObject: EntitySagas,
    public instanceSagasObject: InstanceSagas,
  ) {
    this.staticReducers = createUndoableReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: instanceSliceObject.reducer,
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
  observerSubscribe(takeEvery:(localStoreEvent:LocalStoreEvent) => void){
    this.eventManager.observerSubscribe(takeEvery);
  }

  // ###############################################################################
  observerMatcherSubscribe(matchingEvents:EventMatchParameters<LocalStoreEvent,LocalStoreEventTypeString>[]) {
    this.eventManager.observerSubscribeMatcher(matchingEvents);
  }

  // ###############################################################################
  observerUnsubscribe(takeEvery:(localStoreEvent:LocalStoreEvent) => void) {
    this.eventManager.observerUnsubscribe(takeEvery);
  }

  // ###############################################################################
  public run():void {
    this.sagaMiddleware.run(
      this.rootSaga.bind(this)
    );
  }

  // ###############################################################################
  fetchFromApiAndReplaceInstancesForEntity(entityName:string):void {
    // this.dispatch(this.entitySagasObject.mEntitySagaActionsCreators.fetchMiroirEntities())
  }

  // ###############################################################################
  fetchInstancesFromDatastoreForEntityList(entities:MEntityDefinition[]):void {
    this.store.dispatch(this.instanceSagasObject.instanceSagaInputActionsCreators.fetchInstancesFromDatastoreForEntityList(entities))
  }

  // ###############################################################################
  fetchFromApiAndReplaceInstancesForAllEntities():void {
    this.store.dispatch(this.entitySagasObject.mEntitySagaInputActionsCreators.fetchAllMEntitiesFromDatastore())
  }

  // ###############################################################################
  addInstancesForEntity(entityName:string,instances:Minstance[]):void { 
    this.store.dispatch(
      instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.AddInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }

  // ###############################################################################
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void{
    this.store.dispatch(
      instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.UpdateInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }


  // ###############################################################################
  *handleEntitySagaOutput (
    // _this:ReduxStore,
    event:LocalStoreEvent,
  ):any {
    console.log("MreduxStore handleEntitySagaOutput, event", event);
    // const listener:MLocalStoreObserver=Array.from(_this.listeners.keys())[0];
    // yield call([listener,listener.dispatch],event)
    yield call([this.eventManager,this.eventManager.dispatch],event)
  }

  // ###############################################################################
  *handleInstanceSagaOutput (
    // _this:ReduxStore,
    event:LocalStoreEvent,
  ):any {
    console.log("MreduxStore handleInstanceSagaOutput, event", event);
    // const listener:MLocalStoreObserver=Array.from(_this.listeners.keys())[0];
    yield call([this.eventManager,this.eventManager.dispatch],event)
  }

  // ###############################################################################
  // public *rootSaga(_this:ReduxStore):any {
  public *rootSaga() {
    console.log("MreduxStore rootSaga",this);
    const entitySagaOutputChannel:Channel<LocalStoreEvent> = yield call(channel);
    const instanceSagaOutputChannel:Channel<LocalStoreEvent> = yield call(channel);
    yield all(
      [
        takeEvery(entitySagaOutputChannel, this.handleEntitySagaOutput.bind(this)),
        takeEvery(instanceSagaOutputChannel, this.handleInstanceSagaOutput.bind(this)),
        // this.entitySagasObject.entityRootSaga.bind(this.entitySagasObject)(this.entitySagasObject, entitySagaOutputChannel),
        this.entitySagasObject.entityRootSaga.bind(this.entitySagasObject)(entitySagaOutputChannel),
        this.instanceSagasObject.instanceRootSaga.bind(this.instanceSagasObject)(this.instanceSagasObject, instanceSagaOutputChannel),
      ]
    );
  }
}

  // ###############################################################################
  export default ReduxStore;