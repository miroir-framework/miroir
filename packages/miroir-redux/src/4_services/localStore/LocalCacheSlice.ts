import { z } from "zod";
import {
  ActionCreatorWithPayload, createEntityAdapter,
  createSelector,
  createSlice,
  EntityAdapter,
  EntityState,
  EntityId,
  PayloadAction,
  Slice
} from "@reduxjs/toolkit";
import { memoize as _memoize } from "lodash";
import {
  EntitiesDomainState,
  DomainStateSelector,
  EntityInstance,
  EntityInstanceCollection,
  DomainDataAction,
  DomainModelAction,
  ModelEntityUpdateConverter,
  EntityDefinition,
  DomainAction,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  MetaEntity,
  Uuid,
  ZinstanceSchema,
  applicationDeploymentMiroir,
  Zinstance,
  DomainActionWithDeployment,
  DomainModelRollbackAction,
  DomainModelReplaceLocalCacheAction,
  ApplicationSection,
  ApplicationSectionOpposite,
} from "miroir-core";
import { ReduxStateChanges, ReduxStateWithUndoRedo } from "./UndoRedoReducer";

export const localCacheSliceName:string = "localCache";
//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const localCacheSliceInputActionNamesObject = {
  handleLocalCacheModelAction: "handleLocalCacheModelAction",
  handleLocalCacheDataAction: "handleLocalCacheDataAction",
  handleLocalCacheAction: "handleLocalCacheAction",
  // UpdateInstancesForEntity: "UpdateInstancesForEntity",
  // AddInstancesForEntity: "AddInstancesForEntity",
};
export type LocalCacheSliceInputActionNamesObjectTuple = typeof localCacheSliceInputActionNamesObject;
export type LocalCacheSliceInputActionNamesKey = keyof LocalCacheSliceInputActionNamesObjectTuple;
export const localCacheSliceInputActionNames = Object.values(localCacheSliceInputActionNamesObject);
export const localCacheSliceInputFullActionNames = Object.values(localCacheSliceInputActionNamesObject).map(n=>localCacheSliceName+'/'+n); // TODO: use map type?

export function getPromiseActionStoreActionNames(promiseActionNames:string[]):string[] {
  return promiseActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}

export const localCacheSliceGeneratedActionNames = getPromiseActionStoreActionNames(localCacheSliceInputActionNames);

//#########################################################################################
//# DATA TYPES
//#########################################################################################
// export const ZLocalCacheEntitySliceState = z.record(z.string().uuid(),z.ZodType<EntityState<EntityInstance>>);

export const ZEntityId = z.union([z.number(),z.string()]);
export const ZDictionary = z.record(z.string().uuid(),ZinstanceSchema);
export type MiroirDictionary = z.infer<typeof ZDictionary>;
export const ZEntityState = z.object({ids:ZEntityId, entities:ZDictionary});
// export const ZLocalCacheEntitySliceState = z.record(z.string().uuid(),ZEntityState);
// export type LocalCacheEntitySliceState = {[entityUuid: Uuid]:z.infer<typeof ZEntityState>};
export type LocalCacheEntitySliceState = {[entityUuid: Uuid]:EntityState<Zinstance>};
export type LocalCacheSectionSliceState = {
  model:LocalCacheEntitySliceState,
  data:LocalCacheEntitySliceState,
};

// export const ZLocalCacheApplicationSliceState = z.object({model:ZLocalCacheEntitySliceState,data:ZLocalCacheEntitySliceState});
// export const ZLocalCacheDeploymentSliceState = z.record(z.string().uuid(),ZLocalCacheApplicationSliceState);
// export const ZLocalCacheDeploymentSliceState = z.record(z.string().uuid(),ZLocalCacheEntitySliceState);

// export const ZOldLocalCacheSliceState = z.record(z.string().uuid(),ZLocalCacheEntitySliceState);
// export const ZNewLocalCacheSliceState = z.object({new:ZLocalCacheDeploymentSliceState,});
// export type NewLocalCacheSliceState = z.infer<typeof ZLocalCacheDeploymentSliceState>;
export type NewLocalCacheSliceState = {[deploymentUuid: Uuid]: LocalCacheSectionSliceState};;

