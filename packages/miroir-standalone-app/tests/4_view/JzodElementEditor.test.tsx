import { describe, it } from "vitest";

import '@testing-library/jest-dom';

import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { cleanLevel, packageName } from "../3_controllers/constants";
import {
  enumBeforeAll,
  JzodEditorTestSuite,
  JzodEditorTestSuites,
  literalBeforeAll,
  LocalEnumEditorProps,
  LocalLiteralEditorProps,
  runJzodEditorTest
} from "./JzodElementEditorTestTools";


// ################################################################################################
const pageLabel = "JzodElementEditor.test";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, pageLabel)).then(
  (logger: LoggerInterface) => {
    log = logger;
  }
);

// ##############################################################################################
describe("JzodElementEditor", () => {
  const jzodEnumEditorTestSuites:JzodEditorTestSuites<LocalEnumEditorProps> = enumBeforeAll(pageLabel);
  log.info("jzodEnumEditorTestSuites", jzodEnumEditorTestSuites);
  const testSuite: JzodEditorTestSuite<LocalEnumEditorProps> = jzodEnumEditorTestSuites["JzodEnumEditor"];
  Object.entries(testSuite.tests).forEach(([testName, testCase]) => {
    it(testName, () => {
      runJzodEditorTest(testCase, testSuite, testName, "jzodElementEditor");
    });
  });

  const jzodLiteralEditorTestSuites:JzodEditorTestSuites<LocalLiteralEditorProps> = literalBeforeAll(pageLabel);
  log.info("jzodLiteralEditorTestSuites", jzodLiteralEditorTestSuites);
  const literalTestSuite: JzodEditorTestSuite<LocalLiteralEditorProps> = jzodLiteralEditorTestSuites["JzodLiteralEditor"];
  Object.entries(literalTestSuite.tests).forEach(([testName, testCase]) => {
    it(testName, () => {
      runJzodEditorTest(testCase, literalTestSuite, testName, "jzodElementEditor");
    });
  });
});