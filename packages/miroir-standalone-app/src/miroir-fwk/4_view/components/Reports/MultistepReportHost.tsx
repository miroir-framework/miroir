import {
  LoggerInterface,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type CompositeActionSequenceTemplate,
  type DomainControllerInterface,
  type MiroirModelEnvironment,
  type Uuid,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(
  packageName,
  cleanLevel,
  "MultistepReportHost",
);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

export type RunMultistepFinishParams = {
  sequence: CompositeActionSequenceTemplate;
  stepBag: Record<string, any>;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  modelEnvironment: MiroirModelEnvironment;
  domainController: DomainControllerInterface;
};

export async function runMultistepFinish({
  sequence,
  stepBag,
  application,
  applicationDeploymentMap,
  modelEnvironment,
  domainController,
}: RunMultistepFinishParams) {
  log.info(
    "runMultistepFinish",
    application,
    "stepBag keys",
    Object.keys(stepBag),
    "sequence",
    sequence,
  );
  return domainController.handleCompositeActionTemplate(
    sequence,
    applicationDeploymentMap,
    modelEnvironment,
    stepBag,
  );
}
