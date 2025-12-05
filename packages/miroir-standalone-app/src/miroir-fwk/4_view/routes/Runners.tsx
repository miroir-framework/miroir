import { ExpandMoreIcon } from '../components/Themes/MaterialSymbolWrappers';
// import { z } from "zod";

import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import {
  adminConfigurationDeploymentParis,
  MiroirLoggerFactory,
  resolvePathOnObject,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
  type LoggerInterface
} from "miroir-core";
import { packageName } from "../../../constants.js";
import { CreateApplicationRunner } from '../components/Runners/CreateApplicationRunner.js';
import { CreateEntityRunner } from '../components/Runners/CreateEntityRunner.js';
import { DeleteApplicationRunner } from '../components/Runners/DeleteApplicationRunner.js';
import { DeleteEntityRunner } from '../components/Runners/DeleteEntityRunner.js';
import { PageContainer } from "../components/Page/PageContainer.js";
import { ReportPageContextProvider } from "../components/Reports/ReportPageContext.js";
import { cleanLevel } from "../constants.js";
import { usePageConfiguration } from "../services/index.js";
import { ImportEntityFromSpreadsheetRunner } from '../components/Runners/ImportEntityFromSpreadsheetRunner.js';
import { useState } from 'react';
import { noValue } from '../components/ValueObjectEditor/JzodElementEditorInterface.js';
import { ApplicationSelector } from '../components/interactive/ApplicationSelector.js';
import { EndpointActionCaller } from '../components/EndpointActionCaller.js';
import { LibraryRunner_LendDocument } from '../components/Runners/LibraryRunner_LendDocument.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga"), "UI",
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

const pageLabel = "Admin";

// ################################################################################################
function formatYYYYMMDD_HHMMSS(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
}

// ################################################################################################
export const RunnersPage: React.FC<any> = (
  props: any // TODO: give a type to props!!!
) => {
  count++;
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Check page configurations loaded successfully",
    actionName: "check page configuration fetch"
  });
  
  const deploymentUuid = adminConfigurationDeploymentParis.uuid;

  return (
    <ReportPageContextProvider>
      <PageContainer>
        <h1>Admin</h1>
        This is the Admin page. It has been rendered {count} times.
        <br />
        {/* path: {testSubPartPathArray.join(".")} */}
          {/* <ApplicationSelector
            applicationUuid={currentApplication}
            onApplicationChange={setCurrentApplication}
          />
        <br /> */}
        {/* Lend Library Document */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Lend Document</div>
          </AccordionSummary>
          <AccordionDetails>
            <LibraryRunner_LendDocument
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* Create Application & Deployment */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Create Application & Deployment</div>
          </AccordionSummary>
          <AccordionDetails>
            <CreateApplicationRunner
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* Delete Application & Deployment */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Delete Application & Deployment</div>
          </AccordionSummary>
          <AccordionDetails>
            <DeleteApplicationRunner
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* create entity */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Create Entity</div>
          </AccordionSummary>
          <AccordionDetails>
            <CreateEntityRunner
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* delete entity */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Drop Entity</div>
          </AccordionSummary>
          <AccordionDetails>
            <DeleteEntityRunner
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* create entity from import */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Import Entity From Spreadsheet</div>
          </AccordionSummary>
          <AccordionDetails>
            <ImportEntityFromSpreadsheetRunner
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* Endpoint Action Caller */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Endpoint Action Caller</div>
          </AccordionSummary>
          <AccordionDetails>
            <EndpointActionCaller />
          </AccordionDetails>
        </Accordion>
      </PageContainer>
    </ReportPageContextProvider>
  );
};
