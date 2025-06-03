import "@testing-library/jest-dom";
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { describe, it } from "vitest";
import { cleanLevel, packageName } from "../3_controllers/constants";
import {
  enumBeforeAll,
  JzodEditorTestSuite,
  JzodEditorTestSuites,
  LocalEnumEditorProps,
  runJzodEditorTest,
} from "./JzodElementEditorTestTools";

const pageLabel = "JzodEnumEditor.test";
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, pageLabel)
).then((logger: LoggerInterface) => {
  log = logger;
});

describe("JzodEnumEditor", () => {
  console.log("######################################################### JzodEnumEditor.test.tsx");
  const jzodEnumEditorTestSuites: JzodEditorTestSuites<LocalEnumEditorProps> =
    enumBeforeAll(pageLabel);
  log.info("jzodEnumEditorTestSuites", jzodEnumEditorTestSuites);

  const testSuite: JzodEditorTestSuite<LocalEnumEditorProps> =
    jzodEnumEditorTestSuites["JzodEnumEditor"];
  Object.entries(testSuite.tests).forEach(([testName, testCase]) => {
    it(testName, () => {
      runJzodEditorTest(testCase, testSuite, testName, "component");
    });
  });
});