// instance slice state cannot really be defined statically, since it changes at run-time, depending on the set of defined instances
export interface LocalCacheSliceState {
  // "newFormat": z.infer<typeof ZLocalCacheDeploymentSliceState>,
  [parentUuid: Uuid]: EntityState<EntityInstance>
}


export interface titi {
  [deploymentUuid: string]: {[parentUuid: string]:string}
}

export const titiSchema = z.record(z.record(z.string()))
type TITI = z.infer<typeof titiSchema>
// export type DomainDataAction = PayloadAction<EntityInstanceCollection>;

//#########################################################################################
//# Entity Adapter
//#########################################################################################
// const getLocalCacheSliceDeploymentAdapter: (
//   // parentName: string
//   deploymentUuid: string
// ) => EntityAdapter<EntityInstance> = _memoize(
//   (deploymentUuid: string) => {
//     // console.log("getEntityAdapter creating EntityAdapter For entity", parentName);
//     const result = createEntityAdapter<EntityInstance>({
//       selectId: (entity) => entity.uuid,
//       // Keep the "all IDs" array sorted based on book titles
//       // sortComparer: (a, b) => a.name.localeCompare(b.name),
//     });

//     console.log("getEntityAdapter creating EntityAdapter For entity", deploymentUuid,"result",result);

//     return result;
//   }
// );

const getLocalCacheSliceEntityAdapter: (
  // parentName: string
  entityUuid: string
) => EntityAdapter<Zinstance> = _memoize(
// ) => EntityAdapter<EntityInstance> = _memoize(
  (entityUuid: string) => {
    // console.log("getEntityAdapter creating EntityAdapter For entity", parentName);
    // const result = createEntityAdapter<EntityInstance>({
    const result:EntityAdapter<Zinstance> = createEntityAdapter<Zinstance>({
      // Assume IDs are stored in a field other than `book.id`
      selectId: (entity) => entity.uuid,
      // Keep the "all IDs" array sorted based on book titles
      // sortComparer: (a, b) => a.name.localeCompare(b.name),
    });

    console.log("getEntityAdapter creating EntityAdapter For entity", entityUuid,"result",result);

    return result;
  }
);

//#########################################################################################
function getInitializedSectionEntityAdapter(
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string, 
  state: NewLocalCacheSliceState) {
  // TODO: refactor so as to avoid side effects!
  const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(entityUuid);
  if (!state) {
    // console.log('getInitializedDeploymentEntityAdapter state is undefined, initializing state!',JSON.stringify(state),state == undefined);
    state = {[deploymentUuid]:{
      [section]:{[entityUuid]: sliceEntityAdapter.getInitialState()}},
      [ApplicationSectionOpposite(section)]: {}
    } as NewLocalCacheSliceState;
  } else {
    if (!state[deploymentUuid]) {
      // console.log('getInitializedDeploymentEntityAdapter for deployment',deploymentUuid,'is undefined, initializing state!',JSON.stringify(state),state == undefined);
      
      state[deploymentUuid] = {
        // [entityUuid]: sliceEntityAdapter.getInitialState()
        [section]:{[entityUuid]: sliceEntityAdapter.getInitialState()},
        [ApplicationSectionOpposite(section)]: {}
      } as LocalCacheSectionSliceState;
    } else {
      if (!state[deploymentUuid][section] || !state[deploymentUuid][section][entityUuid]) {
        // console.log('getInitializedDeploymentEntityAdapter for deployment',deploymentUuid,'and entityUuid',entityUuid,'is undefined, initializing state!');
        
        state[deploymentUuid][section][entityUuid] = sliceEntityAdapter.getInitialState();

        // if (!state[deploymentUuid][section][entityUuid]) {
        //   // console.log('getInitializedDeploymentEntityAdapter for deployment',deploymentUuid,'and entityUuid',entityUuid,'is undefined, initializing state!');
        //   state[deploymentUuid][entityUuid] = sliceEntityAdapter.getInitialState();
        // }
      }
    }
  }
  // console.log('getInitializedDeploymentEntityAdapter state',JSON.stringify(state));
  return sliceEntityAdapter;
} 

// //#########################################################################################
// //TODO: does side effect! Depends on state structure!
// function getInitializedEntityAdapter(parentUuid: string, state: LocalCacheSliceState) {
//   // TODO: refactor so as to avoid side effects!
//   const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(parentUuid);
//   if (state[parentUuid] == undefined) {
//     console.log('getInitializedEntityAdapter for',parentUuid,'initializing state!');
    
