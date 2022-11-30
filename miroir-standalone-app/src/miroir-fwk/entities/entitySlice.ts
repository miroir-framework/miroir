import { createAsyncThunk, createEntityAdapter, createReducer, createSlice, EntityAdapter, EntityState } from '@reduxjs/toolkit'
// import type { PayloadAction } from '@reduxjs/toolkit'
import report from "../assets/entities/Report.json"
import entity from "../assets/entities/Entity.json"
import { client } from '../../api/client';

export interface MiroirEntityAttribute {
  "id": number,
  "name": string,
  "display": string,
  "type": string,
  "required": boolean,
  "editable": boolean,
  "attributeFormat"?: {
    "name": string,
    "display": string,
  }[],
};


export interface MiroirEntity {
  "uuid": number,
  "entity": string,
  "name":string,
  "attributes"?: MiroirEntityAttribute[],
};

export type MiroirEntities=MiroirEntity[];

// const initialState: Entities  = [report,entity]
// const initialState: Entities  = []

export const fetchMiroirEntities = createAsyncThunk('entities/fetchEntities', async () => {
  const response = await client.get('/fakeApi/entities')
  console.log("recu reponse",response)
  return response.data
})

export const miroirEntitiesAdapter: EntityAdapter<MiroirEntity> = createEntityAdapter<MiroirEntity>(
  {
    // Assume IDs are stored in a field other than `book.id`
    selectId: (entity) => entity.uuid,
    // Keep the "all IDs" array sorted based on book titles
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  }
)

// const entitiesReducer = createReducer([], (builder) => {
//   builder
//     .addCase('entities/add', (state, action) => {
//       // "mutate" the array by calling push()
//       // state.push(action.payload)
//     })
// })

export const miroirEntitiesSlice = createSlice({
  name: 'entities',
  // initialState,
  initialState: miroirEntitiesAdapter.getInitialState(),
  reducers: {
    // entitiesReducer: entitiesReducer,
    // nothing:(state) => {
    //   console.log(state);
    // }
    entityAdded: miroirEntitiesAdapter.addOne,
    entitiesReceived(state, action) {
      // Or, call them as "mutating" helpers in a case reducer
      miroirEntitiesAdapter.setAll(state, action.payload.books)
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchMiroirEntities.fulfilled, miroirEntitiesAdapter.setAll)
  },
})

// type RootState = ReturnType<typeof miroirEntitiesSlice.getInitialState>

// Action creators are generated for each case reducer function
// export const { entitiesReducer: createEntity } = entitiesSlice.actions


// export const {
//   selectAll: selectAllMiroirEntities,
//   selectById: selectMiroirEntityById,
// } = miroirEntitiesAdapter.getSelectors((state) => state['entities'])
// } = entitiesAdapter.getSelectors((state:EntityState<Entity>) => state.entities)

export default miroirEntitiesSlice.reducer