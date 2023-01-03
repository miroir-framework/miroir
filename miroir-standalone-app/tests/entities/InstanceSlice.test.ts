import { EntityState, PayloadAction, Update } from '@reduxjs/toolkit';
import { MiroirEntity } from 'src/miroir-fwk/entities/Entity';
import EntitySlice, { mEntityActionsCreators, mEntityAdapter, mEntitySliceStoreActionNames } from 'src/miroir-fwk/entities/EntitySlice';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "src/miroir-fwk/assets/entities/Report.json";
import { MinstanceWithName } from 'src/miroir-fwk/entities/Instance';
import InstanceSlice, { MinstanceActionsCreators, MinstanceSliceState, mInstanceSliceStoreActionNames } from 'src/miroir-fwk/entities/InstanceSlice';
import { MinstanceAction } from 'src/miroir-fwk/entities/Mslice';
// import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

// const delay = (time:number) => new Promise((resolve) => {
//   setTimeout(resolve, time);
// });

// const miroirEntitiesActions = {
//   fetchMiroirEntities:"entities/fetchMiroirEntities"
// }
// const initialStore: EntityState<MiroirEntityInstanceWithName> = mEntityAdapter.addMany<EntityState<MiroirEntity>>(
//   mEntityAdapter.getInitialState(),
//   [
//     entityReport,
//     entityEntity,
//   ]
// );

beforeAll(() => {
})

afterAll(async () => {
})

it(
  'add one Instance',
  async () => {
    const initialStore: MinstanceSliceState = {};
    const expectedStore:any = {Entity:{ids:[entityEntity.uuid], entities: {[entityEntity.uuid]:entityEntity}}};
    console.log("expectedStore",expectedStore);
    const action:MinstanceAction = {entity:"Entity", instances:[entityEntity], };
    // instructions under test
    const modifiedStore:any = InstanceSlice.reducer(initialStore,MinstanceActionsCreators[mInstanceSliceStoreActionNames.addEntityInstances](action));
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it.skip(
  ('update one Instance'),
  async () => {
    const entityChanges = {description:"toto"};
    const entityUpdate:Update<MiroirEntity> = {id:entityEntity.uuid, changes: entityChanges};
    const modifiedEntity: MiroirEntity = Object.assign({},entityEntity,entityChanges);
    const emptyStore: EntityState<MiroirEntity> = mEntityAdapter.getInitialState();
    const initialStore:any = mEntityAdapter.addOne<EntityState<MiroirEntity>>(emptyStore,entityEntity);
    // console.log('initialStore',initialStore);
    const expectedStore:any = mEntityAdapter.updateOne<EntityState<MiroirEntity>>(initialStore,entityUpdate);
    // instructions under test
    const modifiedStore: EntityState<MiroirEntity> = EntitySlice.reducer(
      initialStore,
      mEntityActionsCreators[mEntitySliceStoreActionNames.updateOne](entityUpdate)
    );
    // console.log('modifiedStore',modifiedStore);
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
    expect(modifiedStore.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity); //the two tests must be equivalent
  }
)