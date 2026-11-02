import { v4 as uuidv4 } from "uuid";

import {
  Action2Error,
  MiroirLoggerFactory,
  type DomainControllerInterface,
  type EntityInstance,
  type InstanceAction,
  type LoggerInterface,
} from "@miroir-framework/core";

import { packageName } from "../constants.js";
import { cleanLevel } from "../miroir-fwk/4_view/constants.js";
import {
  ENTITY_PAGE_LOAD_MEASUREMENT_UUID,
  META_DEPLOYMENT_UUID,
  META_SELF_APPLICATION_UUID,
} from "./loadTimingConstants.js";
import type { LoadTimingStep, LoadTimingWrite } from "./loadTimingTypes.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "loadTimingWriter");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// #580: writes finished load steps as PageLoadMeasurement instances of the Meta app, in one
// createInstance action. Loaded on demand by the recorder, at its first write, so that its parse
// time falls outside every measured step.
// ################################################################################################

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";

/** handleInstanceAction reads the deployment of the action's application only: one entry is enough. */
const metaApplicationDeploymentMap = { [META_SELF_APPLICATION_UUID]: META_DEPLOYMENT_UUID };

export function pageLoadMeasurementInstance(step: LoadTimingStep): EntityInstance {
  return {
    uuid: uuidv4(),
    parentName: "PageLoadMeasurement",
    parentUuid: ENTITY_PAGE_LOAD_MEASUREMENT_UUID,
    ...step,
  } as EntityInstance;
}

/** The write of the recorder: one action for every queued step, on the Meta deployment. */
export function loadTimingWriter(domainController: DomainControllerInterface): LoadTimingWrite {
  return async (steps: LoadTimingStep[]) => {
    const action: InstanceAction = {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: META_SELF_APPLICATION_UUID,
        applicationSection: "data",
        objects: steps.map(pageLoadMeasurementInstance),
      },
    };
    try {
      const result = await domainController.handleAction(action, metaApplicationDeploymentMap);
      if (result instanceof Action2Error) {
        log.warn("load timings: the Meta deployment refused the measurements", result.errorType, result.errorMessage);
        return { ok: false, error: result.errorMessage ?? result.errorType };
      }
      return { ok: true };
    } catch (error) {
      log.warn("load timings: writing the measurements failed", error);
      return { ok: false, error: String(error) };
    }
  };
}
