
import type {
  ApplicationDeploymentMap,
  LoggerInterface
} from "miroir-core";
import { defaultSelfApplicationDeploymentMap, MiroirLoggerFactory } from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { StoredRunnerView } from "./RunnerView.js";

import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_DropEntity");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
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

