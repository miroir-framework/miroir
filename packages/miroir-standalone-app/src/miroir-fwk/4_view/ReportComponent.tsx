import { ApplicationSection, EntityDefinition, EntityInstance, MetaEntity, MiroirReport } from "miroir-core";
import {
  useLocalCacheDeploymentSectionReports,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheEntityDefinitions,
  useLocalCacheInstancesForReport,
  useLocalCacheReports,
  useLocalCacheInstancesForEntity,
} from "miroir-fwk/4_view/hooks";
import * as React from "react";

import { MTableComponent } from "./MTableComponent";
import { getColumnDefinitions } from "miroir-fwk/4_view/EntityViewer";
// import { getColumnDefinitions } from "miroir-react";

export interface MiroirReportComponentProps {
  // reportName: string;
  chosenDeploymentUuid: string;
  chosenApplicationSection: ApplicationSection | undefined;
  currentMiroirReport: MiroirReport | undefined;
  // currentMiroirEntity: MetaEntity | undefined;
  currentMiroirEntityDefinition: EntityDefinition | undefined;
  reportUuid: string;
};


export const ReportComponent: React.FC<MiroirReportComponentProps> = (
  props: MiroirReportComponentProps
) => {
  // console.log("ReportComponent props",props);
  // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();
  // const miroirReports:MiroirReport[] = useLocalCacheReports();
  
  
  // const miroirEntities:MetaEntity [] = useLocalCacheSectionEntities(props.deploymentUuid,'model');
  // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(props.deploymentUuid,'model');
  // const deploymentReports: MiroirReport[] = useLocalCacheDeploymentSectionReports(props.deploymentUuid,'model');
  // console.log("ReportComponent miroirEntities",miroirEntities, "miroirEntityDefinitions", miroirEntityDefinitions);
  
  const instancesToDisplay: EntityInstance[] = useLocalCacheInstancesForEntity(
    props.chosenDeploymentUuid,
    props.chosenApplicationSection,
    props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
  );

  const instancesStringified: EntityInstance[] = instancesToDisplay.map(
    (i) =>
      Object.fromEntries(
        Object.entries(i).map((e) => [
          e[0],
          props.currentMiroirEntityDefinition?.attributes?.find((a) => a.name == e[0])?.type == "OBJECT"
            ? JSON.stringify(e[1])
            : e[1],
        ])
      ) as EntityInstance
  );
  console.log("ReportComponent instancesToDisplay",instancesToDisplay);
  // console.log("ReportComponent currentMiroirReport",currentMiroirReport);
  // console.log("ReportComponent currentMiroirEntity",currentMiroirEntity);
  const columnDefs=props.currentMiroirEntityDefinition?getColumnDefinitions(props.currentMiroirEntityDefinition?.attributes):[];
  console.log("ReportComponent columnDefs",columnDefs);

  return (
    <div>
      <div>
          {/* props: {JSON.stringify(props)} */}
          {/* erreurs: {JSON.stringify(errorLog.getErrorLog())} */}
          colonnes: {JSON.stringify(columnDefs)}
          <p/>
          deployment: {JSON.stringify(props.chosenDeploymentUuid)}
          <p/>
        <h3>
          {props.currentMiroirReport?.defaultLabel}
        </h3>

      </div>
      <p></p>
      <div>
        {
          props.currentMiroirReport?
            (
              columnDefs?.length > 0?
                <div>
                  <MTableComponent
                    reportDefinition={props.currentMiroirReport}
                    columnDefs={columnDefs}
                    rowData={instancesStringified}
                  >
                  </MTableComponent>
                </div>
              :
                <span>No elements in the report</span>
            )
          :
            <span>no report to display</span>
        }
      </div>
    </div>
  );
}