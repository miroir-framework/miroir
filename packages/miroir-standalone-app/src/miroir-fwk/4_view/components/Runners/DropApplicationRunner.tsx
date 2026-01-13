
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
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DropApplicationRunner"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface DropApplicationToolProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}

export const DropApplicationRunner: React.FC<DropApplicationToolProps> = ({
  applicationDeploymentMap,
}) => {

  return (
    <StoredRunnerView
      applicationUuid={selfApplicationMiroir.uuid}
      applicationDeploymentMap={applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
      runnerUuid="1cd065d8-dfb0-466f-974c-e81e993f2c66"
    />
  );
};
