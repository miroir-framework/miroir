import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import { List, ListItem } from "@mui/material";
import { ApplicationSection, EntityInstancesUuidIndex, MetaEntity, Uuid, applicationDeploymentMiroir } from "miroir-core";
import { useMemo } from "react";
import { EntityInstanceLink } from "./EntityInstanceLink";
import { MTableComponent } from "./MTableComponent";
import { useCurrentModel, useEntityInstanceUuidIndexFromLocalCache } from "./ReduxHooks";
import { getColumnDefinitionsFromEntityDefinitionJzodElemenSchema } from "./getColumnDefinitionsFromEntityAttributes";
import { JzodElementRecord, JzodEnumSchemaToJzodElementResolver, resolveJzodSchemaReference } from "../JzodTools";

export interface JzodElementDisplayProps {
  name: string;
  path: string;
  rootJzodSchema: JzodObject;
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  // instanceUuid?: Uuid,
  element: any,
  elementJzodSchema?: JzodElement,
  currentReportDeploymentSectionEntities?: MetaEntity[],
  currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver,
}


export function JzodElementDisplay(props: JzodElementDisplayProps){

  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      type: "DomainEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: props.deploymentUuid,
        applicationSection: props.applicationSection as ApplicationSection,
        entityUuid: props.entityUuid,
      }
    }
  );

  // const instance:any = instancesToDisplayUuidIndex && props.instanceUuid?instancesToDisplayUuidIndex[props.instanceUuid]:undefined;

  // const currentModel = useCurrentModel(props.deploymentUuid);
  const miroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const resolvedJzodSchema =
    props.elementJzodSchema?.type == "schemaReference"
      ? resolveJzodSchemaReference(props.elementJzodSchema, miroirModel, {} as JzodObject)
      : props.elementJzodSchema;

  const targetJzodSchema = // hack to display Jzod Schemas (DRAWBACK: makes of "type" a reserved attribute name, it has to be changed to something more specific)
    resolvedJzodSchema?.type == "union" && props.element?.type
      // ? props.currentEnumJzodSchemaResolver[props.element?.type]
      ? props.currentEnumJzodSchemaResolver(props.element?.type,props.element?.definition)
      : resolvedJzodSchema;

  const displayName = targetJzodSchema?.extra?.defaultLabel?targetJzodSchema?.extra?.defaultLabel:props.name;
  const styles = useMemo(
    () => ({
      width: "50vw",
      height: "22vw",
    }),
    []
  );
  console.log(
    "JzodElementDisplay path",
    props.path,
    "props.elementJzodSchema",
    props.elementJzodSchema,
    "resolvedJzodSchema",
    resolvedJzodSchema,
    "targetJzodSchema",
    targetJzodSchema,
    "props.element",
    props.element,
    "miroirModel",
    miroirModel
  );

  switch (targetJzodSchema?.type) {
    case "array": {
      const columnDefs:any[]=[getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(props.name,targetJzodSchema.definition)];
      console.log("JzodElementDisplay array","targetJzodSchema",targetJzodSchema,"columnDefs",columnDefs,"props.element",props.element);
      
      return (
        <>
          <MTableComponent
            type="JSON_ARRAY"
            styles={styles}
            columnDefs={{columnDefs:columnDefs}}
            rowData={props.element}
            displayTools={true}
          >
          </MTableComponent>
        </>
      )
      break;
    }
    case "record": {
      return (
        <div>
          {
            typeof props.element == "object" && props.element != null?(
              <>
                {
                  Object.entries(props.element).map(
                    (attribute,index) => {
                      return (
                          <div key={index}>
                          <JzodElementDisplay
                            name={attribute[0]}
                            path={props.path+'.'+attribute[0]}
                            applicationSection={props.applicationSection}
                            deploymentUuid={props.deploymentUuid}
                            elementJzodSchema={targetJzodSchema.definition}
                            entityUuid={props.entityUuid}
                            // instanceUuid={props.instanceUuid}
                            rootJzodSchema={props.rootJzodSchema}
                            currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                            element={attribute[1]}
                            currentReportDeploymentSectionEntities={props.currentReportDeploymentSectionEntities}
                          ></JzodElementDisplay>
                        </div>
                      )
                    }
                  )
                }
            </>
            ): <div>
              <table>
              <tbody>
                <tr>
                  <td>
                    path 
                  </td>
                  <td>
                    {props.path}
                  </td>
                </tr>
                <tr>
                  <td>
                    declared type 
                  </td>
                  <td>
                    {JSON.stringify(props.elementJzodSchema)}
                  </td>
                </tr>
                <tr>
                  <td>
                    does not match value
                  </td>
                  <td>
                    {JSON.stringify(props.element)}
                  </td>
                </tr>
              </tbody>
              </table>
              </div>
          }
        </div>
      )
    }
    case "object": {
      return (
        <div>
          {
            typeof props.element == "object" && props.element != null?(
              <div>
              {props.name}: {"{"}
              <List>
                {
                  Object.entries(props.element).map(
                    (attribute) => {
                      return (
                        <ListItem key={attribute[0]}>
                          <JzodElementDisplay
                            path={props.path + '.' + attribute[0]}
                            applicationSection={props.applicationSection}
                            deploymentUuid={props.deploymentUuid}
                            elementJzodSchema={(targetJzodSchema as JzodObject)?.definition[attribute[0]]}
                            entityUuid={props.entityUuid}
                            // instanceUuid={props.instanceUuid}
                            rootJzodSchema={props.rootJzodSchema}
                            currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                            element={attribute[1]}
                            name={attribute[0]}
                            currentReportDeploymentSectionEntities={props.currentReportDeploymentSectionEntities}
                          ></JzodElementDisplay>
                        </ListItem>
                      )
                    }
                  )
                }
              </List>
              {"}"}
              </div>
            ): <div>
              <table>
                <tbody>
                  <tr>
                    <td>
                      path 
                    </td>
                    <td>
                      {props.path}
                    </td>
                  </tr>
                  <tr>
                    <td>
                    declared type 
                    </td>
                    <td>
                    {JSON.stringify(props.elementJzodSchema)}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      does not match value
                    </td>
                    <td>
                      {JSON.stringify(props.element)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
          {/* {currentAttributeJzodSchema?.extra?.defaultLabel}: {instance[entityAttribute[0]]} */}
        </div>
      )
    }
    case "simpleType": {
      const targetEntityUuid = targetJzodSchema.extra?.targetEntity
      if (
        targetJzodSchema.definition == "string" &&
        targetEntityUuid
      ) {
        const targetEntity: MetaEntity | undefined = props.currentReportDeploymentSectionEntities?.find(
          (e) => e.uuid == targetEntityUuid
        );
        return (
          <div>
            {displayName}:
            <EntityInstanceLink
              deploymentUuid={targetJzodSchema.extra?.targetEntityApplication == "metaModel"?applicationDeploymentMiroir.uuid:props.deploymentUuid}
              applicationSection={targetJzodSchema.extra?.targetEntityApplicationSection == "model"?"model":"data"}
              entityUuid={targetJzodSchema?.extra?.targetEntity}
              instanceUuid={props.element}
              key={props.name}
            />
          </div>
        );
      } else {
        return (
          <div>
            {displayName}: {props.element}
          </div>
        );
      }
    }
    case "enum": 
    case "literal": {
      return (
        <div>
          {displayName}: {props.element}
        </div>
      );
    }
    default: {
        return (
            <div>
              {""} {" instance default"}: {displayName} 
            </div>
        )
        break;
    }
  }
}
