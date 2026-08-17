
import {
  type ApplicationDeploymentMap,
  defaultSelfApplicationDeploymentMap,
  type LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { StoredRunnerView } from "./RunnerView.js";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateEntity");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface LibraryRunner_LendDocumentProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}


// ################################################################################################
export const LibraryRunner_LendDocument: React.FC<LibraryRunner_LendDocumentProps> = (props) => {


  return (
    <>
        <StoredRunnerView
          applicationUuid={selfApplicationLibrary.uuid}
          applicationDeploymentMap={props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
          runnerUuid="cc853632-f158-43fa-b9ed-437c9c25f539"
        />
    </>
  );
};