//     state[parentUuid] = sliceEntityAdapter.getInitialState();
//   }
//   return sliceEntityAdapter;
// } 

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
// function ReplaceInstancesForDeploymentEntity(deploymentUuid: string, state: NewLocalCacheSliceState, action: PayloadAction<EntityInstanceCollection>) {
function ReplaceInstancesForSectionEntity(
  deploymentUuid: string, 
  section: ApplicationSection,
  state: NewLocalCacheSliceState, 
  instanceCollection:EntityInstanceCollection
) {
  console.log('ReplaceInstancesForSectionEntity',deploymentUuid,section,instanceCollection);
  
  const entity = state[deploymentUuid]?
    (
      (
        state[deploymentUuid][section]?
          state[deploymentUuid][section][entityEntity.uuid]?.entities[instanceCollection.parentUuid]
        :
          undefined
      )
    )
    :undefined
  ;
  console.log('ReplaceInstancesForDeploymentEntity for deployment',deploymentUuid,'entity',(entity?entity['name']:'entity not found for deployment'));
  const sliceEntityAdapter = getInitializedSectionEntityAdapter(deploymentUuid,section,instanceCollection.parentUuid,state);

  state[deploymentUuid][section][instanceCollection.parentUuid] = sliceEntityAdapter.setAll(state[deploymentUuid][section][instanceCollection.parentUuid], instanceCollection.instances);
  // console.log('ReplaceInstancesForDeploymentEntity for deployment',deploymentUuid, 'entity',action.payload.parentUuid,action.payload.parentName);
  
}

// function ReplaceInstancesForEntity(state: LocalCacheSliceState, action: PayloadAction<EntityInstanceCollection>) {
//   const entity = state[entityEntity.uuid]?.entities[action.payload.parentUuid]
//   console.log('ReplaceInstancesForEntity named', entity?entity['name']:'entity not found',action.payload.parentUuid,action.payload.instances);
//   const sliceEntityAdapter = getInitializedEntityAdapter(action.payload.parentUuid,state);

//   state[action.payload.parentUuid] = sliceEntityAdapter.setAll(state[action.payload.parentUuid], action.payload.instances);
// }


//#########################################################################################
function handleLocalCacheDataAction(
  state: NewLocalCacheSliceState, 
  deploymentUuid: Uuid, 
  action: DomainDataAction) {
  // const deploymentUuid = applicationDeploymentMiroir.uuid
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction, 'called', action);
  switch (action.actionName) {
    case 'create': {
      for (let instanceCollection of action.objects) {
        console.log('create for entity',instanceCollection.parentName, instanceCollection.parentUuid, 'instances', instanceCollection.instances, JSON.stringify(state));
        
        const sliceEntityAdapter = getInitializedSectionEntityAdapter(deploymentUuid, 'data', instanceCollection.parentUuid, state);
        
        console.log('localCacheSliceObject handleLocalCacheDataAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state before insert',JSON.stringify(state));
        
        sliceEntityAdapter.addMany(state[deploymentUuid]['data'][instanceCollection.parentUuid], instanceCollection.instances);

        console.log('localCacheSliceObject handleLocalCacheDataAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state after insert',JSON.stringify(state));
        
        if(instanceCollection.parentUuid == entityDefinitionEntityDefinition.uuid) {// TODO: does it work? How?
          console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction,'creating entityAdapter for Entities',instanceCollection.instances.map(i=>i['name']));
          
          instanceCollection.instances.forEach(i=>getInitializedSectionEntityAdapter(deploymentUuid, 'data', i['uuid'], state));
        }
        console.log('create done',JSON.stringify(state[deploymentUuid]['data']));
      }
      break;
    }
    case 'delete': {
      for (let instanceCollection of action.objects) {
        console.log('localCacheSliceObject handleLocalCacheDataAction delete', instanceCollection);
        
        const sliceEntityAdapter = getInitializedSectionEntityAdapter(deploymentUuid,'data',instanceCollection.parentUuid, state);
        console.log('localCacheSliceObject handleLocalCacheDataAction delete state before',JSON.stringify(state[deploymentUuid]['data'][instanceCollection.parentUuid]));
        
        sliceEntityAdapter.removeMany(state[deploymentUuid][instanceCollection.parentUuid], instanceCollection.instances.map(i => i.uuid));
        console.log('localCacheSliceObject handleLocalCacheDataAction delete state after',JSON.stringify(state[deploymentUuid]['data'][instanceCollection.parentUuid]));
      }
      break;
    }
    case 'update': {
      for (let instanceCollection of action.objects) {
        const sliceEntityAdapter = getInitializedSectionEntityAdapter(deploymentUuid,'data',instanceCollection.parentUuid, state);
        sliceEntityAdapter.updateMany(state[deploymentUuid]['data'][instanceCollection.parentUuid], instanceCollection.instances.map(i => ({ id: i.uuid, changes: i })));
        // getSliceEntityAdapter(action.payload.parentName).updateOne(state[action.payload.parentName], entityUpdate);
      }
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheModelAction action could not be taken into account, unkown action', action.actionName);
  }
}

