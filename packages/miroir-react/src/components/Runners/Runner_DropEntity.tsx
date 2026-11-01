
import type {
  ApplicationDeploymentMap,
  LoggerInterface
} from "@miroir-framework/core";
import { defaultSelfApplicationDeploymentMap, MiroirLoggerFactory } from "@miroir-framework/core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../../viewConstants.js";
import { StoredRunnerView } from "./RunnerView.js";

import { selfApplicationMiroir } from "@miroir-framework/core/meta-model";
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

