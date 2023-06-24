import Box from '@mui/material/Box';
import { Params, useNavigate, useParams } from 'react-router-dom';
import {
  ApplicationDeployment,
  ApplicationSection,
  ConfigurationService,
  DomainControllerInterface,
  EntityDefinition,
  MetaEntity,
  MiroirMetaModel,
  Report,
  Uuid,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import { useDomainControllerServiceHook, useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
import {
  useLocalCacheDeploymentSectionReports,
  useLocalCacheInstancesForEntity,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheTransactions
} from "miroir-fwk/4_view/hooks";
import { ReduxStateChanges } from "miroir-redux";


import { ReportSectionDisplay } from './ReportSectionDisplay';
import { Button, List, ListItem, ListItemButton } from '@mui/material';
import { getColumnDefinitions } from './EntityViewer';

import entityBook from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";

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

  if (props.applicationSection && props.instanceUuid) {
    return (
      <>
          <button
            onClick={() => {
              navigate(`/instance/${props.deploymentUuid}/${props.applicationSection}/${props?.entityUuid}/${props.instanceUuid}`);
            }}
          >
            {props.label}
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
