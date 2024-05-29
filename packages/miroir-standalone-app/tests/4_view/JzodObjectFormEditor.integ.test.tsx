import { act, getByText, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import React, { ChangeEvent, useState } from "react";

import { Formik } from "formik";


import {
  ApplicationSection,
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchema,
  JzodUnion,
  ResolvedJzodSchemaReturnType,
  ResolvedJzodSchemaReturnTypeOK,
  Uuid,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  circularReplacer,
  domainEndpointVersionV1,
  entityDefinitionApplication,
  entityDefinitionApplicationVersion,
  entityDefinitionBundleV1,
  entityDefinitionCommit,
  entityDefinitionDeployment,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionQueryVersionV1,
  entityDefinitionReport,
  getMiroirFundamentalJzodSchema,
  instanceEndpointVersionV1,
  jzodSchemajzodMiroirBootstrapSchema,
  localCacheEndpointVersionV1,
  miroirCoreStartup,
  modelEndpointV1,
  persistenceEndpointVersionV1,
  queryEndpointVersionV1,
  resolveReferencesForJzodSchemaAndValueObject,
  storeManagementEndpoint,
  undoRedoEndpointVersionV1
} from "miroir-core";

import {
  MiroirIntegrationTestEnvironment,
  loadTestConfigFiles,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeEach,
  miroirIntegrationTestEnvironmentFactory,
  renderWithProviders
} from "miroir-standalone-app/tests/utils/tests-utils";

import {
  JzodObjectEditor
} from "../../src/miroir-fwk/4_view/components/JzodObjectEditor";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { vitest } from "vitest";

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
// miroirPostgresStoreSectionStartup();


let testEnvironment:MiroirIntegrationTestEnvironment;

const miroirFundamentalJzodSchema: JzodSchema = getMiroirFundamentalJzodSchema(
  entityDefinitionBundleV1 as EntityDefinition,
  entityDefinitionCommit as EntityDefinition,
  modelEndpointV1,
  storeManagementEndpoint,
  instanceEndpointVersionV1,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  domainEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
  jzodSchemajzodMiroirBootstrapSchema as JzodSchema,
  entityDefinitionApplication as EntityDefinition,
  entityDefinitionApplicationVersion as EntityDefinition,
  entityDefinitionDeployment as EntityDefinition,
  entityDefinitionEntity as EntityDefinition,
  entityDefinitionEntityDefinition as EntityDefinition,
  entityDefinitionJzodSchema as EntityDefinition,
  entityDefinitionMenu  as EntityDefinition,
  entityDefinitionQueryVersionV1 as EntityDefinition,
  entityDefinitionReport as EntityDefinition,
  // jzodSchemajzodMiroirBootstrapSchema as any,
);


beforeAll(
  async () => {
    testEnvironment = await miroirIntegrationTestEnvironmentFactory(miroirConfig)
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(
      miroirConfig,
      testEnvironment.domainController, // {} as DomainController,
      testEnvironment.localMiroirPersistenceStoreController,
      testEnvironment.localAppPersistenceStoreController
    );
  }
)

afterAll(
  async () => {
    await miroirAfterAll(
      miroirConfig,
      testEnvironment.domainController,
      testEnvironment.localMiroirPersistenceStoreController,
      testEnvironment.localAppPersistenceStoreController,
      testEnvironment.localDataStoreServer
    );
  }
)

afterEach(
  async () => {
    await miroirAfterEach(
      miroirConfig,
      testEnvironment.domainController,
      testEnvironment.localMiroirPersistenceStoreController,
      testEnvironment.localAppPersistenceStoreController
    );
  }
)

export interface JsonElementEditorWrapperProps {
  // test-specific!
  initialValue: any,
  // copied from JzodElementEditor
  label?: string;
  name: string,
  listKey: string,
  rootLesslistKey: string,
  rootLesslistKeyArray: string[],
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
          <JzodObjectEditor
            forceTestingMode={true}
            name={props.name}
            label={props.label}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            foreignKeyObjects={props.foreignKeyObjects}
            unresolvedJzodSchema={props.unresolvedJzodSchema}
            unionInformation={props.unionInformation}
            rawJzodSchema={props?.rawJzodSchema}
            resolvedJzodSchema={props.resolvedJzodSchema}
            handleChange={handleChange1}
            formik={formik}
            formState={dialogOuterFormObject}
            setFormState={setdialogOuterFormObject}
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
//     const user = userEvent.setup()

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
//           rootLesslistKey={attributeName}
//           rootLesslistKeyArray={[attributeName]}
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
    // ###########################################################################################
    it(
      'edit simpleType string form',
      async () => {
        const listKey = "ROOT." + attributeName
        const label: string = 'simpleElementString';

        const jzodSchema:JzodElement = {type:"simpleType", definition:"string"};
        const initialValue: any = {[attributeName]: "initialValue1"};
        const elementRoleQueries: RoleQuery[] = [{ role: listKey, method: "findByRole"}]
        const expectedValue = "initialValue1";
        try {
          console.log('edit string attribute');
          const user = userEvent.setup()
      
      
          const {
            getByText,
            getByRole,
            getAllByRole,
            container
          } = renderWithProviders(
            <div>
              <JzodObjectFormEditorWrapper
                initialValue={initialValue}
                name={attributeName}
                listKey={listKey}
                rootLesslistKey={attributeName}
                rootLesslistKeyArray={[attributeName]}
                label={label}
                currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
                currentApplicationSection={"data"}
                rawJzodSchema={jzodSchema}
                resolvedJzodSchema={jzodSchema}
                foreignKeyObjects={{}}
              ></JzodObjectFormEditorWrapper>
            </div>,
            {store:testEnvironment.localCache.getInnerStore()}
          );
      
          let elements: Record<string, HTMLElement[]> = {}
          for (const query of elementRoleQueries) {
            try {
              const foundElements = await screen[query.method](query.role)
              elements[query.role] = Array.isArray(foundElements)?foundElements: [foundElements]
            } catch (error) {
              console.error("test", label, "could not fetch element with role", query, "error:", error);
            }
          }
          expect(elements[listKey].length).toEqual(1);
          const testResult = elements[listKey][0].getAttribute("value")
          expect(testResult).toEqual(expectedValue);
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ############################################################################################
    it(
      'edit plain enum',
      async () => {
        const label: string = 'simpleElementString';
        const listKey = "ROOT." + attributeName
        const jzodSchema:JzodElement = {type:"enum", definition:["value1", "value2", "value3" ] };
        const initialValue: any = {[attributeName]: "value1"};
        const elementRoleQueries: RoleQuery[] = [{ role: "option", method: "findAllByRole"}];
        const expectedValue = ["value1", "value2", "value3"];
        try {
          console.log('edit string attribute');
          const user = userEvent.setup()
      
          const {
            getByText,
            getByRole,
            getAllByRole,
            container
          } = renderWithProviders(
            <div>
              <JzodObjectFormEditorWrapper
                initialValue={initialValue}
                name={attributeName}
                listKey={listKey}
                rootLesslistKey={attributeName}
                rootLesslistKeyArray={[attributeName]}
                label={label}
                currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
                currentApplicationSection={"data"}
                rawJzodSchema={jzodSchema}
                resolvedJzodSchema={jzodSchema}
                foreignKeyObjects={{}}
              ></JzodObjectFormEditorWrapper>
            </div>,
            {store:testEnvironment.localCache.getInnerStore()}
          );
      
          const selectElement = await screen.findByRole("ROOT.try1")
          await act(()=>user.click(selectElement));
          await act(()=>user.keyboard('{ArrowDown}{Enter}'));
      
          let elements: Record<string, HTMLElement[]> = {}
          for (const query of elementRoleQueries) {
            try {
              const foundElements = await screen[query.method](query.role)
              elements[query.role] = foundElements
            } catch (error) {
              console.error("test", label, "could not fetch element with role", query, "error:", error);
            }
          }

          const testResult = elements.option.map(o => o.getAttribute("data-value"))
          expect(testResult).toEqual(expectedValue);
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      
      }
    )

    // ############################################################################################
    it(
      'edit discriminated union form',
      async () => {
        const listKey = "ROOT"
        const label: string = 'simpleElementString';
        const objectJzodSchema:JzodElement = {
          type:"union", 
          discriminator: "objectType",
          definition:[
            {
              type: "object",
              definition: {
                "objectType": {
                  type: "literal",
                  definition: "A"
                },
                payload: {
                  type: "simpleType",
                  definition: "string"
                }
              }
            },
            {
              type: "object",
              definition: {
                objectType: {
                  type: "literal",
                  definition: "B"
                },
                payload: {
                  type: "simpleType",
                  definition: "string"
                }
              }
            }
          ] 
        };
        const formJzodSchema: JzodElement = {
          type: "object",
          definition: {
            [attributeName]: objectJzodSchema
          }
        }
        const objectInitialValue: any = {objectType: "A", payload: "value1"};
        const formInitialValue: any = {[attributeName]: objectInitialValue};
        const elementRoleQueries: RoleQuery[] = [{ role: "option", method: "findAllByRole"}];
        const expectedValue = [ "A", "B" ];

        try {
          console.log('edit discriminated union', objectJzodSchema);
          const user = userEvent.setup()
      
          const resolvedSchemaReturn: ResolvedJzodSchemaReturnType = resolveReferencesForJzodSchemaAndValueObject(
            miroirFundamentalJzodSchema,
            formJzodSchema,
            formInitialValue,
            testEnvironment.localCache.currentModel(adminConfigurationDeploymentLibrary.uuid),
            testEnvironment.localCache.currentModel(adminConfigurationDeploymentMiroir.uuid),
          );

          expect(resolvedSchemaReturn.status).toEqual("ok")
          console.log("resolvedSchema", JSON.stringify(resolvedSchemaReturn, null, 2))

          const {
            getByText,
            getByRole,
            getAllByRole,
            container
          } = renderWithProviders(
            <div>
              <JzodObjectFormEditorWrapper
                initialValue={formInitialValue}
                name={attributeName}
                listKey={listKey}
                rootLesslistKey={""}
                rootLesslistKeyArray={[]}
                label={label}
                currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
                currentApplicationSection={"data"}
                rawJzodSchema={formJzodSchema}
                resolvedJzodSchema={(resolvedSchemaReturn as ResolvedJzodSchemaReturnTypeOK).element}
                foreignKeyObjects={{}}
              ></JzodObjectFormEditorWrapper>
            </div>,
            {store:testEnvironment.localCache.getInnerStore()}
          );
      
          const selectElement = await screen.findByRole("combobox")
          await act(()=>user.click(selectElement));
          await act(()=>user.keyboard('{ArrowDown}{Enter}'));
      
          console.log("found value", selectElement.textContent)
          expect(selectElement.textContent).toEqual("B");

          // displays the whole rendered html
          // await waitFor(() => {
          //   screen.getByText(new RegExp(/(received result)|(received error)/, "i"));
          // })
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
    //       const user = userEvent.setup()

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
    //       const user = userEvent.setup()
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
