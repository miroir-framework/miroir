import { Link, useNavigate } from 'react-router-dom';

import {
  ApplicationSection,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid
} from "miroir-core";

import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";


const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportInstanceLink");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


export interface EntityInstanceLinkProps {
  label?: string;
  visual?: "button" | "href";
  deploymentUuid?: Uuid,
  applicationSection: ApplicationSection,
  reportUuid: Uuid,
  instanceUuid: Uuid,
}

// ###############################################################################################################
export const ReportInstanceLink = (props: EntityInstanceLinkProps) => {

  log.info('ReportInstanceLink props',props);
  
  const navigate = useNavigate();
  const instance:any = {};

  if (props.applicationSection && props.instanceUuid) {
    if (props?.visual == "button") {
      return (
        <button
          onClick={() => {
            navigate(`/report/${props.deploymentUuid}/${props.applicationSection}/${props?.reportUuid}/${props.instanceUuid}`);
          }}
        >
          {/* {instance?.name} */}
          {props.label?props.label:instance?.name?instance?.name:"no label for link!"}
        </button>
      );
    } else {
      return (
        <Link
          to={`/report/${props.deploymentUuid}/${props.applicationSection}/${props?.reportUuid}/${props.instanceUuid}`}
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
