import { describe, expect, it, vi } from "vitest";
import { Provider } from 'react-redux';
// import { ThemeProvider } from '@emotion/react';
import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from "@testing-library/react";
import { Formik } from "formik";

import { JzodEnum } from "miroir-core";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";
import { emptyList, emptyObject, emptyString } from "../../src/miroir-fwk/4_view/routes/Tools";
import { MiroirContextReactProvider, useMiroirContextService } from '../../src/miroir-fwk/4_view/MiroirContextReactProvider';
import { MiroirContext } from 'miroir-core';
import { MiroirConfigClient } from 'miroir-core';
import { DomainControllerInterface } from 'miroir-core';
import { themeParams } from "../../src";
import { LocalCache, PersistenceReduxSaga } from "miroir-localcache-redux";
import { ConfigurationService } from "miroir-core";
import { PersistenceStoreControllerManager } from "miroir-core";
import { LocalCacheInterface } from "miroir-core";
import { miroirFundamentalJzodSchema } from "miroir-core";
import { JzodSchema } from "miroir-core";
import { ResolvedJzodSchemaReturnType } from "miroir-core";
import { MetaModel } from "miroir-core";
import { useCurrentModel } from "../../src/miroir-fwk/4_view/ReduxHooks";
import { adminConfigurationDeploymentMiroir } from "miroir-core";
import { jzodTypeCheck } from "miroir-core";
import { JzodElement } from "miroir-core";
import { JzodUnion } from "miroir-core";
import { EntityInstancesUuidIndex } from "miroir-core";
import { Uuid } from "miroir-core";
import { ApplicationSection } from "miroir-core";


export interface JzodElementEditorProps_Test {
  // forceTestingMode?: boolean;
  label?: string;
  name: string;
  listKey: string;
  // rootLesslistKey: string;
  // rootLesslistKeyArray: string[];
  // indentLevel?: number;
  initialFormState: any;
  rawJzodSchema: JzodElement | undefined;
  // resolvedElementJzodSchema: JzodElement | undefined;
  // unresolvedJzodSchema?: JzodElement | undefined;
  // paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  // unionInformation?:
  //   | {
  //       jzodSchema: JzodUnion;
  //       discriminator: string;
  //       discriminatorValues: string[];
  //       // subDiscriminator?: string,
  //       // subDiscriminatorValues?: string[],
  //       setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
  //     }
  //   | undefined;
  // foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
  // currentDeploymentUuid?: Uuid;
  // currentApplicationSection?: ApplicationSection;
  // formik: any;
  // handleChange: (e: ChangeEvent<any>) => Promise<void>;
  // setFormState: React.Dispatch<
  //   React.SetStateAction<{
  //     [k: string]: any;
  //   }>
  // >;
  // parentObjectSetItemsOrder?: React.Dispatch<React.SetStateAction<any[]>>;
  // parentObjectItemsOrder?: any[];
}

// ################################################################################################
const pageLabel = "JzodElementEditor.test";

let currentMiroirConfig: MiroirConfigClient = undefined as any; // Replace with actual MiroirConfigClient if available
let miroirContext : MiroirContext = undefined as any; // Will be defined later
let theme = createTheme(themeParams);

// let LocalJzodElementEditor: React.FC<any> = undefined as any; // Will be defined later

let localCache: LocalCacheInterface = undefined as any; // Will be defined later
let persistenceSaga: PersistenceReduxSaga

const listKey = "ROOT.testName";
const name = "testName";
const label = "Test Label";

const handleAction = vi.fn();

let Wrapper: React.FC<any>;

beforeAll(() => {
  // miroirContext = new MiroirContext(currentMiroirConfig);
  // // miroirContext.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema);
  // ConfigurationService.registerTestImplementation({expect: expect as any});

  
  
  // persistenceSaga = new PersistenceReduxSaga({
  //   persistenceStoreAccessMode: "remote",
  //   localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
  //     ConfigurationService.adminStoreFactoryRegister,
  //     ConfigurationService.StoreSectionFactoryRegister,
  //   ),
  //   // remotePersistenceStoreRestClient: persistenceClientAndRestClient,
  //   remotePersistenceStoreRestClient: undefined as any,
  // });
    
  // localCache = new LocalCache(persistenceSaga);

    miroirContext = new MiroirContext(currentMiroirConfig);
  // miroirContext.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema);
  ConfigurationService.registerTestImplementation({expect: expect as any});
  
  persistenceSaga = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister,
    ),
    // remotePersistenceStoreRestClient: persistenceClientAndRestClient,
    remotePersistenceStoreRestClient: undefined as any,
  });
    
  localCache = new LocalCache(persistenceSaga);

    // ###############################################
  // LocalJzodElementEditor = (props: {
  Wrapper  = (props: {
    children?: React.ReactNode;
  }) => {
    const domainController: DomainControllerInterface = {
      handleAction,
      // add other methods if needed
    } as any;

    return (
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <Provider store={localCache.getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainController}
            >
              {props.children}
            </MiroirContextReactProvider>
          </Provider>
        </StyledEngineProvider>
      </ThemeProvider>
    );
  }

});


