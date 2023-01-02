import { EntityState } from '@reduxjs/toolkit';
import { MiroirEntity } from 'src/miroir-fwk/entities/Entity';
import EntitySlice, { mEntityActionsCreators, mEntityAdapter, mEntitySliceStoreActionNames } from 'src/miroir-fwk/entities/EntitySlice';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
// import entityReport from "src/miroir-fwk/assets/entities/Report.json";
// import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

const delay = (time:number) => new Promise((resolve) => {
  setTimeout(resolve, time);
});

const miroirEntitiesActions = {
  fetchMiroirEntities:"entities/fetchMiroirEntities"
}

beforeAll(() => {
})

afterAll(async () => {
})

it(
  'add one Entity definition',
  async () => {
    const initialStore: EntityState<MiroirEntity> = mEntityAdapter.getInitialState();
    const expectedStore:any = mEntityAdapter.addOne<EntityState<MiroirEntity>>(mEntityAdapter.getInitialState(),entityEntity);
    const actionCreator = mEntityActionsCreators[mEntitySliceStoreActionNames.addEntities];
    console.log("mEntityActionsCreators", mEntityActionsCreators);
    console.log("actionCreator", actionCreator);
    const modifiedStore: EntityState<MiroirEntity> = EntitySlice.reducer(
      initialStore,
      mEntityActionsCreators[mEntitySliceStoreActionNames.addEntities](entityEntity)
    );
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)