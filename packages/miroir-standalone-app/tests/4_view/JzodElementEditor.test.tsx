import { describe, expect, it, vi } from "vitest";
import { Provider } from 'react-redux';
// import { ThemeProvider } from '@emotion/react';
import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from "@testing-library/react";
import { Formik } from "formik";

import { JzodEnum } from "miroir-core";
import { ChangeEvent, useCallback, useState } from "react";
import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";
import { emptyList, emptyObject, emptyString } from "../../src/miroir-fwk/4_view/routes/Tools";
import { MiroirContextReactProvider } from '../../src/miroir-fwk/4_view/MiroirContextReactProvider';
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

const pageLabel = "JzodElementEditor.test";
// const onChange = vi.fn();

describe("JzodElementEditor", () => {
  const listKey = "ROOT.testName";
  const name = "testName";
  const label = "Test Label";

  const defaultProps = {
    name,
    label,
    // onChange,
  }

  const enumValues = ["value1", "value2", "value3"];
  const initialFormState = "value2";

  const currentMiroirConfig: MiroirConfigClient = undefined as any; // Replace with actual MiroirConfigClient if available
  const miroirContext = new MiroirContext(currentMiroirConfig);
  const theme = createTheme(themeParams);

  ConfigurationService.registerTestImplementation({expect: expect as any});

  const persistenceSaga: PersistenceReduxSaga = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister,
    ),
    // remotePersistenceStoreRestClient: persistenceClientAndRestClient,
    remotePersistenceStoreRestClient: undefined as any,
  });
  
  const localCache: LocalCacheInterface = new LocalCache(persistenceSaga);

  // Mock domainController with handleAction spy
  // TODO: test submit action
  const handleAction = vi.fn();
  const domainController: DomainControllerInterface = {
    handleAction,
    // add other methods if needed
  } as any;

  const LocalJzodElementEditor: React.FC<any> = (
    props: {
      label?: string,
      // onChange: (e: ChangeEvent<any>) => void,
    }
  ) => {
    // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();
    
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

    const rawSchema: JzodEnum = {
      type: "enum",
      definition: enumValues,
    };
    const resolvedJzodSchema: JzodEnum = rawSchema;

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
    const [formState,setFormState] = useState<any>(initialFormState);
    return (
      <div>
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <Provider store={localCache.getInnerStore()}>
            <MiroirContextReactProvider miroirContext={miroirContext} domainController={domainController}>
              <Formik
                enableReinitialize={true}
                initialValues={formState}
                onSubmit={onSubmit}
                handleChange={
                  (e: ChangeEvent<any>) => {
                  console.info("onChange formik values ###########################################", e.target.value);
                  setFormState(e.target.value);
                }
              }
              >
                {(formik) => (
                  <>
                    <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
                      <>
                        <JzodElementEditor
                          name={name}
                          listKey={listKey}
                          rootLesslistKey={emptyString}
                          rootLesslistKeyArray={emptyList}
                          paramMiroirFundamentalJzodSchema={miroirFundamentalJzodSchema as JzodSchema}
                          // label={pageLabel}
                          label={props.label}
                          currentDeploymentUuid={emptyString}
                          currentApplicationSection={"data"}
                          rawJzodSchema={rawSchema}
                          resolvedElementJzodSchema={resolvedJzodSchema}
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
                    </form>
                  </>
                )}
              </Formik>
            </MiroirContextReactProvider>
          </Provider>
          </StyledEngineProvider>
        </ThemeProvider>
      </div>
    );};
  
  it("renders label if provided", () => {
    // render(<JzodElementEditor {...defaultProps} />);
    render(<LocalJzodElementEditor {...defaultProps}/>);
    expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
  });

  it("does not render label if not provided", () => {
    render(<LocalJzodElementEditor />);
    expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
  });

  it("renders select with correct value", () => {
    render(<LocalJzodElementEditor {...defaultProps}/>);
    const combobox = screen.getByRole("combobox");
    expect(combobox).toContainHTML("value2");
  });

  it("renders all enum options", () => {
    render(<LocalJzodElementEditor {...defaultProps} />);
    const combobox = screen.getByRole("combobox");
    fireEvent.mouseDown(combobox);
    enumValues.forEach((val) => {
      expect(screen.getByRole("option", { name: val })).toBeInTheDocument();
    });
  });

  it("calls onChange when selection changes", () => {
    render(<LocalJzodElementEditor {...defaultProps}/>);
    const combobox = screen.getByRole("combobox");
    fireEvent.mouseDown(combobox);
    fireEvent.click(screen.getByRole("option", { name: "value3" }));
    // console.info("combobox.innerHTML", combobox.innerHTML);
    expect(combobox.innerHTML).toEqual("value3");
  });

  it("sets select id and name correctly", () => {
    render(<LocalJzodElementEditor {...defaultProps}/>);
    // 
    expect(screen.getByRole("combobox")).toHaveAttribute("id", listKey);
    // 
    const select = screen.getByRole(listKey);
    const input = select.querySelector('input');
    expect(input).toHaveAttribute("name", name);
  });
});