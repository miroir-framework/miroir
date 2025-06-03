import { fireEvent, render, screen } from "@testing-library/react";
import { Formik } from "formik";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { expect, ExpectStatic, vi } from "vitest";

import { ThemeProvider } from "@emotion/react";
import { createTheme, StyledEngineProvider } from "@mui/material";
import {
  adminConfigurationDeploymentMiroir,
  ConfigurationService,
  DomainControllerInterface,
  JzodElement,
  JzodSchema,
  jzodTypeCheck,
  LocalCacheInterface,
  MetaModel,
  MiroirContext,
  miroirFundamentalJzodSchema,
  PersistenceStoreControllerManager,
  ResolvedJzodSchemaReturnType,
} from "miroir-core";
import { LocalCache, PersistenceReduxSaga } from "miroir-localcache-redux";

import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";
import { JzodLiteralEditor, JzodLiteralEditorProps } from "../../src/miroir-fwk/4_view/components/JzodLiteralEditor";
import { MiroirContextReactProvider, useMiroirContextService } from "../../src/miroir-fwk/4_view/MiroirContextReactProvider";
import { useCurrentModel } from "../../src/miroir-fwk/4_view/ReduxHooks";
import { emptyList, emptyObject, emptyString } from "../../src/miroir-fwk/4_view/routes/Tools";
import { JzodEnumEditor, JzodEnumEditorProps } from "../../src/miroir-fwk/4_view/components/JzodEnumEditor";
import { JzodEnum } from "miroir-core";
import { blue } from "@mui/material/colors";
import { alterObjectAtPath } from "miroir-core";

export const testThemeParams = {
  palette: {
    primary: {
      main: blue[500],
    },
  },
  spacing: 2,
  components: {
    toolbar: {
      paddingRight: 24, // keep right padding when drawer closed
    },
    MuiContainer: { // no effect?
      defaultProps: {
        disableGutters: true,
      },
    },
    MuiToolbar: { // no effect
      defaultProps: {
        disableGutters: true,
      },
    },
    MuiGridContainer: { // no effect?
      defaultProps: {
        disableGutters: true,
      },
    },
    // toolbarIcon: {
    //   display: 'flex',
    //   alignItems: 'center',
    //   justifyContent: 'flex-end',
    //   padding: '0 8px',
    //   ...theme.mixins.toolbar,
    // },
    // appBar: {
    //   zIndex: theme.zIndex.drawer + 1,
    //   transition: theme.transitions.create(['width', 'margin'], {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }),
    // },
    // appBarShift: {
    //   marginLeft: SidebarWidth,
    //   width: `calc(100% - ${SidebarWidth}px)`,
    //   transition: theme.transitions.create(['width', 'margin'], {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.enteringScreen,
    //   }),
    // },
    // menuButton: {
    //   marginRight: 36,
    // },
    // menuButtonHidden: {
    //   display: 'none',
    // },
    // title: {
    //   flexGrow: 1,
    // },
    // drawerPaper: {
    //   position: 'relative',
    //   whiteSpace: 'nowrap',
    //   width: SidebarWidth,
    //   transition: theme.transitions.create('width', {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.enteringScreen,
    //   }),
    // },
    // drawerPaperClose: {
    //   overflowX: 'hidden',
    //   transition: theme.transitions.create('width', {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }),
    //   width: theme.spacing(7),
    //   [theme.breakpoints.up('sm')]: {
    //     width: theme.spacing(9),
    //   },
    // },
    // appBarSpacer: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      height: '100vh',
      overflow: 'auto',
    },
    MuiList: {
      defaultProps:{
        style: {border: `0`,}
        // style: {border: `10px dashed ${blue[500]}`,}
      }
    },
    MuiDialog: {
      defaultProps:{
        // style: {maxWidth: "100vw",display:"inline-flex"}
        // style: {maxWidth: "100vw"}
        style: {display:"inline-flex", justifyContent:'center', alignItems:"center"}
      }
    },
    MuiDialogTitle: {
      defaultProps:{
        style: {display:"flex"}
      }
    },
    //   defaultProps:{
    //     style: {maxHeight:"90vh",maxWidth:"90vw",display:"inline-flex"}
    //     // style: {display:"inline-flex"}
    //   }
    // }
  }
};

