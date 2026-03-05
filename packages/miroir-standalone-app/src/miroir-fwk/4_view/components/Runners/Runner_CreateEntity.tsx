
import type {
  ApplicationDeploymentMap,
  LoggerInterface
} from "miroir-core";
import {
  defaultSelfApplicationDeploymentMap,
  MiroirLoggerFactory
} from "miroir-core";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { StoredRunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateEntity"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface CreateEntityToolProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}


// ################################################################################################
export const Runner_CreateEntity: React.FC<CreateEntityToolProps> = ({
  applicationDeploymentMap,
}) => {
  return (
    <StoredRunnerView
      applicationUuid={selfApplicationMiroir.uuid}
      applicationDeploymentMap={applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
      runnerUuid="82f81a25-2366-4abf-8a97-83ca5e9a9c46"
    />
  );
};
