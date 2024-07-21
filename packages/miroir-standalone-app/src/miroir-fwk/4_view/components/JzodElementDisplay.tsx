import { List, ListItem } from "@mui/material";
import { useMemo } from "react";

import {
  ApplicationSection,
  Entity,
  JzodElement,
  JzodObject,
  JzodRecord,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  getLoggerName
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { JzodEnumSchemaToJzodElementResolver } from "../../JzodTools.js";
import { EntityInstanceLink } from "./EntityInstanceLink.js";
import { useMiroirContextService } from "../MiroirContextReactProvider.js";
import { cleanLevel } from "../constants.js";
import { getColumnDefinitionsFromEntityDefinitionAttribute } from "../getColumnDefinitionsFromEntityAttributes.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"JzodElementDisplay");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export interface JzodElementDisplayProps {
  name: string;
  path: string;
  rootJzodSchema: JzodObject;
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  // instanceUuid?: Uuid,
  element: any,
  elementJzodSchema: JzodElement,
  resolvedElementJzodSchema: JzodElement,
  // currentReportDeploymentSectionEntities?: MetaEntity[],
  currentReportDeploymentSectionEntities?: Entity[],
  currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver,
}


export function JzodElementDisplay(props: JzodElementDisplayProps){
  const context = useMiroirContextService();

  const targetJzodSchema = // hack to display Jzod Schemas (DRAWBACK: makes of "type" a reserved attribute name, it has to be changed to something more specific)
    props.resolvedElementJzodSchema?.type == "union" && props.element?.type
      // ? props.currentEnumJzodSchemaResolver[props.element?.type]
      ? props.currentEnumJzodSchemaResolver(props.element?.type,props.element?.definition)
      : props.resolvedElementJzodSchema;

  const displayName = targetJzodSchema?.tag?.value?.defaultLabel?targetJzodSchema?.tag?.value?.defaultLabel:props.name;
  const styles = useMemo(
    () => ({
      width: "50vw",
      // height: "22vw",
    }),
    []
  );
  // log.info(
  //   "~~~~~~~~~~~~~~~~~~~~~~~~~~~~ path",
  //   props.path,
  //   "props.elementJzodSchema",
  //   props.elementJzodSchema,
  //   "props.resolvedElementJzodSchema",
  //   props.resolvedElementJzodSchema,
  //   "targetJzodSchema",
  //   targetJzodSchema,
  //   "props.element",
  //   props.element,
  //   "miroirModel",
  //   miroirModel
  // );

  switch (props.resolvedElementJzodSchema.type) {
    case "array": {
      const columnDefs:any[]=[getColumnDefinitionsFromEntityDefinitionAttribute(props.name,props.resolvedElementJzodSchema.definition)];
      log.info("JzodElementDisplay array","targetJzodSchema",targetJzodSchema,"columnDefs",columnDefs,"props.element",props.element);
      
      return (
        <>
        array!
          {/* <MTableComponent
            type="JSON_ARRAY"
            styles={styles}
            columnDefs={{columnDefs:columnDefs}}
            rowData={props.element}
            displayTools={true}
          >
          </MTableComponent> */}
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
                            elementJzodSchema={(props.resolvedElementJzodSchema as JzodRecord).definition}
                            entityUuid={props.entityUuid}
                            // instanceUuid={props.instanceUuid}
                            rootJzodSchema={props.rootJzodSchema}
                            currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                            resolvedElementJzodSchema={(props.resolvedElementJzodSchema as JzodRecord).definition}
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
              <List sx={{paddingTop: 0, paddingBottom: 0}}>
                {
                  Object.entries(props.element).map(
                    (attribute) => {
                      return (
                        <ListItem key={attribute[0]} sx={{paddingTop: 0, paddingBottom: 0}}>
                          <JzodElementDisplay
                            path={props.path + '.' + attribute[0]}
                            applicationSection={props.applicationSection}
                            deploymentUuid={props.deploymentUuid}
                            elementJzodSchema={(props.resolvedElementJzodSchema as JzodObject)?.definition[attribute[0]]}
                            entityUuid={props.entityUuid}
                            rootJzodSchema={props.rootJzodSchema}
                            currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                            resolvedElementJzodSchema={(props.resolvedElementJzodSchema as JzodObject).definition[attribute[0]]}
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
          {/* {currentAttributeJzodSchema?.tag?.defaultLabel}: {instance[entityAttribute[0]]} */}
        </div>
      )
    }
    // case "simpleType": {
    //   const targetEntityUuid = targetJzodSchema.tag?.value?.targetEntity
    //   if (
    //     context.applicationSection &&
    //     targetJzodSchema.definition == "string" &&
    //     targetJzodSchema?.tag?.value?.targetEntity &&
    //     targetEntityUuid
    //   ) {
    //     const targetEntity: Entity | undefined = props.currentReportDeploymentSectionEntities?.find(
    //       (e) => e.uuid == targetEntityUuid
    //     );
    //     return (
    //       <div>
    //         {displayName}:
    //         <EntityInstanceLink
    //           deploymentUuid={
    //             context.deploymentUuid
    //             // targetJzodSchema.tag?.targetEntityApplication == "metaModel"
    //             //   ? adminConfigurationDeploymentMiroir.uuid
    //             //   : props.deploymentUuid
    //           }
    //           applicationSection={context.applicationSection}
    //           entityUuid={targetJzodSchema?.tag?.value?.targetEntity}
    //           instanceUuid={props.element}
    //           key={props.name}
    //         />
    //       </div>
    //     );
    //   } else {
    //     return (
    //       <div>
    //         {displayName}: {props.element}
    //       </div>
    //     );
    //   }
    // }
    case "uuid": 
    case "number": 
    case "date": 
    case "string": {
      const targetEntityUuid = targetJzodSchema.tag?.value?.targetEntity
      if (
        context.applicationSection &&
        targetJzodSchema.type == "uuid" &&
        targetJzodSchema?.tag?.value?.targetEntity &&
        targetEntityUuid
      ) {
        const targetEntity: Entity | undefined = props.currentReportDeploymentSectionEntities?.find(
          (e) => e.uuid == targetEntityUuid
        );
        return (
          <div>
            {displayName}:
            <EntityInstanceLink
              deploymentUuid={
                context.deploymentUuid
                // targetJzodSchema.tag?.targetEntityApplication == "metaModel"
                //   ? adminConfigurationDeploymentMiroir.uuid
                //   : props.deploymentUuid
              }
              applicationSection={context.applicationSection}
              entityUuid={targetJzodSchema?.tag?.value?.targetEntity}
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
              {"JzodElementDisplay"} {"instance default"}: {displayName} {targetJzodSchema?.type}
            </div>
        )
        break;
    }
  }
}
