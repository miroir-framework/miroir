import { createContext, useContext } from "react";

/**
 * Submits values to the Report's own Formik submit (`ReportViewWithEditor`), which saves the
 * edited instance. Lets a component that edits an instance in a nested Formik (the virtual
 * attribute overlay of `ReportSectionEntityInstance`, #82) save it like the Report form does
 * (#330). The values hold the same keys as the Report form's: `lastSubmitButtonClicked`, its
 * `_mode`, and the instance at the path `lastSubmitButtonClicked` names.
 */
export type SubmitReportFormValues = (values: Record<string, any>) => Promise<void>;

export const ReportFormSubmitContext = createContext<SubmitReportFormValues | undefined>(undefined);

/** The Report's submit, or `undefined` outside a Report form. */
export function useReportFormSubmit(): SubmitReportFormValues | undefined {
  return useContext(ReportFormSubmitContext);
}
