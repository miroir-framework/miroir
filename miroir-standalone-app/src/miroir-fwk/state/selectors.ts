import { miroirEntitiesAdapter as miroirEntityAdapter } from "../entities/entitySlice"
import { miroirReportAdapter } from "../entities/reportSlice"
import { RootState } from "./store"

const MiroirEntitySelectors = miroirEntityAdapter.getSelectors<RootState>((state) => state?.miroirEntities)
export const {
  selectAll: selectAllMiroirEntities,
  selectById: selectMiroirEntityById,
} = MiroirEntitySelectors

// export const selectAllMiroirEntitiesForReduce = createDraftSafeSelector(
//   (state: any) => state,
//   (state) => state
// );

const MiroirReportSelectors = miroirReportAdapter.getSelectors<RootState>((state) => state?.miroirReports)
export const {
  selectAll: selectAllMiroirReports,
  selectById: selectMiroirReportById,
} = MiroirReportSelectors

// const MiroirInstanceSelectors = miroirInstanceAdapter.getSelectors<RootState>((state) => state?.miroirInstances)
// export const {
//   selectAll: selectAllMiroirInstances,
//   selectById: selectMiroirInstanceById,
// } = MiroirInstanceSelectors