export interface JzodElementEditorProps_Test {
  // forceTestingMode?: boolean;
  name: string;
  label?: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  // indentLevel?: number;
  initialFormState: any;
  rawJzodSchema: JzodElement | undefined;
  // formik: any;
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
  // handleChange: (e: ChangeEvent<any>) => Promise<void>;
  // setFormState: React.Dispatch<
  //   React.SetStateAction<{
  //     [k: string]: any;
  //   }>
  // >;
  // parentObjectSetItemsOrder?: React.Dispatch<React.SetStateAction<any[]>>;
  // parentObjectItemsOrder?: any[];
}


export type JzodEditorTestCaseRenderer<LocalComponentProps> = {
  renderAsComponent?: React.FC<LocalComponentProps>;
  renderAsJzodElementEditor?: React.FC<JzodElementEditorProps_Test>;
};

export interface JzodEditorTestCase<PropType extends Record<string, any>> {
  props?:PropType | ((props:PropType) => PropType),
  componentProps?:PropType | ((props:PropType) => PropType),
  jzodElementEditorProps?:JzodElementEditorProps_Test | ((props:PropType) => JzodElementEditorProps_Test),
  renderComponent: JzodEditorTestCaseRenderer<PropType>;
  tests:
    | ((expect: ExpectStatic) => void)
    | { testAsComponent?: (expect: any) => void; testAsJzodElementEditor?: (expect: any) => void };
}

export type JzodEditorTest<PropType extends Record<string, any>> = Record<string, JzodEditorTestCase<PropType>>;

export interface JzodEditorTestSuite<T extends Record<string, any>> {
  suiteRenderComponent?: JzodEditorTestCaseRenderer<T>;
  suiteProps?: T;
  tests: JzodEditorTest<T>;
};
export type JzodEditorTestSuites<T extends Record<string, any>> = Record<string, JzodEditorTestSuite<T>>;


// ################################################################################################
// ################################################################################################
// LOCAL EDITOR
// ################################################################################################
// ################################################################################################
// export const getLocalEditor: <T extends Record<string, any>>(pageLabel: string) => React.FC<LocalLiteralEditorProps> =
export const getLocalEditor: <S extends Record<string, any>, T extends Record<string, any>>(
  pageLabel: string,
  Compo: React.FC<S>
) => React.FC<T> =
  <S extends Record<string, any>, T extends Record<string, any>>(pageLabel: string, Compo: React.FC<S>) => {
  const result: React.FC<T> = (
    props: T
  ) => {
    const initialFormState: any = {[props.name]: props.initialFormState};
    console.info(
      "getLocalEditor props",
      JSON.stringify(props, null, 2),
      "initialFormState",
      JSON.stringify(initialFormState, null, 2)
    );
    const [formState, setFormState] = useState<any>(
       initialFormState
    ); // TODO: UNIFY!!!
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // console.log(
      //   "handleChange event value ###########################################",
      //   e.target.value
      // );
      // console.log(
      //   "handleChange props",
      //   JSON.stringify(props, null, 2),
      // );
      const newFormState: any = alterObjectAtPath(
        formState,
        props.rootLesslistKeyArray,
        e.target.value
      );
      // console.log(
      //   "handleChange newFormState ###########################################",
      //   JSON.stringify(newFormState, null, 2)
      // );
      setFormState(newFormState);
      // setFormState(e.target.value);
      // console.log(
      //   "handleChange formik values after ###########################################",
      //   formState
      // );
    }, [props, setFormState]);

    const onSubmit = (values: any) => {
      console.log("onSubmit formik values ###########################################", values);
      setFormState(values);
    };

    // const innerProps: S = useMemo(() => {
    //   console.info("getLocalEditor innerProps with", "formState", formState);
    //   return {
    //     ...props,
    //     value: formState,
    //     formik: {
    //       getFieldProps: () => ({
    //         name: "fieldName",
    //         value: formState,
    //         onChange: handleChange,
    //       }),
    //     },
    //     onChange: handleChange,
    //   } as any as S;
    // }, [props, formState, handleChange]);
    return (
      <Formik
        enableReinitialize={true}
        initialValues={formState}
        onSubmit={onSubmit}
        handleChange={handleChange}
        // handleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        //   console.info(
        //     "handleChange event value ###########################################",
        //     e.target.value
        //   );
        //   console.info("handleChange props", JSON.stringify(props, null, 2));
        //   const newFormState: any = alterObjectAtPath(
        //     props.formik.values,
        //     props.rootLesslistKeyArray,
        //     e.target.value
        //   );

        //   setFormState(newFormState);
        //   // setFormState(e.target.value);
        //   console.info(
        //     "handleChange formik values after ###########################################",
        //     formState
        //   );
        // }}
      >
        {(formik) => (
          <>
            <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
              <Compo
                {
                  // ...(props as any),
                  ...({
                    ...props,
                    // value: formState,
                    // currentValue: formState,
                    // formik,
                    formState,
                    // handleChange,
                    onChange: handleChange,
                    formik: { // 
                      ...formik,
                      getFieldProps: () => ({
                        name: "fieldName",
                        value: formState,
                        onChange: formik.handleChange,
                      }),
                    },
                  } as any)
                }
              />
            </form>
          </>
        )}
      </Formik>
    );
  }
  return result;
};


