import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from "react";
import { describe, expect, ExpectStatic } from "vitest";


import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { JzodLiteralEditorProps } from '../../src/miroir-fwk/4_view/components/JzodLiteralEditor';
import { cleanLevel, packageName } from '../3_controllers/constants';
import {
  JzodEditorTest,
  JzodEditorTestSuite,
  JzodEditorTestSuites,
  literalBeforeAll,
  LocalLiteralEditorProps,
  runJzodEditorTest
} from "./JzodElementEditorTestTools";

const pageLabel = "JzodLiteralEditor.test";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, pageLabel)).then(
  (logger: LoggerInterface) => {
    log = logger;
  }
);

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// describe("JzodLiteralEditor", () => {
//   console.log("######################################################### JzodLiteralEditor.test.tsx");
//   // const jzodLiteralEditorTest:JzodEditorTest<LocalLiteralEditorProps> = literalBeforeAll(pageLabel);
//   const jzodLiteralEditorTestSuites:JzodEditorTestSuites<LocalLiteralEditorProps> = literalBeforeAll(pageLabel);
//   log.info("jzodLiteralEditorTestSuites", jzodLiteralEditorTestSuites);

//   const testSuite: JzodEditorTestSuite<LocalLiteralEditorProps> = jzodLiteralEditorTestSuites["JzodLiteralEditor"];

//   Object.entries(jzodLiteralEditorTestSuites["JzodLiteralEditor"].tests).forEach(([testName, testCase]) => {
//     it(testName, () => {
//       if (testCase.renderComponent.renderAsComponent) {
//         const ComponentToRender: React.FC<LocalLiteralEditorProps> = testCase.renderComponent.renderAsComponent;
//         const props: LocalLiteralEditorProps | undefined = !testCase.componentProps?
//         typeof testCase.props === "function"
//           ? testCase.props(testSuite.suiteProps as any)
//           : testCase.props // why does typecheck work? it should fail!
//           : typeof testCase.componentProps === "function"
//           ? testCase.componentProps(typeof testCase.props == "function" || !testCase.props?testSuite.suiteProps: testCase.props as any) // TODO: testCase.props can be a function, which will fail.
//           : testCase.componentProps
//         ;
//         if (!props) {
//           console.warn(
//             `Test case ${testName} does not have props defined, skipping test: ${testName}`
//           );
//         } else {
//           render(<ComponentToRender {...props}/>);
//           const tests =
//             typeof testCase.tests === "function"
//               ? testCase.tests
//               : testCase.tests.testAsComponent ?? ((expect: ExpectStatic) => {});
//           tests(expect);
//         }
//       } else {
//         console.warn(
//           `Test case ${testName} does not have a renderAsComponent function, skipping test: ${testName}`
//         );
//       }
//     });
//   });
// });
describe("JzodLiteralEditor", () => {
  console.log("######################################################### JzodLiteralEditor.test.tsx");
  const jzodEnumEditorTestSuites: JzodEditorTestSuites<LocalLiteralEditorProps> =
    literalBeforeAll(pageLabel);
  log.info("jzodLiteralEditorTestSuites", jzodEnumEditorTestSuites);

  const testSuite: JzodEditorTestSuite<LocalLiteralEditorProps> =
    jzodEnumEditorTestSuites["JzodLiteralEditor"];
  Object.entries(testSuite.tests).forEach(([testName, testCase]) => {
    it(testName, () => {
      runJzodEditorTest(testCase, testSuite, testName, "component");
    });
  });
});
