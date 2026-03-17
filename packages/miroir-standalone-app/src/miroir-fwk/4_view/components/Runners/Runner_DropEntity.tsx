
import type {
  ApplicationDeploymentMap,
  LoggerInterface
} from "miroir-core";
import {
  defaultSelfApplicationDeploymentMap,
  MiroirLoggerFactory,
  selfApplicationMiroir
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { StoredRunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_DropEntity"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface CreateEntityToolProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}


// ################################################################################################
export const Runner_DropEntity: React.FC<CreateEntityToolProps> = ({
  applicationDeploymentMap,
}) => {
  
  return (
    <StoredRunnerView
      applicationUuid={selfApplicationMiroir.uuid}
      applicationDeploymentMap={applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
      runnerUuid="44313751-b0e5-4132-bb12-a544806e759b"
    />
  );
};

