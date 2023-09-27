import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  ApplicationDeployment,
  ApplicationSection,
  FetchedData,
  MiroirQuery,
  MiroirSelectorManyQueryParams,
  MiroirSelectorSingleQueryParams,
  RootReportSection,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  selectFetchedDataFromDomainState
} from "miroir-core";
import { ReduxStateWithUndoRedo, applyDomainStateSelector } from "miroir-redux";

import {
  useErrorLogService
} from "miroir-fwk/4_view/MiroirContextReactProvider";


import { ReportSectionView } from './ReportSectionView';

export interface ReportSectionEntityInstanceProps {
  fetchedData: Record<string,any>,
  reportSection: RootReportSection | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid: Uuid,
}

// ###############################################################################################################
export const RootReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();

  console.log("########################## RootReportSectionView ReportSection", props.reportSection);

  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  console.log("RootReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);

  console.log(
    "RootReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    props.reportSection?.fetchData?.book?.parentUuid,
  );

  const fetchedDataEntriesParams: MiroirSelectorManyQueryParams = useMemo(() => ({
    type: "ManyQueryParams",
    definition: Object.fromEntries(
      Object.entries(props.reportSection?.fetchData??{}).map(
        (e:[string, MiroirQuery])=> {
          let result;
          switch (e[1].type) {
            case "objectListQuery": {
              result = {
                type: "EntityInstanceListQueryParams",
                definition: {
                  localCacheSelectorParams: {
                    deploymentUuid: props.deploymentUuid,
                    applicationSection: props.applicationSection,
                    entityUuid: e[1].parentUuid,
                  },
                  query: (e[1] as SelectObjectListQuery) ?? {
                    type: "objectListQuery",
                    parentUuid: "",
                    parentName: undefined,
                    rootObjectAttribute: undefined,
                    rootObjectUuid: undefined,
                  },
                }
              }
              break;
            }
            case "objectQuery": {
              result = {
                type: "EntityInstanceQueryParams",
                definition: {
                  localCacheSelectorParams: {
                    deploymentUuid: props.deploymentUuid,
                    applicationSection: props.applicationSection as ApplicationSection,
                    entityUuid: e[1]?.parentUuid??"",
                    instanceUuid: e[1]?.rootObjectUuid??e[1]?.instanceUuid,
                  },
                  query: {
                    type: "objectQuery",
                    deploymentUuid: props.deploymentUuid,
                    applicationSection: props.applicationSection as ApplicationSection,
                    parentUuid: e[1]?.parentUuid??"",
                    instanceUuid: e[1]?.instanceUuid,
                  }
                }
              };
              break;
            }
            default:{
              result = {} as MiroirSelectorSingleQueryParams;
              break;
            }
          }
          return [e[0], result as MiroirSelectorSingleQueryParams];
        }
      )
    )
  }
  ),[props.deploymentUuid, props.applicationSection,props.reportSection?.fetchData?.booksOfPublisher]);


  const fetchedData: FetchedData | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectFetchedDataFromDomainState)(state, fetchedDataEntriesParams)
  );

  
  console.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData);
  console.log('RootReportSectionView props.reportSection',props.reportSection);

  if (props.applicationSection) {
    return (
      <div>
        <ReportSectionView
          fetchedData={fetchedData}
          reportSection={props.reportSection?.section}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
          instanceUuid={props.instanceUuid}

        />
      </div>
    );
  } else {
    return (
      <>
        RootReportSection Invalid props! {JSON.stringify(props)}
      </>
    )
  }
};