//#########################################################################################
function handleLocalCacheModelAction(state: NewLocalCacheSliceState, deploymentUuid: Uuid, action: DomainModelAction) {
  // const deploymentUuid = applicationDeploymentMiroir.uuid;
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheModelAction, 'called', action.actionName, action);
  switch (action.actionName) {
    case 'replaceLocalCache': {
      const castAction:DomainModelReplaceLocalCacheAction = action;
      console.log('localCacheSliceObject replaceLocalCache',deploymentUuid, action);
      
      for (let instanceCollection of action.objects) {
        ReplaceInstancesForSectionEntity(deploymentUuid, instanceCollection.applicationSection, state, instanceCollection);
      }
      break;
    }
    case 'commit': {
      // reset transation contents
      // send ModelEntityUpdates to server for execution?
      // for (let instanceCollection of action.payload.objects) {
      //   ReplaceInstancesForEntity(state, { type: "ReplaceInstancesForEntity", payload: instanceCollection } as PayloadAction<EntityInstanceCollection>);
      // }
      break;
    }
    case "UpdateMetaModelInstance": {
      // not transactional??
      console.log('localCacheSliceObject deploymentUuid',deploymentUuid,'UpdateMetaModelInstance',action);
      const domainDataAction:DomainDataAction = {
        actionType:"DomainDataAction",
        actionName:action.update.updateActionName,
        objects: action.update.objects
      }
      ;
      console.log('updateModel domainDataAction',domainDataAction);

      handleLocalCacheDataAction(state, deploymentUuid, domainDataAction);
      break;
    }
    case "updateEntity": {
      // console.log('localCacheSliceObject deploymentUuid',deploymentUuid,'updateModel',action, state[deploymentUuid],state[deploymentUuid]);
      console.log('localCacheSliceObject deploymentUuid',deploymentUuid,'updateModel',action, state);
      // infer from ModelEntityUpdates the CUD actions to be performed on model Entities, Reports, etc.
      // send CUD actions to local cache
      // have undo / redo contain both(?) local cache CUD actions and ModelEntityUpdates
      const domainDataAction:DomainDataAction = 
        ModelEntityUpdateConverter.modelEntityUpdateToLocalCacheUpdate(
          Object.values(state[deploymentUuid]['model'][entityEntity.uuid].entities) as MetaEntity[],
          Object.values(state[deploymentUuid]['model'][entityEntityDefinition.uuid].entities) as EntityDefinition[],
          action.update.modelEntityUpdate
        )
      ;
      console.log('updateModel deploymentUuid',deploymentUuid,'domainDataAction',domainDataAction);

      handleLocalCacheDataAction(state, deploymentUuid, domainDataAction);
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheModelAction deploymentUuid',deploymentUuid,'action could not be taken into account, unkown action', action.actionName);
  }
}

