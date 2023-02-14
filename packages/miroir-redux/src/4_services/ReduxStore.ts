import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import {
  DomainAction,
  LocalStoreInterface,
  RemoteDataStoreInterface,
  RemoteStoreAction,
  RemoteStoreActionReturnType,
} from "miroir-core";
import {
  createUndoRedoReducer,
  ReduxReducerWithUndoRedo,
  ReduxStoreWithUndoRedo,
} from "../4_services/localStore/UndoRedoReducer";
import InstanceRemoteAccessReduxSaga, {
  instanceSagaGeneratedActionNames,
  instanceSagaInputActionNamesArray,
} from "../4_services/remoteStore/InstanceRemoteAccessReduxSaga";
import {
  InstanceSlice,
  instanceSliceGeneratedActionNames,
  instanceSliceInputActionNamesObject,
} from "../4_services/localStore/InstanceReduxSlice";


//#########################################################################################
//# INSTANCE INTERACTOR
//#########################################################################################
/**
 * The external view of the world for the domain model
 */

// export interface DatastoreInputActionsInterface {
//   fetchInstancesFromDatastoreForEntity(entityName:string):void;
//   fetchInstancesFromDatastoreForEntityList(entities:EntityDefinition[]):void;
// }

// export interface DatastoreOutputNotificationsInterface {
//   allInstancesRefreshed():void;
// }



// ###############################################################################
/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface, RemoteDataStoreInterface {
  private innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedo;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(
    // public entityRemoteAccessReduxSaga: EntityRemoteAccessReduxSaga,
    public instanceRemoteAccessReduxSaga: InstanceRemoteAccessReduxSaga
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers(
        {
          miroirInstances: InstanceSlice.reducer,
        }
      )
    );

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      ...instanceSagaInputActionNamesArray,
      ...instanceSagaGeneratedActionNames,
      ...instanceSliceGeneratedActionNames,
    ];

    console.log('ReduxStore ignoredActionsList',ignoredActionsList);
    this.innerReduxStore = configureStore({
      reducer: this.staticReducers,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // Ignore these action types
            ignoredActions: ignoredActionsList,
            // Ignore these field paths in all actions
            ignoredActionPaths: ["meta.promiseActions"],
          },
        })
        .concat(promiseMiddleware)
        .concat(this.sagaMiddleware),
    });
  } //end constructor

  // ###############################################################################
  getInnerStore() {
    return this.innerReduxStore;
  }

  // ###############################################################################
  public run(): void {
    this.sagaMiddleware.run(this.rootSaga.bind(this));
  }

  // ###############################################################################
  handleRemoteStoreAction(action: RemoteStoreAction): Promise<RemoteStoreActionReturnType> {
    // switch (action.entityName) {
    //   case 'Entity': 
    //     return this.innerReduxStore.dispatch(
    //       // this.entityRemoteAccessReduxSaga.entitySagaInputActionsCreators.handleAction(action),
    //       this.entityRemoteAccessReduxSaga.entitySagaInputActionsCreators.handleRemoteStoreAction(action),
    //     );
    //   // case 'Instance':
    //   default:
        return this.innerReduxStore.dispatch(
          this.instanceRemoteAccessReduxSaga.instanceSagaInputPromiseActions.handleRemoteStoreAction.creator(action)
        )
    // }
  }

  // ###############################################################################
  handleLocalCacheAction(action:DomainAction) {
    switch (action.actionName) {
      case 'replace': {
        this.innerReduxStore.dispatch(
          // InstanceSlice.actionCreators[instanceSliceInputActionNamesObject.ReplaceAllInstances](action.objects)
          InstanceSlice.actionCreators[instanceSliceInputActionNamesObject.handleLocalCacheAction](action)
        );
        break;
      }
    }
  }

  // ###############################################################################
  public *rootSaga(
  ) {
    console.log("ReduxStore rootSaga running", this.instanceRemoteAccessReduxSaga);
    yield all([
      // this.entityRemoteAccessReduxSaga.entityRootSaga.bind(this.entityRemoteAccessReduxSaga)(),
      this.instanceRemoteAccessReduxSaga.instanceRootSaga.bind(this.instanceRemoteAccessReduxSaga)(),
    ]);
  }
}

  // ###############################################################################
  export default {};