// Known report URL keys plus any forwarded search params (e.g. playlistId, D8).
// `(string & {})` keeps the known-key union for autocomplete while allowing extras.
export type ReportUrlKnownParamKeys =
  | "application"
  | "deploymentUuid"
  | "applicationSection"
  | "reportUuid"
  | "instanceUuid";
export type ReportUrlParamKeys = ReportUrlKnownParamKeys | (string & {});
export const REPORT_URL_KNOWN_PARAM_KEYS: ReadonlySet<string> = new Set([
  "application",
  "deploymentUuid",
  "applicationSection",
  "reportUuid",
  "instanceUuid",
]);
