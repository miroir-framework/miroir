// import { List, ListItem } from "@mui/material";
// import { useMemo } from "react";

// import {
//   ApplicationSection,
//   Entity,
//   MlElement,
//   MlObject,
//   MlRecord,
//   LoggerInterface,
//   MiroirLoggerFactory,
//   Uuid
// } from "miroir-core";

// import { packageName } from "../../../constants.js";
// import { JzodEnumSchemaToJzodElementResolver } from "../../JzodTools.js";
// import { useMiroirContextService } from "miroir-react";
// import { cleanLevel } from "../constants.js";
// import { getMDataGridColumnDefinition } from "../getColumnDefinitionsFromEntityAttributes.js";
// import { EntityInstanceLink } from "./EntityInstanceLink.js";

// let log: LoggerInterface = console as any as LoggerInterface;
// MiroirLoggerFactory.registerLoggerToStart(
//   MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementDisplay"), "UI",
// ).then((logger: LoggerInterface) => {log = logger});


// export interface JzodElementDisplayProps {
//   name: string;
//   path: string;
//   deploymentUuid?: Uuid,
//   applicationSection?: ApplicationSection,
//   entityUuid?: Uuid,
//   element: any,
//   elementJzodSchema: MlElement, // used only for displaying error messages
//   resolvedElementMlSchema: MlElement,
//   currentReportDeploymentSectionEntities?: Entity[],
//   currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver,
// }


// export function JzodElementDisplay(props: JzodElementDisplayProps){
//   const context = useMiroirContextService();

//   const targetMlSchema = // hack to display Jzod Schemas (DRAWBACK: makes of "type" a reserved attribute name, it has to be changed to something more specific)
//     props.resolvedElementMlSchema?.type == "union" && props.element?.type
//       ? props.currentEnumJzodSchemaResolver(props.element?.type,props.element?.definition)
//       : props.resolvedElementMlSchema;

//   const displayName = targetMlSchema?.tag?.value?.defaultLabel?targetMlSchema?.tag?.value?.defaultLabel:props.name;
//   log.info(
//     "JzodElementDisplay",
//     "props",
//     props,
//     "resolvedElementMlSchema",
//     props.resolvedElementMlSchema,
//   )
//   // log.info(
//   //   "~~~~~~~~~~~~~~~~~~~~~~~~~~~~ path",
//   //   props.path,
//   //   "props.elementJzodSchema",
//   //   props.elementJzodSchema,
//   //   "props.resolvedElementMlSchema",
//   //   props.resolvedElementMlSchema,
//   //   "targetMlSchema",
//   //   targetMlSchema,
//   //   "props.element",
//   //   props.element,
//   //   "miroirModel",
//   //   miroirModel
//   // );

//   switch (props.resolvedElementMlSchema.type) {
//     case "array": {
//       const columnDefs: any[] = [
//         getMDataGridColumnDefinition(
//           props.deploymentUuid??"",
//           props.name,
//           props.resolvedElementMlSchema.definition
//         ),
//       ];
//       log.info("JzodElementDisplay array","targetMlSchema",targetMlSchema,"columnDefs",columnDefs,"props.element",props.element);
      