// const onChange = vi.fn();


describe("JzodElementEditor", () => {

  const LocalJzodElementEditor: React.FC<JzodElementEditorProps_Test>  = (props: JzodElementEditorProps_Test) => {
    // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

    const context = useMiroirContextService();

    const currentModel: MetaModel = useCurrentModel(
      context.applicationSection == "data"
        ? context.deploymentUuid
        : adminConfigurationDeploymentMiroir.uuid
    );

    const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

    const onSubmit = useCallback(
      async (
        actionCreateSchemaParamValues: any /* actually follows formJzodSchema */,
        formikFunctions: { setSubmitting: any; setErrors: any }
      ) => {
        try {
          //  Send values somehow
          // setformHelperState(actionCreateSchemaParamValues);

          console.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik values",
            actionCreateSchemaParamValues,
            "newApplicationName",
            actionCreateSchemaParamValues.newApplicationName,
            "newDeploymentUuid",
            actionCreateSchemaParamValues.newDeploymentUuid,
            "newSelfApplicationUuid",
            actionCreateSchemaParamValues.newSelfApplicationUuid,
            "newAdminAppApplicationUuid",
            actionCreateSchemaParamValues.newAdminAppApplicationUuid
          );
        } catch (e) {
          console.error("onSubmit error", e);
        }
      },
      // [setformHelperState]
      []
    );

    // const resolvedJzodSchema: JzodEnum = rawSchema;

    // Mock domainController with handleAction spy
    // TODO: test submit action

    // const defaultProps: JzodElementEditorProps = {
    //   name: "testName",
    //   listKey: "ROOT.testName",
    //   rootLesslistKey: "testName",
    //   rootLesslistKeyArray: ["testName"],
    //   formState: "value2",
    //   label: "Test Label",
    //   rawJzodSchema: rawSchema,
    //   currentDeploymentUuid:emptyString,
    //   currentApplicationSection:"data",
    //   // onChange: vi.fn(),
    //   resolvedElementJzodSchema: rawSchema,
    //   foreignKeyObjects:emptyObject,
    //   forceTestingMode: false,
    //   unionInformation: undefined,
    //   // formik:
    // };
    // const [formState,setFormState] = useState<{[k:string]:any}>(initialFormState);
    const [formState, setFormState] = useState<any>(props.initialFormState);
    const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
      let result: ResolvedJzodSchemaReturnType | undefined = undefined;
      try {
        result =
          miroirFundamentalJzodSchema && props.rawJzodSchema && formState && currentModel
            ? jzodTypeCheck(
                props.rawJzodSchema,
                formState,
                [], // currentValuePath
                [], // currentTypePath
                miroirFundamentalJzodSchema as JzodSchema,
                currentModel,
                currentMiroirModel,
                {}
              )
            : undefined;
      } catch (e) {
        console.error(
          "ReportSectionEntityInstance useMemo error",
          // JSON.stringify(e, Object.getOwnPropertyNames(e)),
          e,
          "props",
          props,
          "context",
          context
        );
        result = {
          status: "error",
          valuePath: [],
          typePath: [],
          error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
        };
      }
      return result;
    }, [props, props.rawJzodSchema, formState, context]);

    console.info(
      "JzodElementEditor useMemo",
      "formState",
      JSON.stringify(formState, null, 2),
      "props.rawJzodSchema",
      JSON.stringify(props.rawJzodSchema, null, 2),
      "resolvedJzodSchema",
      JSON.stringify(resolvedJzodSchema, null, 2),
    );
    // const resolvedJzodSchema: ResolvedJzodSchemaReturnType = {
    //   status: "ok",
    //   valuePath: [],
    //   typePath: [],
    //   element: rawSchema,
    // }

    return (
      <div>
          <Formik
            enableReinitialize={true}
            initialValues={formState}
            onSubmit={onSubmit}
            handleChange={(e: ChangeEvent<any>) => {
              console.info(
                "onChange formik values ###########################################",
                e.target.value
              );
              setFormState(e.target.value);
            }}
          >
            {(formik) => (
              <>
                <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
                  {resolvedJzodSchema != undefined && resolvedJzodSchema.status == "ok" ? (
                    <>
                      <JzodElementEditor
                        name={props.name}
                        listKey={props.listKey}
                        rootLesslistKey={emptyString}
                        rootLesslistKeyArray={emptyList}
                        paramMiroirFundamentalJzodSchema={miroirFundamentalJzodSchema as JzodSchema}
                        label={props.label}
                        currentDeploymentUuid={emptyString}
                        currentApplicationSection={"data"}
                        rawJzodSchema={props.rawJzodSchema}
                        resolvedElementJzodSchema={resolvedJzodSchema.element}
                        foreignKeyObjects={emptyObject}
                        handleChange={formik.handleChange as any}
                        formik={formik}
                        setFormState={setFormState}
                        formState={formState}
                      />
                      <button type="submit" name={pageLabel} form={"form." + pageLabel}>
                        submit form.{pageLabel}
                      </button>
                    </>
                  ) : (
                    <div>could not display editor because schema could not be resolved</div>
                  )}
                </form>
              </>
            )}
          </Formik>
      </div>
    );
  };

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  describe("JzodEnumEditor", () => {
    const enumValues = ["value1", "value2", "value3"];
    const testProps: JzodElementEditorProps_Test = {
      label: "Test Label",
      name: "testName",
      listKey: "ROOT.testName",
      initialFormState: "value2",
      rawJzodSchema: {
        type: "enum",
        definition: enumValues,
      }
      // onChange,
    };
    const LocalJzodEnumEditor: React.FC<JzodElementEditorProps_Test> = (props:JzodElementEditorProps_Test) => (
      <Wrapper>
        <LocalJzodElementEditor {...props} />
      </Wrapper>
    );

    // ###############################################
    it("renders label if provided", () => {
      render(<LocalJzodEnumEditor { ...testProps }/>);
      expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
    });

    it("does not render label if not provided", () => {
      render(<LocalJzodEnumEditor {...{ ...testProps, label: undefined }} />);
      expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
    });

    it("renders select with correct value", () => {
      render(<LocalJzodEnumEditor { ...testProps }/>);
      const combobox = screen.getByRole("combobox");
      expect(combobox).toContainHTML("value2");
    });

    it("renders all enum options", () => {
      render(<LocalJzodEnumEditor { ...testProps }/>);
      const combobox = screen.getByRole("combobox");
      fireEvent.mouseDown(combobox);
      enumValues.forEach((val) => {
        expect(screen.getByRole("option", { name: val })).toBeInTheDocument();
      });
    });

    it("calls onChange when selection changes", () => {
      render(<LocalJzodEnumEditor { ...testProps }/>);
      const combobox = screen.getByRole("combobox");
      fireEvent.mouseDown(combobox);
      fireEvent.click(screen.getByRole("option", { name: "value3" }));
      expect(combobox.innerHTML).toEqual("value3");
    });

  });

  // ##############################################################################################
  describe("JzodLiteralEditor", () => {
    const testProps: JzodElementEditorProps_Test = {
      label: "Test Label",
      name: "testName",
      listKey: "ROOT.testName",
      initialFormState: "test-value",
      rawJzodSchema: {
        type: "literal",
        definition: "test-value",
      },
      // onChange,
    };

    const LocalJzodLiteralEditor: React.FC<JzodElementEditorProps_Test> = (
      props: JzodElementEditorProps_Test
    ) => (
      <Wrapper>
        <LocalJzodElementEditor {...props} />
      </Wrapper>
    );

    // ###############################################
    it("renders label if provided", () => {
      render(<LocalJzodLiteralEditor {...testProps} />);
      expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
    });

    it("does not render label if not provided", () => {
      render(<LocalJzodLiteralEditor {...{ ...testProps, label: undefined }} />);
      expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
    });

    it("renders select with correct value", () => {
      render(<LocalJzodLiteralEditor {...testProps}/>);
      expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
    });

    it("fails to set new value", () => {
      render(<LocalJzodLiteralEditor {...testProps} />);
      expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
      const input = screen.getByDisplayValue("test-value");
      fireEvent.change(input, { target: { value: "new value" } });
      expect(screen.getByText("could not display editor because schema could not be resolved")).toBeInTheDocument();
    });

  });
});