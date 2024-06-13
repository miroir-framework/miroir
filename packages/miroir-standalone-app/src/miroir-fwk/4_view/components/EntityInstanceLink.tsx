import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  EntityInstancesUuidIndex,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  getLoggerName
} from "miroir-core";
import { Link, useNavigate } from 'react-router-dom';

import { useEntityInstanceUuidIndexFromLocalCache } from "../ReduxHooks.js";
import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";


const loggerName: string = getLoggerName(packageName, cleanLevel,"EntityInstanceLink");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


export interface EntityInstanceLinkProps {
  label?: string;
  visual?: "button" | "href";
  deploymentUuid?: Uuid,
  applicationSection: ApplicationSection,
  entityUuid: Uuid,
  instanceUuid: Uuid,
  // store:any;
  // reportName: string;
}

// ###############################################################################################################
export const EntityInstanceLink = (props: EntityInstanceLinkProps) => {

  log.info('EntityInstanceLink props',props);
  
  const navigate = useNavigate();

  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: props.deploymentUuid,
        applicationSection: props.applicationSection as ApplicationSection,
        entityUuid: props.entityUuid,
      }
    }
  );

  const instance:any = instancesToDisplayUuidIndex && props.instanceUuid?instancesToDisplayUuidIndex[props.instanceUuid]:undefined;

  if (props.applicationSection && props.instanceUuid) {
    if (props?.visual == "button") {
      return (
        <button
          onClick={() => {
            navigate(`/instance/${props.deploymentUuid}/${props.applicationSection}/${props?.entityUuid}/${props.instanceUuid}`);
          }}
        >
          {/* {instance?.name} */}
          {props.label?props.label:instance?.name?instance?.name:"no label for link!"}
        </button>
      );
    } else {
      return (
        <Link
          to={`/instance/${props.deploymentUuid}/${props.applicationSection}/${props?.entityUuid}/${props.instanceUuid}`}
        >
          {props.label ? props.label : instance?.name ? instance?.name : "no label for link!"}
        </Link>
      );
      
    }
  } else {
    return (
      <>
        Invalid parameters! {JSON.stringify(props)}
      </>
    )
  }
};