//#########################################################################################
function handleLocalCacheAction(state: NewLocalCacheSliceState, deploymentUuid: Uuid, action: DomainAction) {
  console.log('localCacheSliceObject handleLocalCacheAction deploymentUuid',deploymentUuid, 'actionType',action.actionType, 'called', action);
  switch (action.actionType) {
    case 'DomainDataAction': {
      handleLocalCacheDataAction(state, deploymentUuid, action);
      break;
    }
    case 'DomainModelAction': {
      handleLocalCacheModelAction(state, deploymentUuid, action);
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheAction action could not be taken into account, unkown action', action);
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<NewLocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  // initialState: { [entityDefinitionEntityDefinition.uuid]: getLocalCacheSliceEntityAdapter(entityDefinitionEntityDefinition.uuid).getInitialState() },
  initialState: {} as NewLocalCacheSliceState,
  reducers: {
    // [localCacheSliceInputActionNamesObject.handleLocalCacheAction](state: NewLocalCacheSliceState, action: PayloadAction<DomainAction>) {
    [localCacheSliceInputActionNamesObject.handleLocalCacheAction](state: NewLocalCacheSliceState, action: PayloadAction<DomainActionWithDeployment>) {
      // handleLocalCacheAction(state,applicationDeploymentMiroir.uuid,action.payload);
      handleLocalCacheAction(state,action.payload.deploymentUuid,action.payload.domainAction);
    },
  },
});



//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
// export const mInstanceSliceActionsCreators:{[actionCreatorName:string]:any} = {
type LocalCacheSliceActionCreator<P> =
  | ActionCreatorWithPayload<P, `${string}/${string}`>
  // | ActionCreatorWithoutPayload<`${string}/${string}`>
;

const actionsCreators: {
  [actionCreatorName: string]: LocalCacheSliceActionCreator<any>;
} = {
  ...localCacheSliceObject.actions,
};

//#########################################################################################
//# SLICE OBJECT
//#########################################################################################
export const LocalCacheSlice = {
  reducer: localCacheSliceObject.reducer,
  actionCreators: actionsCreators,
  inputActionNames: localCacheSliceInputActionNamesObject,
};


//#########################################################################################
//# SELECTORS
//#########################################################################################
export const selectMiroirEntityInstances = createSelector(
  (state: LocalCacheSliceState) => state,
  (items) => items
);

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectCurrentTransaction: () => ((state: ReduxStateWithUndoRedo) => ReduxStateChanges[]) = 
// _memoize(
  () => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        return state.pastModelPatches;
      },
      (items: ReduxStateChanges[]) => items
    );
  }
// )
;

// //#########################################################################################
// // TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// // TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
// export const selectInstancesForEntity: (entityUuid: string) => any = _memoize(
//   (parentUuid: string) => {
//     return createSelector(
//       (state: ReduxStateWithUndoRedo) => {
//         // return state.presentModelSnapshot.miroirInstances[parentUuid];
//         const innerState = state.presentModelSnapshot.miroirInstances;
//         const deployment = innerState?innerState[applicationDeploymentMiroir.uuid]:undefined;
//         const instances = deployment?deployment[parentUuid]:[];
//         return instances;
//       },
//       (items: any) => items
//     );
//   }
// );

// //#########################################################################################
// // TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// // TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
// export const selectInstancesForDeploymentEntity: (deploymentUuid:string, entityUuid: string) => any = 
// // _memoize(
//   (deploymentUuid:string, entityUuid: string) => {
//     return createSelector(
//       (state: ReduxStateWithUndoRedo) => {
        
//         const innerState = state.presentModelSnapshot.miroirInstances;
//         const deployment = innerState?innerState[deploymentUuid]:undefined;
//         const instances = deployment?deployment[entityUuid]:[];
//         // console.log('selectInstancesForDeploymentEntity deploymentUuid',deploymentUuid,'entityUuid', entityUuid,'state',state,'instances',instances);
//         return instances;
//       },
//       (items: any) => items
//     );
//   }
// // )
// ;

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectInstancesForSectionEntity: (
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined,
  entityUuid?: string | undefined
) => any =
  // _memoize(
  (deploymentUuid: string | undefined, section: ApplicationSection | undefined, entityUuid: string | undefined) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        console.log('selectInstancesForSectionEntity',deploymentUuid,section,entityUuid);
        
        if (deploymentUuid && section && entityUuid) {
          const innerState = state.presentModelSnapshot.miroirInstances;
          const deployment = innerState && deploymentUuid ? innerState[deploymentUuid] : undefined;
          const stateSection = deployment && section ? deployment[section] : undefined;
          const instances = stateSection && entityUuid ? stateSection[entityUuid] : [];
          // console.log('selectInstancesForDeploymentEntity deploymentUuid',deploymentUuid,'entityUuid', entityUuid,'state',state,'instances',instances);
          return instances;
        } else {
          return [];
        }
      },
      (items: any) => items
    );
  };
