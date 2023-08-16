import {
  ApplicationDeployment,
  ApplicationSection,
  EntityInstancesUuidIndex,
  Uuid
} from "miroir-core";
import { useNavigate } from 'react-router-dom';
import { useEntityInstanceUuidIndexFromLocalCache } from "./ReduxHooks";




// duplicated from server!!!!!!!!
const applicationDeploymentLibrary: ApplicationDeployment = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeployment",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for Application Library",
  "applicationModelLevel": "model",
  "model": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  },
  "data": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  }
}

export interface EntityInstanceLinkProps {
  label: string;
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  entityUuid: Uuid,
  instanceUuid: Uuid,
  // store:any;
  // reportName: string;
}

// export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const EntityInstanceLink = (props: EntityInstanceLinkProps) => {
  // const params = useParams<any>() as Readonly<Params<EntityInstanceUrlParamKeys>>;
  // const params = useParams<ReportUrlParams>();

  console.log('EntityInstanceLink props',props);
  
  const navigate = useNavigate();

  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection as ApplicationSection,
      entityUuid: props.entityUuid,
    }
  );

  const instance:any = instancesToDisplayUuidIndex && props.instanceUuid?instancesToDisplayUuidIndex[props.instanceUuid]:undefined;

  if (props.applicationSection && props.instanceUuid) {
    return (
      <>
          <button
            onClick={() => {
              navigate(`/instance/${props.deploymentUuid}/${props.applicationSection}/${props?.entityUuid}/${props.instanceUuid}`);
            }}
          >
            {instance?.name}
          </button>
      </>
    );
  } else {
    return (
      <>
        Invalid parameters!
      </>
    )
  }
};
