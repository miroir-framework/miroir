import { describe, it } from "vitest";

import '@testing-library/jest-dom';

import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { JzodEnumEditor } from "../../src/miroir-fwk/4_view/components/JzodEnumEditor";
import { JzodLiteralEditor } from "../../src/miroir-fwk/4_view/components/JzodLiteralEditor";
import { cleanLevel, packageName } from "../3_controllers/constants";
import {
  getJzodArrayEditorTests,
  getJzodBookEditorTests,
  getJzodEditorTestSuites,
  getJzodEntityDefinitionEditorTests,
  getJzodEnumEditorTests,
  getJzodLiteralEditorTests,
  getJzodObjectEditorTests,
  getJzodSimpleTypeEditorTests,
  getJzodUnionEditorTests,
  JzodEditorTestSuites,
  JzodElementEditorProps_Test,
  runJzodEditorTest
} from "./JzodElementEditorTestTools";
import { JzodArrayEditor } from "../../src/miroir-fwk/4_view/components/JzodArrayEditor";
import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";


// ################################################################################################
const pageLabel = "JzodElementEditor.test";

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
// ################################################################################################
// ################################################################################################
// ################################################################################################
export type TestMode = 'jzodElementEditor' | 'component';
export type TestModeStar = 'jzodElementEditor' | 'component' | '*';

const allTestModes: TestMode[] = ['jzodElementEditor', 'component'];

export interface JzodElementEditorTestSuite<LocalEditorProps extends Record<string, any>> {
  editor: React.FC<any>;
  getJzodEditorTests: (
    LocalEditor: React.FC<LocalEditorProps>,
    jzodElementEditor: React.FC<JzodElementEditorProps_Test>
  ) => JzodEditorTestSuites<LocalEditorProps>;
}

type ModesType = TestModeStar | TestMode[];

const jzodElementEditorTests: Record<
  string,
  JzodElementEditorTestSuite<any> & { modes?: ModesType }
> = {
  // JzodArrayEditor: { 
  //   editor: JzodArrayEditor, 
  //   getJzodEditorTests: getJzodArrayEditorTests,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
  // JzodEnumEditor: {
  //   editor: JzodEnumEditor,
  //   getJzodEditorTests: getJzodEnumEditorTests,
  //   // modes: '*',
  //   modes: "jzodElementEditor",
  //   // modes: "component",
  // },
  // JzodLiteralEditor: { 
  //   editor: JzodLiteralEditor, 
  //   getJzodEditorTests: getJzodLiteralEditorTests,
  //   // modes: "*",
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: "jzodElementEditor",
  //   // modes: "component",
  // },
  // JzodObjectEditor: { 
  //   editor: JzodElementEditor, 
  //   getJzodEditorTests: getJzodObjectEditorTests,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
  JzodSimpleTypeEditor: { 
    editor: JzodElementEditor, 
    getJzodEditorTests: getJzodSimpleTypeEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  // JzodUnionEditor: { 
  //   editor: JzodElementEditor, 
  //   getJzodEditorTests: getJzodUnionEditorTests,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
  // // ################# INSTANCES
  // JzodBookEditor: { 
  //   editor: JzodElementEditor, 
  //   getJzodEditorTests: getJzodBookEditorTests,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
  // // ################# MODEL
  // JzodEntityDefinitionEditor: { 
  //   editor: JzodElementEditor, 
  //   getJzodEditorTests: getJzodEntityDefinitionEditorTests,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
};

// ##############################################################################################
describe("JzodElementEditor", () => {
  Object.entries(jzodElementEditorTests).forEach(([editorName, testSuite]) => {
    const suites = getJzodEditorTestSuites(
      pageLabel,
      testSuite.editor,
      testSuite.getJzodEditorTests
    );
    let modes: TestMode[];
    if (testSuite.modes === undefined) {
      modes = allTestModes;
    } else if (Array.isArray(testSuite.modes)) {
      modes = testSuite.modes;
    } else if (testSuite.modes === '*') {
      // If the mode is '*', we run all test modes
      modes = allTestModes;
    } else {
      modes = [testSuite.modes];
    }

    console.log(`Running tests for ${editorName} with ${Object.keys(suites).length} suites and modes: ${modes.join(', ')}`);
    console.log(`Test suites: ${JSON.stringify(suites, null, 2)}`);
    // Run all testcases for the first mode, then all for the second, etc.
    modes.forEach((mode: TestMode) => {
      Object.entries(suites[editorName].tests).forEach(([testName, testCase]) => {
        it(`${editorName} - ${mode} - ${testName}`, async () => {
          await runJzodEditorTest(testCase, suites[editorName], testName, mode);
        });
      });
    });
  });
});