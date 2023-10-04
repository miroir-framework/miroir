import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  ApplicationSection,
  FetchedData,
  MiroirQuery,
  MiroirSelectorFetchDataQueryParams,
  MiroirSelectorSingleQueryParams,
  RootReportSection,
  SelectObjectListQuery,
  Uuid,
  selectFetchedDataFromDomainState
} from "miroir-core";
import { ReduxStateWithUndoRedo, applyDomainStateSelector } from "miroir-redux";



import { ReportSectionView } from './ReportSectionView';

export interface ReportSectionEntityInstanceProps {
  fetchedData: Record<string,any>,
  reportSection: RootReportSection | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid?: Uuid,
}

let count = 0
// ###############################################################################################################
export const RootReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  count++;
  
  // const errorLog = useErrorLogService();

  console.log("########################## RootReportSectionView", count, "ReportSection", props.reportSection);

  // const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];
  console.log(
    "RootReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "fetchData",
    props.reportSection?.fetchData
  );

  const fetchedDataEntriesParams: MiroirSelectorFetchDataQueryParams = useMemo(() => ({
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
                  deploymentUuid: props.deploymentUuid,
                  applicationSection: props.applicationSection,
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
                  deploymentUuid: props.deploymentUuid,
                  applicationSection: props.applicationSection,
                  query: e[1] ?? {
                    type: "objectQuery",
                    parentUuid: undefined,
                    instanceUuid: undefined,
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
  ),[props.deploymentUuid, props.applicationSection,props.reportSection?.fetchData]);


  const initFetchedData = useMemo(()=>({
    // applicationSection: props.applicationSection,
    // deploymentUuid: props.deploymentUuid,
    // instanceUuid: props.instanceUuid,
  }),[])
  const pageParams = useMemo(()=>({
    applicationSection: props.applicationSection,
    deploymentUuid: props.deploymentUuid,
    instanceUuid: props.instanceUuid,
  }),[])
  const fetchedData: FetchedData | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectFetchedDataFromDomainState)(state, pageParams, initFetchedData, fetchedDataEntriesParams)
  );

  
  console.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData);
  console.log('RootReportSectionView props.reportSection',props.reportSection);

  if (props.applicationSection) {
    return (
      <div>
        <div>RootReportSectionView rendered {count}</div>
        <ReportSectionView
          fetchedData={fetchedData}
          reportSection={props.reportSection?.section}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
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
