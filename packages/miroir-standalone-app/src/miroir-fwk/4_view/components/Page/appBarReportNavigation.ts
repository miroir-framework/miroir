/**
 * Resolve which SelfApplication uuid an AppBar report link should navigate with.
 *
 * Versioning (#225) is a Miroir scaffolding report: always open it under the
 * report's static selfApplication (Miroir). Target-app filtering is done inside
 * the report via inputReportSection (and the freeze Runner's own application field).
 */
export function resolveAppBarReportLinkApplication(params: {
  reportUuid: string;
  itemSelfApplication: string;
  versioningReportUuid: string;
  applicationSelector?: string | undefined;
}): string {
  void params.reportUuid;
  void params.versioningReportUuid;
  void params.applicationSelector;
  return params.itemSelfApplication;
}
