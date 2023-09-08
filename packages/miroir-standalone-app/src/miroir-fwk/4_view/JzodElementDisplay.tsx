import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import { List, ListItem } from "@mui/material";
import { ApplicationSection, EntityInstancesUuidIndex, MetaEntity, Uuid, applicationDeploymentMiroir } from "miroir-core";
import { useMemo } from "react";
import { EntityInstanceLink } from "./EntityInstanceLink";
import { MTableComponent } from "./MTableComponent";
import { useCurrentModel, useEntityInstanceUuidIndexFromLocalCache } from "./ReduxHooks";
import { getColumnDefinitionsFromEntityDefinitionJzodElemenSchema } from "./getColumnDefinitionsFromEntityAttributes";
import { JzodElementRecord, JzodEnumSchemaToJzodElementResolver, resolveJzodSchemaReference } from "../JzodTools";

export interface JzodObjectDisplayProps {
  // label: string;
  name: string;
  path: string;
  rootJzodSchema: JzodObject;
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
  element: any,
  elementJzodSchema?: JzodElement,
  currentReportDeploymentSectionEntities?: MetaEntity[],
  currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver,
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
  console.log("JzodElementDisplay path",props.path,"props.elementJzodSchema",props.elementJzodSchema,"resolvedJzodSchema",resolvedJzodSchema,"targetJzodSchema",targetJzodSchema,"props.element",props.element,"miroirModel",miroirModel);

  switch (targetJzodSchema?.type) {
    case "array": {
      const columnDefs:any[]=[getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(props.name,targetJzodSchema.definition)];
      console.log("JzodElementDisplay array","targetJzodSchema",targetJzodSchema,"columnDefs",columnDefs,"props.element",props.element);
      
      return (
        <>
          {/* <List sx={{ pt: 0}}> */}
            {/* <ListItem disableGutters key={props.name}> */}
              <MTableComponent
                type="JSON_ARRAY"
                styles={styles}
                // columnDefs={{columnDefs:columnDefs}}
                columnDefs={{columnDefs:columnDefs}}
                rowData={props.element}
                displayTools={true}
              >
              </MTableComponent>
          {/* </ListItem> */}
        {/* </List> */}
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
                {/* <div>
                  <table>
                    <tbody>
                      <tr>
                        <td>
                          record path {props.path}
                        </td>
                        <td>
                          element {JSON.stringify(props.element)}
                        </td>
                        <td>
                          jzodSchema {JSON.stringify(targetJzodSchema)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div> */}
                {
                  Object.entries(props.element).map(
                    (attribute,index) => {
                      {/* <ListItem key={index}> */}
                      return (
                          <div key={index}>
                            {/* {JSON.stringify(attribute[0])}
                            {JSON.stringify(targetJzodSchema)} */}
                          {/* {attribute[0]}:{"{"} */}
                          <JzodObjectDisplay
                            name={attribute[0]}
                            path={props.path+'.'+attribute[0]}
                            applicationSection={props.applicationSection}
                            deploymentUuid={props.deploymentUuid}
                            // elementJzodSchema={(props.elementJzodSchema as JzodObject)?.definition[attribute[0]]}
                            elementJzodSchema={targetJzodSchema.definition}
                            // elementJzodSchema={{type:"simpleType",definition:"string"}}
                            entityUuid={props.entityUuid}
                            instanceUuid={props.instanceUuid}
                            rootJzodSchema={props.rootJzodSchema}
                            currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                            // element={instance[attribute[0]]}
                            element={attribute[1]}
                            currentReportDeploymentSectionEntities={props.currentReportDeploymentSectionEntities}
                          ></JzodObjectDisplay>
                        {/* </ListItem> */}
                        {/* {"}"} */}
                        </div>
                      )
                    }
                  )
                }
              {/* </List> */}
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
          {/* {currentAttributeJzodSchema?.extra?.defaultLabel}: {instance[entityAttribute[0]]} */}
        </div>
      )
    }
    case "object": {
      return (
        <div>
          {/* instance object: {props.name} {JSON.stringify(instance)} */}
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
                          {/* {attribute[0]}: */}
                          <JzodObjectDisplay
                            path={props.path+'.'+attribute[0]}
                            applicationSection={props.applicationSection}
                            deploymentUuid={props.deploymentUuid}
                            // elementJzodSchema={(props.elementJzodSchema as JzodObject)?.definition[attribute[0]]}
                            elementJzodSchema={(targetJzodSchema as JzodObject)?.definition[attribute[0]]}
                            entityUuid={props.entityUuid}
                            instanceUuid={props.instanceUuid}
                            rootJzodSchema={props.rootJzodSchema}
                            currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                            // element={instance[attribute[0]]}
                            element={attribute[1]}
                            name={attribute[0]}
                            currentReportDeploymentSectionEntities={props.currentReportDeploymentSectionEntities}
                          ></JzodObjectDisplay>
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
        // props.elementJzodSchema.definition == "string" &&
        targetJzodSchema.definition == "string" &&
        targetEntityUuid
      ) {
        const targetEntity: MetaEntity | undefined = props.currentReportDeploymentSectionEntities?.find(
          (e) => e.uuid == targetEntityUuid
        );
        // const targetEntity:MetaEntity| undefined = currentReportDeploymentSectionEntities.find(e=>e.uuid == targetEntityUuid) 
        return (
          <div>
            {/* simpleType link element {JSON.stringify(props.element)}:
            simpleType link schema {JSON.stringify(targetJzodSchema)}: */}
            {displayName}:
            <EntityInstanceLink
              deploymentUuid={targetJzodSchema.extra?.targetEntityApplication == "metaModel"?applicationDeploymentMiroir.uuid:props.deploymentUuid}
              applicationSection={targetJzodSchema.extra?.targetEntityApplicationSection == "model"?"model":"data"}
              entityUuid={targetJzodSchema?.extra?.targetEntity}
              // deploymentUuid={props.deploymentUuid as string}
              // applicationSection={props.applicationSection as ApplicationSection}
              // entityUuid={targetEntity?.uuid as string}
              instanceUuid={props.element}
              // label={props.element}
              key={props.name}
            />
          </div>
        );
      } else {
        return (
          <div>
            {/* {" simpleType else"}: {JSON.stringify(props.elementJzodSchema)} */}
            {/* {props.element.name} {props.elementJzodSchema?.extra?.defaultLabel}: target {targetEntityUuid} - {JSON.stringify(props.element)} */}
            {/* {props.elementJzodSchema?.extra?.defaultLabel}: {props.element} */}
            {displayName}: {props.element}
          </div>
        );
      }
    }
    case "enum": 
    case "literal": {
      return (
        <div>
          {/* {" simpleType else"}: {JSON.stringify(props.elementJzodSchema)} */}
          {/* {props.element.name} {props.elementJzodSchema?.extra?.defaultLabel}: target {targetEntityUuid} - {JSON.stringify(props.element)} */}
          {/* {props.elementJzodSchema?.extra?.defaultLabel}: {props.element} */}
          {displayName}: {props.element}
        </div>
      );
    }
    default: {
        return (
          // <ListItem disableGutters key={props.name}>
            <div>
              {""} {" instance default"}: {displayName} 
              {/* targetJzodSchema={JSON.stringify(targetJzodSchema)} */}
              {/* {currentAttributeJzodSchema?.extra?.defaultLabel}: {instance[entityAttribute[0]]} */}
            </div>
          // </ListItem>
        )
        break;
    }
  }
}