// )

// //#########################################################################################
// export const selectInstancesFromDeploymentDomainSelector: 
//   (deploymentUuid:string) => (selector: DomainStateSelector) => (state: ReduxStateWithUndoRedo) => EntityInstance[] =
//   (deploymentUuid:string) => {
//     return (selector: DomainStateSelector) => {
//       return createSelector(
//         (state: ReduxStateWithUndoRedo) => {
//           const deployments = state?.presentModelSnapshot?.miroirInstances;
//           // const deploymentInstances = deployments?deployments[applicationDeploymentMiroir.uuid]:undefined
//           const deploymentInstances = deployments?deployments[deploymentUuid]:undefined
//           if (deploymentInstances) {
//             const domainState: EntitiesDomainState = Object.fromEntries(
//               Object.entries(deploymentInstances).map((e) => {
//                 // console.log("selectInstancesFromDomainSelector miroirInstances", e);
//                 return [e[0], e[1].entities];
//               })
//             ) as EntitiesDomainState;
//             // console.log("selectInstancesFromDomainSelector domainState",domainState)
//             return selector(domainState);
//           } else {
//             return selector({} as EntitiesDomainState);
//           }
//         },
//         (items: EntityInstance[]) => items
//       );
//     };
//   }

//#########################################################################################
export const selectInstancesFromSectionDomainSelector
  // :(deploymentUuid:string|undefined, section:ApplicationSection|undefined) => (selector: DomainStateSelector) => (state: ReduxStateWithUndoRedo) => EntityInstance[] 
  =
  (deploymentUuid:string|undefined, section:ApplicationSection|undefined) => {
    return (selector: DomainStateSelector) => {
      // if (deploymentUuid && section) {
        return createSelector(
          (state: ReduxStateWithUndoRedo) => {
            const deployments = state?.presentModelSnapshot?.miroirInstances;
            // const deploymentInstances = deployments?deployments[applicationDeploymentMiroir.uuid]:undefined
            const deploymentInstances = deployments && deploymentUuid && section?(deployments[deploymentUuid]?deployments[deploymentUuid][section]:undefined):undefined
            if (deploymentInstances) {
              const domainState: EntitiesDomainState = Object.fromEntries(
                Object.entries(deploymentInstances).map((e) => {
                  // console.log("selectInstancesFromDomainSelector miroirInstances", e);
                  return [e[0], e[1].entities];
                })
              ) as EntitiesDomainState;
              // console.log("selectInstancesFromDomainSelector domainState",domainState)
              return selector(domainState);
            } else {
              return selector({} as EntitiesDomainState);
            }
          },
          (items: EntityInstance[]) => items
        );
      // } else {
      //   return createSelector((state: ReduxStateWithUndoRedo) => selector({} as EntitiesDomainState),(items: EntityInstance[]) => items);
      // }
    };
  }

// //#########################################################################################
// export const selectInstancesFromDomainSelector: (
//   selector: DomainStateSelector
// ) => (state: ReduxStateWithUndoRedo) => EntityInstance[] =
//   // _memoize(
//   // (parentName: string) => {
//   (selector: DomainStateSelector) => {
//     return createSelector(
//       (state: ReduxStateWithUndoRedo) => {
//         const deployments = state?.presentModelSnapshot?.miroirInstances;
//         const deploymentInstances = deployments?deployments[applicationDeploymentMiroir.uuid]:undefined
//         if (deploymentInstances) {
//           const domainState: EntitiesDomainState = Object.fromEntries(
//             Object.entries(deploymentInstances).map((e) => {
//               // console.log("selectInstancesFromDomainSelector miroirInstances", e);
//               return [e[0], e[1].entities];
//             })
//           ) as EntitiesDomainState;
//           // console.log("selectInstancesFromDomainSelector domainState",domainState)
//           return selector(domainState);
//         } else {
//           return selector({} as EntitiesDomainState);
//         }
//       },
//       (items: EntityInstance[]) => items
//     );
//   };
// // }
// // )

export default {};