// ################################################################################################
// ################################################################################################
// ################################################################################################
// JZOD ELEMENT EDITOR
// ################################################################################################
export const getLocalJzodElementEditor: (
  pageLabel: string
) => React.FC<JzodElementEditorProps_Test> =
  (pageLabel: string) => (props: JzodElementEditorProps_Test) => {
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

    // console.info(
    //   "JzodElementEditor useMemo",
    //   "formState",
    //   JSON.stringify(formState, null, 2),
    //   "props.rawJzodSchema",
    //   JSON.stringify(props.rawJzodSchema, null, 2),
    //   "resolvedJzodSchema",
    //   JSON.stringify(resolvedJzodSchema, null, 2)
    // );
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

  // ################################################################################################
export function getWrapperForLocalJzodElementEditor(): React.FC<any> {
  // const miroirContext: MiroirContext = new MiroirContext(currentMiroirConfig);
  const miroirContext: MiroirContext = new MiroirContext(undefined as any);
  const theme = createTheme(testThemeParams);
  
  ConfigurationService.registerTestImplementation({ expect: expect as any });

  const persistenceSaga:PersistenceReduxSaga  = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister
    ),
    // remotePersistenceStoreRestClient: persistenceClientAndRestClient,
    remotePersistenceStoreRestClient: undefined as any,
  });

  const localCache: LocalCacheInterface = new LocalCache(persistenceSaga);

  // ###############################################
  return (props: { children?: React.ReactNode }) => {
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
  };
};
  
