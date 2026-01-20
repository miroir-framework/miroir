import { screen } from "@testing-library/react";
import React from 'react';
import { Container } from "react-dom";
import * as RRDom from "react-router-dom";
import { describe, vi, type ExpectStatic } from 'vitest';

import { reportCountryList, selfApplicationDeploymentLibrary } from "miroir-core";
import type { ReportViewProps } from "../../src/miroir-fwk/4_view/components/Reports/ReportHooks";
import { ReportPage } from '../../src/miroir-fwk/4_view/routes/ReportPage';
import {
  extractValuesFromRenderedElements,
  formValuesToJSON,
  prepareAndRunTestSuites,
  type ReactComponentTestSuitePrep,
  type ReactComponentTestSuites,
} from "./JzodElementEditorTestTools";
import { defaultSelfApplicationDeploymentMap } from "miroir-core";
import { selfApplicationLibrary } from "miroir-core";

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
    // navigate: vi.fn(),
  };
});

vi.spyOn(RRDom, "useParams").mockReturnValue({
  applicationSection: "data",
  deploymentUuid: selfApplicationDeploymentLibrary.uuid,
  instanceUuid: undefined, // TODO: remove, this is specific to entity instance views
  reportUuid: reportCountryList.uuid,
});
// vi.spyOn(RRDom, "navigate").mockReturnValue(undefined as any);

// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <RootComponent></RootComponent>,
//     // element: <HomePage></HomePage>,
//     // errorElement: <ErrorPage />,
//     children: [
//       // {
//       //   path: "home",
//       //   element: <HomePage></HomePage>,
//       //   // errorElement: <ErrorPage />,
//       // },
//       {
//         path: "report/:deploymentUuid/:applicationSection/:reportUuid",
//         element: <ReportPage />,
//         // errorElement: <ErrorPage />,
//       },
//       {
//         path: "report/:deploymentUuid/:applicationSection/:reportUuid/:instanceUuid",
//         element: <ReportPage />,
//         // errorElement: <ErrorPage />,
//       },
//       // {
//       //   path: "tools",
//       //   element: <TransformerBuilderPage />,
//       //   // errorElement: <ErrorPage />,
//       // },
//       // {
//       //   path: "concept",
//       //   element: <ConceptPage />,
//       //   // errorElement: <ErrorPage />,
//       // },
//       // {
//       //   path: "check",
//       //   element: <CheckPage />,
//       //   // errorElement: <ErrorPage />,
//       // },
//       // {
//       //   path: "error-logs",
//       //   element: <ErrorLogsPageDEFUNCT />,
//       //   // errorElement: <ErrorPage />,
//       // },
//       // {
//       //   path: "events",
//       //   element: <MiroirEventsPage />,
//       //   // errorElement: <ErrorPage />,
//       // },
//       // Renamed from action-logs to events
//     ]
//   },
// ]);

const jzodElementEditorTests: Record<
  string,
  ReactComponentTestSuitePrep<any>
  // ReactComponentTestSuitePrep<any> & { modes?: ModesType }
> = {
  reportView: { 
    editor: ReportPage, 
    // editor: () =>(<RouterProvider router={router}><ReportPage /></RouterProvider>), 
    getJzodEditorTests: (
      componentUnderTest: React.FC<ReportViewProps>
    ): ReactComponentTestSuites<ReportViewProps> =>{
      return {
        reportView: {
          suiteRenderComponent: componentUnderTest,
          tests: {
            "object renders as json-like input fields with proper value": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: selfApplicationDeploymentLibrary.uuid,
                // instanceUuid: undefined, // TODO: remove, this is specific to entity instance views
                pageParams: {
                  applicationSection: "data",
                  application: selfApplicationLibrary.uuid,
                  deploymentUuid: selfApplicationDeploymentLibrary.uuid,
                  instanceUuid: undefined, // TODO: remove, this is specific to entity instance views
                  reportUuid: reportCountryList.uuid,
                },
                reportDefinition: reportCountryList,
                // storedQueryData?: any,
                // reportDefinition: Query,
                // showPerformanceDisplay?: boolean;
              // 
                // label: "Test Label",
                // name: "testField",
                // listKey: "ROOT.testField",
                // rootLessListKey: "testField",
                // rootLessListKeyArray: ["testField"],
                // rawJzodSchema: {
                //   type: "object",
                //   definition: { a: { type: "string" }, b: { type: "number" } },
                // },
                // initialFormState: {
                //   a: "test string",
                //   b: 42,
                // },
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                // vi.spyOn(Router, 'useParams').mockReturnValue({ id: '1' });
                screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
                // screen.logTestingPlaygroundURL();
                // const inputs = Array.from(container.querySelector("input")).filter((input: HTMLElement) =>
                //   (input as HTMLInputElement).name.startsWith("testField.")
                // );
                // const inputs = container.querySelectorAll("input[name^='testField.']") as NodeListOf<HTMLInputElement>;
                // const values: Record<string, any> = {};
                // inputs.forEach((input: HTMLElement) => {
                //   const name = (input as HTMLInputElement).name.replace(/^testField\./, "");
                //   values[name] =
                //     (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
                // });
                const values = extractValuesFromRenderedElements(
                  expect,
                  ["cell"],
                  container,
                  "cell-name",// "name", // "entity-instance-ag-grid",//"testField",
                  // "after load"
                );
                const testResult = formValuesToJSON(values);
                expect(testResult).toEqual({
                  "cell-name-1": "France",
                  "cell-name-4": "Germany",
                  "cell-name-7": "U.S.A.",
                  "cell-name-10": "United Kingdom",
                });
              },
            },
          }
        }
      }
    }
  }
};

// Integration-style smoke test using the shared test wrapper
describe('ReportViewWithEditor integration', () => {
  prepareAndRunTestSuites("reportView.integ", jzodElementEditorTests, defaultSelfApplicationDeploymentMap);
  
  // Task 4.12: Additional editing tests will be added here
  // These tests verify that section-level properties (extractors, combiners, 
  // runtimeTransformers, extractorTemplates, combinerTemplates, runStoredQueries)
  // can be edited through the TypedValueObjectEditor integration
  
  // Basic non-regression test already exists above through prepareAndRunTestSuites
  // which verifies that reports render correctly with ReportSectionViewWithEditor
});
