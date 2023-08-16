import { ApplicationSection, EntityInstancesUuidIndex, MetaEntity, Uuid } from "miroir-core";
import { useEntityInstanceUuidIndexFromLocalCache } from "./ReduxHooks";
import { JzodElement } from "@miroir-framework/jzod";
import { List, ListItem } from "@mui/material";
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from "./getColumnDefinitionsFromEntityAttributes";
import { ReportSectionDisplay } from "./ReportSectionDisplay";
import { EntityInstanceLink } from "./EntityInstanceLink";

export interface JzodObjectDisplayProps {
  // label: string;
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
  entityJzodSchema?: { [attributeName: string]: JzodElement },
  currentReportDeploymentSectionEntities?: MetaEntity[],
  // currentReportTargetEntityDefinition: Enti
  // store:any;
  // reportName: string;
}


export function JzodObjectDisplay(props: JzodObjectDisplayProps){

  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection as ApplicationSection,
      entityUuid: props.entityUuid,
    }
  );

  const instance:any = instancesToDisplayUuidIndex && props.instanceUuid?instancesToDisplayUuidIndex[props.instanceUuid]:undefined;

  return (
    <List sx={{ pt: 0}}>
    {
      Object.entries(props.entityJzodSchema?props.entityJzodSchema:{})?.map(
        (entityAttribute:[string,JzodElement]) => {
          const currentAttributeJzodSchema = entityAttribute[1];
          switch (currentAttributeJzodSchema.type) {
            case "array": {
              const columnDefs:any[]=getColumnDefinitionsFromEntityDefinitionJzodSchema(currentAttributeJzodSchema.definition);
              return (
                <ListItem disableGutters key={entityAttribute[0]}>
                  <span>
                    <ReportSectionDisplay
                      tableComponentReportType="JSON_ARRAY"
                      label={"JSON_ARRAY-"+entityAttribute[0]}
                      columnDefs={columnDefs}
                      rowData={instance[entityAttribute[0]]}
                      styles={
                        {
                          width: '50vw',
                          height: '22vw',
                        }
                      }
                    ></ReportSectionDisplay>
                  </span>
                </ListItem>
              )
              break;
            }
            // case "object": {
            //   const columnDefs:any[]=getColumnDefinitionsFromEntityDefinitionJzodSchema((currentAttributeJzodSchema as JzodObject).definition);
            //   return (
            //     <ListItem disableGutters key={entityAttribute[0]}>
            //       <span>

            //         {/* <ReportSectionDisplay
            //           tableComponentReportType="JSON_ARRAY"
            //           label={"JSON_ARRAY-"+entityAttribute[0]}
            //           columnDefs={columnDefs}
            //           rowData={instance[entityAttribute[0]]}
            //           styles={
            //             {
            //               width: '50vw',
            //               height: '22vw',
            //             }
            //           }
            //         ></ReportSectionDisplay> */}
            //       </span>
            //     </ListItem>
            //   )
            //   break;
            // }
            case "simpleType": {
              // navigate(`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/${targetEntity?.uuid}/${e.data[e.colDef.field]}`);
              const targetEntityUuid = currentAttributeJzodSchema.extra?.targetEntity
              if (
                currentAttributeJzodSchema.definition == "string" &&
                targetEntityUuid
              ) {
                const targetEntity: MetaEntity | undefined = props.currentReportDeploymentSectionEntities?.find(
                  (e) => e.uuid == targetEntityUuid
                );
                // const targetEntity:MetaEntity| undefined = currentReportDeploymentSectionEntities.find(e=>e.uuid == targetEntityUuid) 
                return (
                  <ListItem  disableGutters key={entityAttribute[0]}>
                    {currentAttributeJzodSchema?.extra?.defaultLabel}:
                    <EntityInstanceLink
                      deploymentUuid={props.deploymentUuid as string}
                      applicationSection={props.applicationSection as ApplicationSection}
                      entityUuid={targetEntity?.uuid as string}
                      instanceUuid={instance[entityAttribute[0]]}
                      label={instance[entityAttribute[0]]}
                      key={instance[entityAttribute[0]]}
                    />
                  </ListItem>
                );
              } else {
                return (
                  <ListItem key={entityAttribute[0]}>
                    {currentAttributeJzodSchema?.extra?.defaultLabel}: {instance[entityAttribute[0]]}
                  </ListItem>
                );
              }
              // if (entityAttribute[1].definition == "string" && targetEntityUuid) {
              //   const targetEntity:MetaEntity| undefined = currentReportDeploymentSectionEntities.find(e=>e.uuid == targetEntityUuid) 
              //   return (
              //     <ListItem  disableGutters key={entityAttribute[0]}>
              //       {entityAttribute[0]}: 
              //       <EntityInstanceLink
              //         deploymentUuid={params.deploymentUuid as string}
              //         applicationSection={params.applicationSection as ApplicationSection}
              //         entityUuid={targetEntity?.uuid as string}
              //         instanceUuid={instance[entityAttribute[0]]}
              //         label={instance[entityAttribute[0]]}
              //         key={instance[entityAttribute[0]]}
              //       />
              //     </ListItem>
              //   )
              // } else {
              //   return <></>
              // }
            }
            default: {
              return (
                <ListItem disableGutters key={entityAttribute[0]}>
                  {entityAttribute[0]}: {instance[entityAttribute[0]]}
                </ListItem>
              )
              break;
            }
          }
        }
      )
    }
    </List>
  )
7
}
