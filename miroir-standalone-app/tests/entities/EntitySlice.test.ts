import { EntityState } from '@reduxjs/toolkit';
import { MiroirEntity } from 'src/miroir-fwk/entities/Entity';
import EntitySlice, { mEntityActionsCreators, mEntityAdapter, mEntitySliceStoreActionNames } from 'src/miroir-fwk/entities/EntitySlice';
import {Update} from '@reduxjs/toolkit'

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
// import entityReport from "src/miroir-fwk/assets/entities/Report.json";
// import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

// const delay = (time:number) => new Promise((resolve) => {
//   setTimeout(resolve, time);
// });

// const miroirEntitiesActions = {
//   fetchMiroirEntities:"entities/fetchMiroirEntities"
// }

beforeAll(() => {
})

afterAll(async () => {
})

it(
  'add one Entity definition',
  async () => {
    const initialStore: EntityState<MiroirEntity> = mEntityAdapter.getInitialState();
    const expectedStore:any = mEntityAdapter.addOne<EntityState<MiroirEntity>>(mEntityAdapter.getInitialState(),entityEntity);
    // instructions under test
    const modifiedStore: EntityState<MiroirEntity> = EntitySlice.reducer(
      initialStore,
      mEntityActionsCreators[mEntitySliceStoreActionNames.addOne](entityEntity)
    );
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it(
  ('update one Entity definition'),
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
    expect(modifiedStore.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity);
  }
)