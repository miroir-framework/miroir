// import { mEntitiesAdapter as miroirEntityAdapter } from "../entities/EntitySagas"
// import { selectMiroirEntityInstances } from "../entities/instanceSlice"
// import { miroirReportAdapter } from "../entities/reportSlice"
// import { RootState } from "./store"

import { mEntityAdapter } from "src/miroir-fwk/4_services/localStore/EntitySlice"

const MiroirEntitySelectors = mEntityAdapter.getSelectors<any>((state) => state?.miroirEntities)
export const {
  selectAll: selectAllMiroirEntities,
  selectById: selectMiroirEntityById,
} = MiroirEntitySelectors

// const MiroirInstanceSelectors = selectMiroirEntityInstances.getSelectors<RootState>((state) => state?.miroirInstances)
// export const {
//   selectAll: selectAllMiroirInstances,
//   selectById: selectMiroirInstanceById,
// } = MiroirInstanceSelectors

// export const selectAllMiroirEntitiesForReduce = createDraftSafeSelector(
//   (state: any) => state,
//   // (state) => state
// );

// const MiroirReportSelectors = miroirReportAdapter.getSelectors<RootState>((state) => state?.miroirReports)
// export const {
//   selectAll: selectAllMiroirReports,
//   selectById: selectMiroirReportById,
// } = MiroirReportSelectors