// ##############################################################################################
export function runJzodEditorTest(
  testCase: JzodEditorTestCase<any>,
  testSuite: JzodEditorTestSuite<any>,
  testName: string,
  renderAs: "component" | "jzodElementEditor" = "jzodElementEditor"
) {
  const ComponentToRender: React.FC<any> | undefined =
    renderAs == "jzodElementEditor"
      ? testCase.renderComponent.renderAsJzodElementEditor
      : testCase.renderComponent.renderAsComponent;
  if (!ComponentToRender) {
    throw new Error(
      `Test case ${testName} does not have a renderAsJzodElementEditor or renderAsComponent function, skipping test: ${testName}`
    );
  }
  const testCaseSpecificProps =
    renderAs == "jzodElementEditor" ? testCase.jzodElementEditorProps : testCase.componentProps;
  const props: JzodElementEditorProps_Test | undefined =
    testCaseSpecificProps == undefined
      ? typeof testCase.props === "function"
        ? (testCase.props(testSuite.suiteProps as any) as any)
        : testCase.props ?? (testSuite.suiteProps as any)
      : typeof testCaseSpecificProps === "function"
      ? testCaseSpecificProps(
          typeof testCase.props == "function" || !testCase.props
            ? testSuite.suiteProps
            : testCase.props ?? (testSuite.suiteProps as any)
        ) // TODO: testCase.props can be a function, which will fail.
      : testCaseSpecificProps;
  // console.log(
  //   "runJzodEditorTest",
  //   "testName",
  //   testName,
  //   "renderAs",
  //   renderAs,
  //   "testCaseSpecificProps",
  //   testCaseSpecificProps,
  //   "testCase.props",
  //   testCase.props,
  //   "testSuite.suiteProps",
  //   testSuite.suiteProps,
  //   "props",
  //   props
  // );

  if (props) {
    render(<ComponentToRender {...props} />);
    const tests =
      typeof testCase.tests === "function"
        ? testCase.tests
        : (renderAs == "jzodElementEditor"
            ? testCase.tests.testAsJzodElementEditor
            : testCase.tests.testAsComponent) ?? ((expect: ExpectStatic) => {});
    tests(expect);
  } else {
    console.warn(`Test case ${testName} does not have props defined, skipping test: ${testName}`);
  }
}


// ################################################################################################
// LITERAL
// ################################################################################################
export interface LocalLiteralEditorProps {
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  // value: any;
  initialFormState: string;
  label?: string;
}

export type JzodLiteralEditorTest = JzodEditorTest<LocalLiteralEditorProps>;
export type JzodLiteralEditorTestSuites = JzodEditorTestSuites<LocalLiteralEditorProps>;


const handleAction = vi.fn();

