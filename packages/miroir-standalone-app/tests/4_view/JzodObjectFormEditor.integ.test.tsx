import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { ChangeEvent, useEffect, useState } from "react";

import { Formik } from "formik";


import {
  ApplicationSection,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchema,
  JzodUnion,
  MiroirContext,
  ResolvedJzodSchemaReturnType,
  ResolvedJzodSchemaReturnTypeOK,
  Uuid,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  jzodTypeCheck,
  miroirCoreStartup,
  miroirFundamentalJzodSchemaUuid,
  resetAndInitApplicationDeployment
} from "miroir-core";

// import {
//   MiroirIntegrationTestEnvironment,
//   loadTestConfigFiles,
//   miroirIntegrationTestEnvironmentFactory,
//   renderWithProvidersWithContextProvider,
//   selfApplicationDeploymentConfigurations
// } from "miroir-standalone-app/tests/utils/tests-utils";

import {
  JzodElementEditor
} from "../../src/miroir-fwk/4_view/components/JzodElementEditor";

import { miroirFundamentalJzodSchema } from "miroir-core";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { MiroirIntegrationTestEnvironment, renderWithProvidersWithContextProvider, selfApplicationDeploymentConfigurations } from "../../src/miroir-fwk/4-tests/tests-utils";
import { useMiroirContextService } from "../../src/miroir-fwk/4_view/MiroirContextReactProvider";
import { loadTestConfigFiles } from "../utils/fileTools";

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);
const miroirContext = new MiroirContext(miroirConfig);

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
// miroirPostgresStoreSectionStartup();


let testEnvironment:MiroirIntegrationTestEnvironment | undefined = undefined;

const castMiroirFundamentalJzodSchema: JzodSchema = miroirFundamentalJzodSchema as JzodSchema;

console.log("@@@@@@@@@@@@@@@@@@ miroirFundamentalJzodSchema", miroirFundamentalJzodSchema);


beforeAll(
  async () => {
    // testEnvironment = await miroirIntegrationTestEnvironmentFactory(miroirConfig)
  }
)

beforeEach(
  async () => {
    if (!testEnvironment || (testEnvironment as any).domainController === undefined) {
      throw new Error("testEnvironment not initialized");
    }
    await resetAndInitApplicationDeployment((testEnvironment as any).domainController, selfApplicationDeploymentConfigurations);
    document.body.innerHTML = '';
  }
)

// afterAll(
//   async () => {
//     await deleteAndCloseApplicationDeployments(
//       miroirConfig,
//       testEnvironment.domainController,
//       testEnvironment.localMiroirPersistenceStoreController,
//       testEnvironment.localAppPersistenceStoreController,
//       testEnvironment.localDataStoreServer
//     );
//   }
// )

// afterEach(
//   async () => {
//     await resetApplicationDeployments(
//       miroirConfig,
//       testEnvironment.domainController,
//       testEnvironment.localMiroirPersistenceStoreController,
//       testEnvironment.localAppPersistenceStoreController
//     );
//   }
// )

export interface JsonElementEditorWrapperProps {
  // test-specific!
  initialValue: any,
  // copied from JzodElementEditor
  label?: string;
  name: string,
  listKey: string,
  rootLessListKey: string,
  rootLessListKeyArray: string[],
  indentLevel?:number,
  unresolvedJzodSchema?: JzodElement | undefined,
  unionInformation?: {
    jzodSchema: JzodUnion,
    discriminator: string,
    discriminatorValues: string[],
    subDiscriminator?: string,
    subDiscriminatorValues?: string[],
    setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
  } | undefined,
  rawJzodSchema: JzodElement | undefined,
  resolvedJzodSchema: JzodElement | undefined,
  foreignKeyObjects: Record<string,EntityInstancesUuidIndex>,
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection,
  // formik: any,
  // setFormState: React.Dispatch<React.SetStateAction<{
  //   [k: string]: any;
  // }>>,
  // formState: any,
}

