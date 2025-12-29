import { useMemo } from "react";

import type {
  Domain2QueryReturnType,
  LoggerInterface,
  Runner
} from "miroir-core";
import {
  adminConfigurationDeploymentMiroir,
  Domain2ElementFailed,
  MiroirLoggerFactory,
  selfApplicationMiroir
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useRunner } from "../Reports/ReportHooks.js";
import { ThemedOnScreenDebug, ThemedOnScreenHelper } from "../Themes/BasicComponents.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { StoredRunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DeleteEntityRunner"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface CreateEntityToolProps {
  deploymentUuid: string;
}


// ################################################################################################
export const DeleteEntityRunner: React.FC<CreateEntityToolProps> = ({
  deploymentUuid,
}) => {
  
  const runnerDefinitionFromLocalCache: Domain2QueryReturnType<Runner | undefined> = useRunner(
    adminConfigurationDeploymentMiroir.uuid,
    "44313751-b0e5-4132-bb12-a544806e759b"
  );
  const runnerName: string =
    runnerDefinitionFromLocalCache instanceof Domain2ElementFailed
      ? ""
      : runnerDefinitionFromLocalCache?.name ?? "";

  const initialFormValue = useMemo(() => {
    return {
      [runnerName]: {
        application: noValue.uuid,
        entity: noValue.uuid,
      },
    };
  }, [runnerName]);



  return runnerDefinitionFromLocalCache?
  runnerDefinitionFromLocalCache instanceof Domain2ElementFailed ?
    (<ThemedOnScreenHelper
      label={`DeleteEntityRunner for ${runnerName} error`}
      data={runnerDefinitionFromLocalCache}
      // initiallyUnfolded={false}
    />)
  :(
    <>
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} initialFormValue`}
        data={initialFormValue}
        // initiallyUnfolded={false}
      />
      {/* <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} deploymentUuidQuery`}
        data={deploymentUuidQuery}
        initiallyUnfolded={false}
      /> */}
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} runnerDefinitionFromLocalCache`}
        data={runnerDefinitionFromLocalCache}
        initiallyUnfolded={false}
      />

      <StoredRunnerView
        applicationUuid={selfApplicationMiroir.uuid}
        storedRunner={runnerDefinitionFromLocalCache}
      />
    </>
  ): (<div>DeleteEntityRunner: loading runner definition...</div>
  );
};