// // ################################################################################################
// // ################################################################################################
export function getJzodLiteralEditorTests(
  LocalLiteralEditor: React.FC<LocalLiteralEditorProps>,
  WrapperForJzodElementEditor: React.FC<any>,
  LocalJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodLiteralEditorTestSuites {
  return {
    "JzodLiteralEditor": {
      tests: {
        "renders input with label when label prop is provided": {
          renderComponent: {
            renderAsComponent: LocalLiteralEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          props: {
            name: "fieldName",
            listKey: "root.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            initialFormState: "test-value",
            label: "Test Label",
          },
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: {
            testAsComponent: (expect) => {
              expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
              expect(screen.getByRole("textbox")).toHaveAttribute("name", "fieldName"); // TODO: this is implementation detail, should be removed
            },
            testAsJzodElementEditor: (expect) => {
              expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
            },
          },
        },
        "renders input without label when label prop is not provided": {
          renderComponent: {
            renderAsComponent: LocalLiteralEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          props: {
            name: "fieldName",
            listKey: "root.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            initialFormState: "test-value",
            // label: "Test Label", // no label
          },
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              // initialFormState: "test-value",
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: (expect) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "setting new value, succeeds in JzodLiteralEditor, fails in JzodElementEditor": {
          renderComponent: {
            renderAsComponent: LocalLiteralEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          props: {
            name: "fieldName",
            listKey: "root.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            // value: "test-value",
            label: "Test Label",
            initialFormState: "test-value",
          },
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              // initialFormState: "test-value",
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: {
            testAsComponent: (expect) => {
              expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
              const input = screen.getByDisplayValue("test-value");
              fireEvent.change(input, { target: { value: "new value" } });
              expect(screen.getByDisplayValue(/new value/)).toBeInTheDocument();
            },
            testAsJzodElementEditor: (expect) => {
              expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
              const input = screen.getByDisplayValue("test-value");
              fireEvent.change(input, { target: { value: "new value" } });
              // expect(screen.getByDisplayValue(/new value/)).toBeInTheDocument();
              expect(
                screen.getByText("could not display editor because schema could not be resolved")
              ).toBeInTheDocument();
            },
          },
        },
      }
    }
  };
};

// ################################################################################################
export function literalBeforeAll(
  pageLabel: string,
) {
  const WrapperForJzodElementEditor: React.FC<any> = getWrapperForLocalJzodElementEditor();
  // const jzodLiteralEditorTest: JzodEditorTest<LocalLiteralEditorProps> = getJzodLiteralEditorTests(
  const jzodLiteralEditorTest: JzodEditorTestSuites<LocalLiteralEditorProps> = getJzodLiteralEditorTests(
    getLocalEditor<JzodLiteralEditorProps, LocalLiteralEditorProps>(pageLabel, JzodLiteralEditor),
    WrapperForJzodElementEditor,
    getLocalJzodElementEditor(pageLabel)
  );
  return jzodLiteralEditorTest;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ENUM
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export interface LocalEnumEditorProps {
  label?: string;
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  rawJzodSchema: JzodEnum | undefined;
  initialFormState: any;
}

export type JzodEnumEditorTest = JzodEditorTest<LocalEnumEditorProps>;
export type JzodEnumEditorTestSuites = JzodEditorTestSuites<LocalEnumEditorProps>;

export function getJzodEnumEditorTests(
  LocalEditor: React.FC<LocalEnumEditorProps>,
  WrapperForJzodElementEditor: React.FC<any>,
  LocalJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEnumEditorTestSuites {
  const enumValues = ["value1", "value2", "value3"];
  return {
    JzodEnumEditor: {
      suiteProps: {
        label: "Test Label",
        name: "fieldName",
        listKey: "ROOT.fieldName",
        rootLesslistKey: "fieldName",
        rootLesslistKeyArray: ["fieldName"],
        rawJzodSchema: {
          type: "enum",
          definition: enumValues,
        },
        initialFormState: "value2",
      },
      tests: {
        "renders input with label when label prop is provided": {
          renderComponent: {
            renderAsComponent: LocalEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          tests: (expect: ExpectStatic) => {
            expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
          },
        },
        "renders input without label when label prop is not provided": {
          renderComponent: {
            renderAsComponent: LocalEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          props: {
            // label: "Test Label",
            name: "fieldName",
            listKey: "listKey",
            rootLesslistKey: "rootLesslistKey",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "enum",
              definition: enumValues,
            },
            initialFormState: "value2",
          },
          jzodElementEditorProps: (props: LocalEnumEditorProps) =>
            ({
              ...props,
              initialFormState: "value2",
            } as JzodElementEditorProps_Test),
          tests: (expect) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            // expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "renders select with correct value": {
          renderComponent: {
            renderAsComponent: LocalEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          tests: (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            expect(combobox).toContainHTML("value2");
            // expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
          },
        },
        "renders all enum options": {
          renderComponent: {
            renderAsComponent: LocalEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          tests: (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            fireEvent.mouseDown(combobox);
            enumValues.forEach((val) => {
              expect(screen.getByRole("option", { name: val })).toBeInTheDocument();
            });
          },
        },
        "form state is changed when selection changes": {
          renderComponent: {
            renderAsComponent: LocalEditor,
            renderAsJzodElementEditor: (props: JzodElementEditorProps_Test) => (
              <WrapperForJzodElementEditor>
                <LocalJzodElementEditor {...props} />
              </WrapperForJzodElementEditor>
            ),
          },
          tests: (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            fireEvent.mouseDown(combobox);
            fireEvent.click(screen.getByRole("option", { name: "value3" }));
            // expect(screen.getByLabelText(/Test LabelSSSSSSSSSSSSSSSSSSSSSSSS/)).toBeInTheDocument();
            expect(combobox).toContainHTML("value3");
          },
        },
      },
    },
  };
};

// ################################################################################################
export function enumBeforeAll(
  pageLabel: string,
) {
  const WrapperForJzodElementEditor: React.FC<any> = getWrapperForLocalJzodElementEditor();
  const jzodEnumEditorTest: JzodEditorTestSuites<LocalEnumEditorProps> = getJzodEnumEditorTests(
    getLocalEditor<JzodEnumEditorProps, LocalEnumEditorProps>(pageLabel, JzodEnumEditor),
    WrapperForJzodElementEditor,
    getLocalJzodElementEditor(pageLabel)
  );
  return jzodEnumEditorTest;
}
