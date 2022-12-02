import { miroirEntitiesAdapter as miroirEntityAdapter } from "../entities/entitySlice"
import { miroirReportAdapter } from "../entities/reportSlice"
import { RootState } from "./store"

const MiroirEntitySelectors = miroirEntityAdapter.getSelectors<RootState>((state) => state.miroirEntities)
export const {
  selectAll: selectAllMiroirEntities,
  selectById: selectMiroirEntityById,
} = MiroirEntitySelectors


const MiroirReportSelectors = miroirReportAdapter.getSelectors<RootState>((state) => state.miroirReports)
export const {
  selectAll: selectAllMiroirReports,
  selectById: selectMiroirReportById,
} = MiroirReportSelectors
