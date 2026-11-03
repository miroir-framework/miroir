/**
 * miroir-react-testing (#672): the MiroirTest runtime of a React client, shared by the standalone
 * app and the sandbox. It runs MiroirTest suites in the browser, unit and integration (on the
 * IndexedDB emulated stack, or a live miroir-server when the bundle has its client configs),
 * component and Report tests in a test sandbox, and shows their results.
 *
 * The package is side-effect free: a client that imports a few names from this entry gets those
 * modules only. The `./report-section` entry gives the `miroirTestReportSection` renderer alone.
 */
export { ReportSectionMiroirTest, type ReportSectionMiroirTestProps } from "./4_view/components/Reports/ReportSectionMiroirTest.js";
export { MiroirTestDisplay, runStatusOfResults, type MiroirTestRunStatus } from "./4_view/components/Reports/MiroirTestDisplay.js";
export { MiroirTestResultsDisplay, type MiroirTestResultsDisplayProps } from "./4_view/components/Reports/MiroirTestResultsDisplay.js";
export {
  RunMiroirTestSuiteButton,
  type MiroirTestResultData,
} from "./4_view/components/Buttons/RunMiroirTestSuiteButton.js";

export { readAppMiroirReports } from "./4-tests/appMiroirReports.js";
export {
  FILESYSTEM_TAG,
  FILESYSTEM_TESTS_NEED_A_FILESYSTEM_STORE,
  REPORT_TESTS_NEED_THE_SANDBOX,
  runIntegrationMiroirTestBatch,
  runUnitMiroirTestBatch,
  skippedSuiteResults,
  type MiroirTestSuiteResultsMap,
  type SkippedMiroirTestSuite,
} from "./4-tests/miroirTestBatch.js";
export { selectTestLocalCache, testLocalCache, type TestLocalCache } from "./4-tests/testLocalCache.js";
export {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  isUiIntegrationProfileLaunchableInBrowser,
  listUiIntegrationProfileCatalogForPicker,
} from "./4-tests/integrationTestProfileCatalog.js";