//       return (
//         <>
//         array!
//         </>
//       )
//       break;
//     }
//     case "record": {
//       return (
//         <div>
//           {
//             typeof props.element == "object" && props.element != null?(
//               <>
//                 {
//                   Object.entries(props.element).map(
//                     (attribute,index) => {
//                       return (
//                           <div key={index}>
//                           <JzodElementDisplay
//                             name={attribute[0]}
//                             path={props.path+'.'+attribute[0]}
//                             applicationSection={props.applicationSection}
//                             deploymentUuid={props.deploymentUuid}
//                             elementJzodSchema={(props.resolvedElementMlSchema as MlRecord).definition}
//                             entityUuid={props.entityUuid}
//                             currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
//                             resolvedElementMlSchema={(props.resolvedElementMlSchema as MlRecord).definition}
//                             element={attribute[1]}
//                             currentReportDeploymentSectionEntities={props.currentReportDeploymentSectionEntities}
//                           ></JzodElementDisplay>
//                         </div>
//                       )
//                     }
//                   )
//                 }
//             </>
//             ): <div>
//               <table>
//               <tbody>
//                 <tr>
//                   <td>
//                     path 
//                   </td>
//                   <td>
//                     {props.path}
//                   </td>
//                 </tr>
//                 <tr>
//                   <td>
//                     declared type 
//                   </td>
//                   <td>
//                     {JSON.stringify(props.elementJzodSchema)}
//                   </td>
//                 </tr>
//                 <tr>
//                   <td>
//                     does not match value
//                   </td>
//                   <td>
//                     {JSON.stringify(props.element)}
//                   </td>
//                 </tr>
//               </tbody>
//               </table>
//               </div>
//           }
//         </div>
//       )
//     }
//     case "object": {
//       return (
//         <div>
//           {
//             typeof props.element == "object" && props.element != null?(
//               <div>
//               {props.name}: {"{"}
//               <List sx={{paddingTop: 0, paddingBottom: 0}}>
//                 {
//                   Object.entries(props.element).map(
//                     (attribute) => {
//                       return (
//                         <ListItem key={attribute[0]} sx={{paddingTop: 0, paddingBottom: 0}}>
//                           <JzodElementDisplay
//                             path={props.path + '.' + attribute[0]}
//                             applicationSection={props.applicationSection}
//                             deploymentUuid={props.deploymentUuid}
//                             elementJzodSchema={(props.resolvedElementMlSchema as MlObject)?.definition[attribute[0]]}
//                             entityUuid={props.entityUuid}
//                             // rootMlSchema={props.rootMlSchema}
//                             currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
//                             resolvedElementMlSchema={(props.resolvedElementMlSchema as MlObject).definition[attribute[0]]}
//                             element={attribute[1]}
//                             name={attribute[0]}
//                             currentReportDeploymentSectionEntities={props.currentReportDeploymentSectionEntities}
//                           ></JzodElementDisplay>
//                         </ListItem>
//                       )
//                     }
//                   )
//                 }
//               </List>
//               {"}"}
//               </div>
//             ): <div>
//               <table>
//                 <tbody>
//                   <tr>
//                     <td>
//                       path 
//                     </td>
//                     <td>
//                       {props.path}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>
//                     declared type 
//                     </td>
//                     <td>
//                     {JSON.stringify(props.elementJzodSchema)}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>
//                       does not match value
//                     </td>
//                     <td>
//                       {JSON.stringify(props.element)}
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           }
//           {/* {currentAttributeJzodSchema?.tag?.defaultLabel}: {instance[entityAttribute[0]]} */}
//         </div>
//       )
//     }
//     case "uuid": 
//     case "number": 
//     case "date": 
//     case "string": {
//       const targetEntityUuid = targetMlSchema.tag?.value?.foreignKeyParams?.targetEntity
//       if (
//         context.applicationSection &&
//         targetMlSchema.type == "uuid" &&
//         targetMlSchema?.tag?.value?.foreignKeyParams?.targetEntity &&
//         targetEntityUuid
//       ) {
//         const targetEntity: Entity | undefined = props.currentReportDeploymentSectionEntities?.find(
//           (e) => e.uuid == targetEntityUuid
//         );
//         return (
//           <div>
//             {displayName}:
//             <EntityInstanceLink
//               deploymentUuid={context.deploymentUuid}
//               applicationSection={context.applicationSection}
//               entityUuid={targetMlSchema?.tag?.value?.foreignKeyParams?.targetEntity}
//               instanceUuid={props.element}
//               key={props.name}
//             />
//           </div>
//         );
//       } else {
//         return (
//           <div>
//             {displayName}: {props.element}
//           </div>
//         );
//       }
//     }
//     case "enum": 
//     case "literal": {
//       return (
//         <div>
//           {displayName}: {props.element}
//         </div>
//       );
//     }
//     default: {
//         return (
//             <div>
//               {"JzodElementDisplay"} {"instance default"}: {displayName} {targetMlSchema?.type}
//             </div>
//         )
//         break;
//     }
//   }
// }
