import {
  MiroirLoggerFactory,
  resolvePathOnObject,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
  transformerForBuild,
  zodErrorFirstIssueLeaf,
  ZodParseError,
  ZodParseErrorIssue,
  type LoggerInterface,
} from "miroir-core";
import { useState } from "react";
import { z } from "zod";
import { PageContainer } from "../components/Page/PageContainer.js";
import { usePageConfiguration } from "../services/index.js";
import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga")
).then((logger: LoggerInterface) => {log = logger});

let count = 0;

const testSubPartPathArray = [
  "definition",
  "testCompositeActions",
  "create new Entity and reports from spreadsheet",
  "compositeAction",
  "templates",
];
// const valuePath = "definition.testCompositeActions"
const testSubPart = resolvePathOnObject(
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
  testSubPartPathArray
);

const pageLabel = "Check";

export const CheckPage: React.FC<any> = (
  props: any // TODO: give a type to props!!!
) => {
  count++;
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Check page configurations loaded successfully",
    actionName: "check page configuration fetch"
  });
  
  const [testInput, setTestInput] = useState<string>("");
  const [testResult, setTestResult] = useState<JSX.Element>(<></>);

  const checkTestDefinition = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("testInput") as HTMLInputElement;
    const inputValue = input.value;
    log.info("Form submitted with value:", inputValue);
    // Here you can add logic to handle the input value, e.g., validate or process it
    if (!inputValue) {
      try {
        // const result = test_createEntityAndReportFromSpreadsheetAndUpdateMenu(inputValue);

        z.record(transformerForBuild).parse(testSubPart);
        setTestResult(<div style={{ color: "green" }}>Input is valid!</div>);
        // log.info("Result:", result);
      } catch (error) {
        console.error("Error processing input:", error);
        const zodParseError = error as ZodParseError;
        // const firstIssue = (error as any).issues[0];
        const firstIssue = zodErrorFirstIssueLeaf(zodParseError);
        setTestResult(
          <pre style={{ color: "red" }}>
            {/* error: {error}
            <br /> */}
            name: {(error as any).name}
            <br />
            {/* message: {(error as Error).message}
            <br /> */}
            first issue code: {(error as any).issues[0].code}
            <br />
            first issue message: {(error as any).issues[0].message}
            <br />
            first issue path: {(error as any).issues[0].path}
            <br />
            issue: <pre>{JSON.stringify(firstIssue, null, 2)}</pre>
            ##############################################################################################
            <br />
            {/* {JSON.stringify((error as any), null, 2)} */}
            {JSON.stringify(error as any)}
          </pre>
        );
        // setTestResult("Error: " + (error as Error).message);
      }
    }
  };

  return (
    <PageContainer>
      <h1>Check</h1>
      This is the Check page. It has been rendered {count} times.
      <br />
      path: {testSubPartPathArray.join(".")}
      <br />
      {testResult}
      {/* <span style={{ color: "red" }}>{testResult}</span> */}
      <div>
        <form id={"form." + pageLabel} onSubmit={checkTestDefinition}>
          <button type="submit" name={pageLabel} form={"form." + pageLabel}>
            submit form.{pageLabel}
          </button>
          <input
            type="text"
            name="testInput"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
          />
          {/* </input> */}
        </form>
      </div>
      <div>
        <pre>
          {/* {JSON.stringify(test_createEntityAndReportFromSpreadsheetAndUpdateMenu, null, 2)} */}
          {JSON.stringify(testSubPart, null, 2)}
        </pre>
      </div>
    </PageContainer>
  );
};
