import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  ApplicationSection,
  FetchedData,
  MiroirSelectQuery,
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
    "selectData",
    props.reportSection?.selectData
  );

  const fetchedDataEntriesParams: MiroirSelectorFetchDataQueryParams = useMemo(() => ({
    type: "ManyQueryParams",
    definition: Object.fromEntries(
      Object.entries(props.reportSection?.selectData??{}).map(
        (e:[string, MiroirSelectQuery])=> {
          const result = {
            type: "ObjectQueryParams",
            definition: {
              deploymentUuid: props.deploymentUuid,
              applicationSection: props.applicationSection,
              query: e[1] ?? {
                type: "objectQuery",
                parentUuid: "",
                parentName: undefined,
                instanceUuid: undefined,
              },
            }
          };

          return [e[0], result as MiroirSelectorSingleQueryParams];
        }
      )
    )
  }
  ),[props.deploymentUuid, props.applicationSection,props.reportSection?.selectData]);


  const initFetchedData = useMemo(()=>({
    // applicationSection: props.applicationSection,
    // deploymentUuid: props.deploymentUuid,
    // instanceUuid: props.instanceUuid,
  }),[])
  const pageParams = useMemo(()=>({
    applicationSection: props.applicationSection,
    deploymentUuid: props.deploymentUuid,
    instanceUuid: props.instanceUuid,
  }),[props])
  const fetchedData: FetchedData | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectFetchedDataFromDomainState)(state, pageParams, initFetchedData, fetchedDataEntriesParams)
  );

  
  console.log("RootReportSectionView props.reportSection?.selectData",props.reportSection?.selectData,"fetchedData", fetchedData);
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