// }
// ################################################################################################
const attributeName = "try1"
let testResult: any
// ################################################################################################
function JzodObjectFormEditorWrapper(props: JsonElementEditorWrapperProps) {
  const context = useMiroirContextService();

  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ context", context)
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ context.setMiroirFundamentalJzodSchema", miroirFundamentalJzodSchema)

  useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any)); // TODO: remove as any

  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ context.miroirFundamentalJzodSchema", context.miroirFundamentalJzodSchema)

  const [dialogOuterFormObject, setdialogOuterFormObject] = useState<any>(props.initialValue); // redundent with formHelperState?

  const handleChange1 = async (e: ChangeEvent<any>) => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ formik change", e.target.value)
    testResult = e.target.value;
  }
  
  return (
    <div>
      <Formik
        // initialValues={props.defaultFormValuesObject}
        enableReinitialize={true}
        initialValues={dialogOuterFormObject}
        onSubmit={async (e: ChangeEvent<any>) => {
          console.log("onSubmit formik", e);
        }}
        handleChange={handleChange1}
      >
      {
        (formik) => (
          <JzodElementEditor
            forceTestingMode={true}
            name={props.name}
            label={props.label}
            listKey={props.listKey}
            rootLessListKey={props.rootLessListKey}
            rootLessListKeyArray={props.rootLessListKeyArray}
            foreignKeyObjects={props.foreignKeyObjects}
            unresolvedJzodSchema={props.unresolvedJzodSchema}
            unionInformation={props.unionInformation}
            rawJzodSchema={props?.rawJzodSchema}
            resolvedElementJzodSchema={props.resolvedJzodSchema}
          />
        )
      }
      </Formik>
    {/* {
      result?<div>received result: {JSON.stringify(result)}</div>:<div>no result yet</div>
    } */}
    </div>
  )
}

export interface RoleQuery {
  role:string, method: string
}

// // ################################################################################################
// async function testFormEditor(
//   label: string,
//   jzodSchema:JzodElement,
//   initialValue: any,
//   testFunction: (user: UserEvent, element: Record<string,HTMLElement[]>) => Promise<void>,
//   elementRoleQueries: RoleQuery[],
//   // expectedValue: any
// ) {
//   try {
//     console.log('edit string attribute');
//     const user = (userEvent as any).setup()

//     const listKey = "ROOT." + attributeName

//     const {
//       getByText,
//       getByRole,
//       getAllByRole,
//       container
//     } = renderWithProviders(
//       <div>
//         <JzodObjectFormEditorWrapper
//           initialValue={initialValue}
//           name={attributeName}
//           listKey={listKey}
//           rootLessListKey={attributeName}
//           rootLessListKeyArray={[attributeName]}
//           label={label}
//           currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
//           currentApplicationSection={"data"}
//           rawJzodSchema={jzodSchema}
//           resolvedJzodSchema={jzodSchema}
//           foreignKeyObjects={{}}
//         ></JzodObjectFormEditorWrapper>
//       </div>,
//       {store:testEnvironment.localCache.getInnerStore()}
//     );

//     const selectElement = await screen.findByRole("ROOT.try1")
//     await act(()=>user.click(selectElement));
//     await act(()=>user.keyboard('{ArrowDown}{Enter}'));

//     // await waitFor(() => {
//     //   screen.getByRole("option");
//     // })


//     // const formInput1 = await screen.findByRole(listKey)
//     let elements: Record<string, HTMLElement[]> = {}
//     for (const query of elementRoleQueries) {
//       try {
//         // const formInput1 = await screen.findByRole(query)
//         // const foundElements = await screen[query.method](query.role)
//         const foundElements = await screen.findAllByRole(query.role)
//         elements[query.role] = foundElements
//       } catch (error) {
//         console.error("test", label, "could not fetch element with role", query, "error:", error);
//       }
//     }

//     await testFunction(user, elements);
//   } catch (error) {
//     console.error('error during test',expect.getState().currentTestName,error);
//     expect(false).toBeTruthy();
//   }
// }




// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'JzodObjectFormEditor',
  () => {
    // // ###########################################################################################
    // it('edit simpleType string form',
    //   async () => {
    //     const listKey = "ROOT." + attributeName
    //     const label: string = 'simpleElementString';

    //     const jzodSchema:JzodElement = {type:"simpleType", definition:"string"};
    //     const initialValue: any = {[attributeName]: "initialValue1"};
    //     const elementRoleQueries: RoleQuery[] = [{ role: listKey, method: "findByRole"}]
    //     const expectedValue = "initialValue1";
    //     try {
    //       console.log('edit string attribute');
    //       const user = (userEvent as any).setup()
      
      
    //       const {
    //         getByText,
    //         getByRole,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <div>
    //           <JzodObjectFormEditorWrapper
    //             initialValue={initialValue}
    //             name={attributeName}
    //             listKey={listKey}
    //             rootLessListKey={attributeName}
    //             rootLessListKeyArray={[attributeName]}
    //             label={label}
    //             currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //             currentApplicationSection={"data"}
    //             rawJzodSchema={jzodSchema}
    //             resolvedJzodSchema={jzodSchema}
    //             foreignKeyObjects={{}}
    //           ></JzodObjectFormEditorWrapper>
    //         </div>,
    //         {store:testEnvironment.localCache.getInnerStore()}
    //       );
      
    //       let elements: Record<string, HTMLElement[]> = {}
    //       for (const query of elementRoleQueries) {
    //         try {
    //           const foundElements = await screen[query.method](query.role)
    //           elements[query.role] = Array.isArray(foundElements)?foundElements: [foundElements]
    //         } catch (error) {
    //           console.error("test", label, "could not fetch element with role", query, "error:", error);
    //         }
    //       }
    //       expect(elements[listKey].length).toEqual(1);
    //       const testResult = elements[listKey][0].getAttribute("value")
    //       expect(testResult).toEqual(expectedValue);
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // // ############################################################################################
    // it('edit plain enum',
    //   async () => {
    //     const label: string = 'simpleElementString';
    //     const listKey = "ROOT." + attributeName
    //     const jzodSchema:JzodElement = {type:"enum", definition:["value1", "value2", "value3" ] };
    //     const initialValue: any = {[attributeName]: "value1"};
    //     const elementRoleQueries: RoleQuery[] = [{ role: "option", method: "findAllByRole"}];
    //     const expectedValue = ["value1", "value2", "value3"];
    //     try {
    //       console.log('edit string attribute');
    //       const user = (userEvent as any).setup()
      
    //       const {
    //         getByText,
    //         getByRole,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <div>
    //           <JzodObjectFormEditorWrapper
    //             initialValue={initialValue}
    //             name={attributeName}
    //             listKey={listKey}
    //             rootLessListKey={attributeName}
    //             rootLessListKeyArray={[attributeName]}
    //             label={label}
    //             currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //             currentApplicationSection={"data"}
    //             rawJzodSchema={jzodSchema}
    //             resolvedJzodSchema={jzodSchema}
    //             foreignKeyObjects={{}}
    //           ></JzodObjectFormEditorWrapper>
    //         </div>,
    //         {store:testEnvironment.localCache.getInnerStore()}
    //       );
      
    //       const selectElement = await screen.findByRole("ROOT.try1")
    //       await act(()=>user.click(selectElement));
    //       await act(()=>user.keyboard('{ArrowDown}{Enter}'));
      
    //       let elements: Record<string, HTMLElement[]> = {}
    //       for (const query of elementRoleQueries) {
    //         try {
    //           const foundElements = await screen[query.method](query.role)
    //           elements[query.role] = foundElements
    //         } catch (error) {
    //           console.error("test", label, "could not fetch element with role", query, "error:", error);
    //         }
    //       }

    //       const testResult = elements.option.map(o => o.getAttribute("data-value"))
    //       expect(testResult).toEqual(expectedValue);
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
      
    //   }
    // )

    // // ############################################################################################
    // it(
    //   'edit discriminated union form',
    //   async () => {
    //     const listKey = "ROOT"
    //     const label: string = 'simpleElementString';
    //     const objectJzodSchema:JzodElement = {
    //       type:"union", 
    //       discriminator: "objectType",
    //       definition:[
    //         {
    //           type: "object",
    //           definition: {
    //             "objectType": {
    //               type: "literal",
    //               definition: "A"
    //             },
    //             payload: {
    //               type: "simpleType",
    //               definition: "string"
    //             }
    //           }
    //         },
    //         {
    //           type: "object",
    //           definition: {
    //             objectType: {
    //               type: "literal",
    //               definition: "B"
    //             },
    //             payload: {
    //               type: "simpleType",
    //               definition: "string"
    //             }
    //           }
    //         }
    //       ] 
    //     };
    //     const formJzodSchema: JzodElement = {
    //       type: "object",
    //       definition: {
    //         [attributeName]: objectJzodSchema
    //       }
    //     }
    //     const objectInitialValue: any = {objectType: "A", payload: "value1"};
    //     const formInitialValue: any = {[attributeName]: objectInitialValue};
    //     const elementRoleQueries: RoleQuery[] = [{ role: "option", method: "findAllByRole"}];
    //     const expectedValue = [ "A", "B" ];

    //     try {
    //       console.log('edit discriminated union', objectJzodSchema);
    //       const user = (userEvent as any).setup()
      
    //       const resolvedSchemaReturn: ResolvedJzodSchemaReturnType = jzodTypeCheck(
      //         formJzodSchema,
      //         formInitialValue,
    // [], // currentValuePath
    // [], // currentTypePath
    //         miroirFundamentalJzodSchema,
    //         testEnvironment.localCache.currentModel(adminConfigurationDeploymentLibrary.uuid),
    //         testEnvironment.localCache.currentModel(adminConfigurationDeploymentMiroir.uuid),
    //       );

    //       expect(resolvedSchemaReturn.status).toEqual("ok")
    //       console.log("resolvedSchema", JSON.stringify(resolvedSchemaReturn, null, 2))

    //       const {
    //         getByText,
    //         getByRole,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <div>
    //           <JzodObjectFormEditorWrapper
    //             initialValue={formInitialValue}
    //             name={attributeName}
    //             listKey={listKey}
    //             rootLessListKey={""}
    //             rootLessListKeyArray={[]}
    //             label={label}
    //             currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //             currentApplicationSection={"data"}
    //             rawJzodSchema={formJzodSchema}
    //             resolvedJzodSchema={(resolvedSchemaReturn as ResolvedJzodSchemaReturnTypeOK).element}
    //             foreignKeyObjects={{}}
    //           ></JzodObjectFormEditorWrapper>
    //         </div>,
    //         {store:testEnvironment.localCache.getInnerStore()}
    //       );
      
    //       const selectElement = await screen.findByRole("combobox")
    //       await act(()=>user.click(selectElement));
    //       await act(()=>user.keyboard('{ArrowDown}{Enter}'));
      
    //       console.log("found value", selectElement.textContent)
    //       expect(selectElement.textContent).toEqual("B");

    //       // displays the whole rendered html
    //       // await waitFor(() => {
    //       //   screen.getByText(new RegExp(/(received result)|(received error)/, "i"));
    //       // })
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
      
    //   }
    // )

    // // ############################################################################################
    // it('edit sub-discriminated union form',
    //   async () => {
    //     const listKey = "ROOT"
    //     const label: string = 'simpleElementString';
    //     const objectJzodSchema:JzodElement = {
    //       type:"union", 
    //       discriminator: "objectType",
    //       subDiscriminator: "definition",
    //       definition:[
    //         {
    //           type: "object",
    //           definition: {
    //             "objectType": {
    //               type: "literal",
    //               definition: "A"
    //             },
    //             definition: {
    //               type: "literal",
    //               definition: "string"
    //             },
    //             payload: {
    //               type: "simpleType",
    //               definition: "string"
    //             }
    //           }
    //         },
    //         {
    //           type: "object",
    //           definition: {
    //             objectType: {
    //               type: "literal",
    //               definition: "A"
    //             },
    //             definition: {
    //               type: "literal",
    //               definition: "number"
    //             },
    //             payload: {
    //               type: "simpleType",
    //               definition: "number"
    //             }
    //           }
    //         }
    //       ] 
    //     };
    //     const formJzodSchema: JzodElement = {
    //       type: "object",
    //       definition: {
    //         [attributeName]: objectJzodSchema
    //       }
    //     }
    //     const objectInitialValue: any = {objectType: "A", definition: "string", payload: "value1"};
    //     const formInitialValue: any = {[attributeName]: objectInitialValue};
    //     const elementRoleQueries: RoleQuery[] = [{ role: "option", method: "findAllByRole"}];
    //     const expectedDiscriminatorValue = [ "A" ];
    //     const expectedSubdiscriminatorValue = [ "string", "number" ];

    //     try {
    //       console.log('edit subdiscriminated union', objectJzodSchema);
    //       const user = (userEvent as any).setup()
      
    //       const resolvedSchemaReturn: ResolvedJzodSchemaReturnType = jzodTypeCheck(
      //         formJzodSchema,
      //         formInitialValue,
    // [], // currentValuePath
    // [], // currentTypePath
    //         miroirFundamentalJzodSchema,
    //         testEnvironment.localCache.currentModel(adminConfigurationDeploymentLibrary.uuid),
    //         testEnvironment.localCache.currentModel(adminConfigurationDeploymentMiroir.uuid),
    //       );

    //       expect(resolvedSchemaReturn.status).toEqual("ok")
    //       console.log("resolvedSchema", JSON.stringify(resolvedSchemaReturn, null, 2))

    //       const {
    //         getByText,
    //         getByRole,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <div>
    //           <JzodObjectFormEditorWrapper
    //             initialValue={formInitialValue}
    //             name={attributeName}
    //             listKey={listKey}
    //             rootLessListKey={""}
    //             rootLessListKeyArray={[]}
    //             label={label}
    //             currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //             currentApplicationSection={"data"}
    //             rawJzodSchema={formJzodSchema}
    //             resolvedJzodSchema={(resolvedSchemaReturn as ResolvedJzodSchemaReturnTypeOK).element}
    //             foreignKeyObjects={{}}
    //           ></JzodObjectFormEditorWrapper>
    //         </div>,
    //         {store:testEnvironment.localCache.getInnerStore()}
    //       );
      
    //       const selectedElements = await screen.findAllByRole("combobox")
          
    //       // await act(()=>user.click(selectElement));
    //       // await act(()=>user.keyboard('{ArrowDown}{Enter}'));
      
    //       console.log("found elements", selectedElements.length)
    //       const subDiscriminatorElement = selectedElements.find(e=> e.getAttribute("id")?.match(/try1.definition/))
    //       expect(subDiscriminatorElement).toBeDefined;
    //       console.log("found subDiscriminatorElement", subDiscriminatorElement?.textContent)
    //       await act(()=>user.click(subDiscriminatorElement as HTMLElement));
    //       await act(()=>user.keyboard('{ArrowDown}{Enter}'));
    //       // console.log("found value", selectElement.textContent)

    //       expect(subDiscriminatorElement?.textContent).toEqual("number");

    //       // displays the whole rendered html
    //       // await waitFor(() => {
    //       //   screen.getByText(new RegExp(/(received result)|(received error)/, "i"));
    //       // })
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
      
    //   }
    // )

    // ############################################################################################
    it('edit simple Jzod Schema form',
      async () => {
        const listKey = "ROOT"
        const label: string = 'simpleElementString';
        // const objectJzodSchema:JzodElement = {
        //   "type": "simpleType",
        //   "definition": "string",
        //   "validations": [
        //     {
        //       "type": "uuid"
        //     }
        //   ],
        //   "extra": {
        //     "id": 1,
        //     "defaultLabel": "Uuid",
        //     "editable": false
        //   }
        // };
        const formJzodSchema: JzodElement = {
          type: "object",
          definition: {
            [attributeName]: {
              "type": "schemaReference",
              "definition": {
                "absolutePath": miroirFundamentalJzodSchemaUuid,
                // "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                "relativePath": "jzodElement"
              }
            }
          }
        }
        const objectInitialValue: any = {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          tag: { value: {
            id: 1,
            defaultLabel: "Uuid",
            editable: false,
          }},
        };
        const formInitialValue: any = {[attributeName]: objectInitialValue};
        const elementRoleQueries: RoleQuery[] = [{ role: "option", method: "findAllByRole"}];
        const expectedDiscriminatorValue = [ "A" ];
        const expectedSubdiscriminatorValue = [ "string", "number" ];

        if (!testEnvironment || !(testEnvironment as any).domainController) {
          throw new Error("testEnvironment not initialized");
        }

        try {
          console.log('formJzodSchema', formJzodSchema);
          const user = (userEvent as any).setup()
      
          await act(
            async () => {
              await (testEnvironment as any).domainController.handleAction({
                // actionType: "modelAction",
                actionType: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await (testEnvironment as any).domainController.handleAction({
                // actionType: "modelAction",
                actionType: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );

          const appModel = (testEnvironment as any).localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
          const miroirModel = (testEnvironment as any).localCache.currentModel(adminConfigurationDeploymentMiroir.uuid)
          console.log("miroirModel", miroirModel);
          const resolvedSchemaReturn: ResolvedJzodSchemaReturnType = jzodTypeCheck(
            formJzodSchema,
            formInitialValue,
            [], // currentValuePath
            [], // currentTypePath
            miroirFundamentalJzodSchema as any as JzodSchema,
            appModel,
            miroirModel,
            {}
            // testEnvironment.localCache.currentModel(adminConfigurationDeploymentMiroir.uuid),
          );

          expect(resolvedSchemaReturn.status).toEqual("ok")
          console.log("resolvedSchema", JSON.stringify(resolvedSchemaReturn, null, 2))

          const {
            getByText,
            getByRole,
            getAllByRole,
            container
          } = renderWithProvidersWithContextProvider(
            // <MiroirContextReactProvider miroirContext={miroirContext} domainController={testEnvironment.domainController}>
              <JzodObjectFormEditorWrapper
                initialValue={formInitialValue}
                name={attributeName}
                listKey={listKey}
                rootLessListKey={""}
                rootLessListKeyArray={[]}
                label={label}
                currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
                currentApplicationSection={"data"}
                rawJzodSchema={formJzodSchema}
                resolvedJzodSchema={(resolvedSchemaReturn as ResolvedJzodSchemaReturnTypeOK).element}
                foreignKeyObjects={{}}
              ></JzodObjectFormEditorWrapper>,
            // </MiroirContextReactProvider>,
            {
              store:testEnvironment.localCache.getInnerStore(),
              miroirContext,
              domainController: testEnvironment.domainController
            }
          );
      
          const selectedElements = await screen.findAllByRole("combobox")
          
          // console.log("found elements", selectedElements.length)
          // const subDiscriminatorElement = selectedElements.find(e=> e.getAttribute("id")?.match(/try1.definition/))
          // expect(subDiscriminatorElement).toBeDefined;
          // console.log("found subDiscriminatorElement", subDiscriminatorElement?.textContent)
          // await act(()=>user.click(subDiscriminatorElement as HTMLElement));
          // await act(()=>user.keyboard('{ArrowDown}{Enter}'));
          // // console.log("found value", selectElement.textContent)

          // expect(subDiscriminatorElement?.textContent).toEqual("number");

          // displays the whole rendered html
          await waitFor(() => {
            screen.getByText(new RegExp(/(received result)|(received error)/, "i"));
          })
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      
      }
    )



    // // ############################################################################################
    // it(
    //   'edit enum form',
    //   testFormEditor.bind(
    //     null,
    //     'simpleElementString', /** label */
    //     {type:"enum", definition:["value1", "value2", "value3" ] }, /** jzodSchema */
    //     {[attributeName]: "value1"},
    //     async (user:UserEvent, e: Record<string,HTMLElement[]>) => {
    //       // const expectedValue = "value1";
    //       const expectedValue = ["value1", "value2", "value3"];
    //       console.log("testFunction called for elements with roles", Object.keys(e))
    //       console.log("testFunction called for elements with role option", e.option.map(o => o.outerHTML))
    //       const testResult = e.option.map(o => o.getAttribute("data-value"))
    //       // console.log('passed element',e.outerHTML);
    //       // console.log('element value',e.getAttribute("value"));
    //       // console.log('onChange of formInput1',formInput1.onchange);
    //       // console.log('onChange of formInput2',formInput2.onchange);
          
    //       // await act(()=>user.click(e));
    //       // await act(()=>user.keyboard('{ArrowDown}{Enter}'));
    //       // await act(()=>user.type(formInput,'bbbbbbbbbbb'));

    //       // console.log('AFTER ACTION passed element',e.outerHTML);


    //       // console.log('found for ',e.outerHTML);
    //       // expect(sensing).toHaveBeenCalledTimes(1);
      
    //       // expect(formInput).toHaveProperty("value","b")
    //       // expect(screen.getByDisplayValue("modifiedValue") === formInput).toBeTruthy()
    //       console.log("###############################################################################", testResult)
    //       // await waitFor(() => {
    //       //   screen.getByText(new RegExp(/(received result)|(received error)/, "i"));
    //       // })


    //   // // await act(
    //       // //   async () =>
    //       //     await waitFor(() => {
    //       //       screen.getByText(new RegExp(/(received result)|(received error)/, "i"));
    //       //     })
    //       //     // .then(() => {
    //       //     //   // expect(screen.queryByText(new RegExp(`received result: {"${label}":"abcdef"}`, "i"))).toBeFalsy(); // Book entity
    //       //     //   expect(screen.queryByText(new RegExp(/received result/, "i"))).toBeNull(); // Book entity
    //       //     //   expect(screen.queryByText(new RegExp(/received error: String must contain at least 7 character\(s\)/, "i"))).toBeTruthy(); // Book entity
    //       //     // })
    //       // // );

    //       // expect(expectedValue == testResult).toBeTruthy()
    //       expect(testResult).toEqual(expectedValue);
    //     },
    //     [{ role: "option", method: "findAllByRole"}],
    //     // "initialValue1a", /** expected value */
    //     // ["value1", "value2", "value3"], /** expected value */
    //   )
    // )


    // // ###########################################################################################
    // it(
    //   'edit simpleType string form with validation',
    //   async () => {
    //     try {
    //       console.log('edit simpleType string form with validation');
    //       const user = (userEvent as any).setup()

    //       const label = 'simpleElementString' 
    //       const {
    //         getByText,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <JzodObjectFormEditorWrapper
    //           label={label}
    //           initialValuesObject={""}
    //           showButton={true}
    //           currentDeploymentUuid={undefined}
    //           currentApplicationSection="data"
    //           elementJzodSchema={{type:"simpleType", definition:"string", validations:[{type:"min",parameter:7}]}}
    //           rootJzodSchema={{} as JzodObject}
    //           // getData={()=>undefined}
    //           // jzodSchema={{type:"simpleType", definition:"string"}}
    //           // onSubmit={(data:any,event:any,error:any)=>{console.log("onSubmit called", data, event,error)}}
    //         ></JzodObjectFormEditorWrapper>,
    //         {store:testEnvironment.localCache.getInnerStore()}
    //       );

    //       // ##########################################################################################################
    //       const formInput = screen.getByRole('textbox', {name:""})
    //       await act(async ()=>user.click(formInput));
    //       await act(async ()=>user.keyboard('abcdef'));

    //       try {
    //       await act(async ()=>user.click(screen.getByRole('button', {name:"Submit"})));
    //       } catch (error) {
    //         console.error('caught expected validation error during test',expect.getState().currentTestName,error);
    //       }

    //       await act(
    //         async () =>
    //           await waitFor(() => {
    //             getByText(new RegExp(/(received result)|(received error)/, "i"));
    //           }).then(() => {
    //             // expect(screen.queryByText(new RegExp(`received result: {"${label}":"abcdef"}`, "i"))).toBeFalsy(); // Book entity
    //             expect(screen.queryByText(new RegExp(/received result/, "i"))).toBeNull(); // Book entity
    //             expect(screen.queryByText(new RegExp(/received error: String must contain at least 7 character\(s\)/, "i"))).toBeTruthy(); // Book entity
    //           })
    //       );

    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // // ###########################################################################################
    // it(
    //   'combobox select from list',
    //   async () => {
    //     try {
    //       console.log(expect.getState().currentTestName);
    //       const user = (userEvent as any).setup()
    //       await testEnvironment.localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
    //       await testEnvironment.localAppPersistenceStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('model', reportBookList as EntityInstance);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('data', author1 as EntityInstance);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('data', author2 as EntityInstance);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('data', author3 as EntityInstance);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('data', book1 as EntityInstance);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('data', book2 as EntityInstance);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('data', book3 as EntityInstance);
    //       await testEnvironment.localAppPersistenceStoreController?.upsertInstance('data', book4 as EntityInstance);


    //       const label = 'simpleElementString' 
    //       const {
    //         getByText,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <JzodObjectFormEditorWrapper
    //           label={label}
    //           initialValuesObject={""}
    //           showButton={true}
    //           currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //           currentApplicationSection="data"
    //           elementJzodSchema={{type:"simpleType", definition:"uuid", extra:{targetEntity:entityAuthor.uuid}}}
    //           rootJzodSchema={{} as JzodObject}
    //           // jzodSchema={{type:"simpleType", definition:"string"}}
    //           // onSubmit={(data:any,event:any,error:any)=>{console.log("onSubmit called", data, event,error)}}
    //         ></JzodObjectFormEditorWrapper>,
    //         {store:testEnvironment.localCache.getInnerStore()}
    //       );
  
    //       await act(
    //         async () => {
    //           await testEnvironment.domainController.handleAction({actionType:"DomainTransactionalInstanceAction",actionName: "rollback"});
    //           await testEnvironment.domainController.handleAction({actionType:"DomainTransactionalInstanceAction",actionName: "rollback"});
    //         }
    //       );

    //       // ##########################################################################################################
    //       const formInput = screen.getByRole('combobox', {name:""})
    //       await act(async ()=>user.click(formInput));
    //       await act(async ()=>user.keyboard('{ArrowDown}'));
    //       await act(async ()=>user.keyboard('{Enter}'));

    //       try {
    //       await act(async ()=>user.click(screen.getByRole('button', {name:"Submit"})));
    //       } catch (error) {
    //         console.error('caught expected validation error during test',expect.getState().currentTestName,error);
    //       }

    //       await act(
    //         async () =>
    //           await waitFor(() => {
    //             getByText(new RegExp(/(received result)|(received error)/, "i"));
    //           }).then(() => {
    //             expect(screen.queryByText(new RegExp(`received result: { value: 'ce7b601d-be5f-4bc6-a5af-14091594046a', label: 'Paul Veyne' }`, "i"))).toBeFalsy(); // Book entity
    //             // expect(screen.queryByText(new RegExp(/received result/, "i"))).toBeNull(); // Book entity
    //             // expect(screen.queryByText(new RegExp(/received error: String must contain at least 7 character\(s\)/, "i"))).toBeTruthy(); // Book entity
    //             expect(screen.queryByText(new RegExp(/received error/, "i"))).toBeNull(); // Book entity
    //           })
    //       );

    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )
  }
)
