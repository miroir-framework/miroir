/**
 * Resolve which SelfApplication uuid an AppBar report link should navigate with.
 * Versioning (#225) must follow the sidebar applicationSelector; other report
 * links keep their static selfApplication (e.g. Miroir Runners).
 */
export function resolveAppBarReportLinkApplication(params: {
  reportUuid: string;
  itemSelfApplication: string;
  versioningReportUuid: string;
  applicationSelector?: string | undefined;
}): string {
  if (params.reportUuid === params.versioningReportUuid) {
    return params.applicationSelector || params.itemSelfApplication;
  }
  return params.itemSelfApplication;
}
