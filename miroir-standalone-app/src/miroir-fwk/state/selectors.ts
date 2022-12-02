import { miroirEntitiesAdapter } from "../entities/entitySlice"
import { RootState } from "./store"

const MiroirEntitiesSelectors = miroirEntitiesAdapter.getSelectors<RootState>((state) => state.miroirEntities)
export const {
  selectAll: selectAllMiroirEntities,
  selectById: selectMiroirEntityById,
} = MiroirEntitiesSelectors
