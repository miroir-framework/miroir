// import { createEntityAdapter, createSlice, EntityAdapter } from '@reduxjs/toolkit';
// import { call, put } from 'redux-saga/effects';
// import { client } from '../../api/Mclient';
// import { MiroirReport } from './Report';

// export const miroirReportsSagaActions = {
//   fetchMiroirReports:"entities/fetchMiroirReports"
// }

// export function* fetchMiroirReportsGen():any {
//   console.log("fetchMiroirReportsGen")
//   try {
//     let result:{
//       status: number;
//       data: any;
//       headers: Headers;
//       url: string;
//   } = yield call(
//       () => client.get('/fakeApi/Report/all')
//     )
//     yield put({type: "report/reportsReceived", payload:result.data})
//   } catch (e) {
//     yield put({ type: 'report/failure/reportsNotReceived' })
//   }
// }


// export const miroirReportAdapter: EntityAdapter<MiroirReport> = createEntityAdapter<MiroirReport>(
//   {
//     // Assume IDs are stored in a field other than `book.id`
//     selectId: (report) => report.uuid,
//     // Keep the "all IDs" array sorted based on book titles
//     sortComparer: (a, b) => a.name.localeCompare(b.name),
//   }
// )

// export const miroirReportSlice = createSlice(
//   {
//     name: 'report',
//     initialState: miroirReportAdapter.getInitialState(),
//     reducers: {
//       reportAdded: miroirReportAdapter.addOne,
//       // entitiesReducer,
//       reportsReceived(state, action) {
//         // console.log("entitiesReceived", action)
//         // Or, call them as "mutating" helpers in a case reducer
//         miroirReportAdapter.setAll(state, action.payload)
//       },
//     },
//   }
// )

// export default miroirReportSlice.reducer