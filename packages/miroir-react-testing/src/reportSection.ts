/**
 * The `miroirTestReportSection` renderer alone (#672 D2), for a client's report section renderers:
 *
 *   miroirTestReportSection: lazy(async () => ({
 *     default: (await import("miroir-react-testing/report-section")).ReportSectionMiroirTest,
 *   })),
 */
export { ReportSectionMiroirTest, type ReportSectionMiroirTestProps } from "./4_view/components/Reports/ReportSectionMiroirTest.js";
