/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Formik, getIn, useFormikContext } from "formik";
import {
  addEndpointAction,
  compositeEndpointAction,
  ENDPOINT_ENTITY_UUID,
  endpointActionRegistry,
  getApplicationSection,
  newCustomRunner,
  newEndpoint,
  renameRunner,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type LocalCacheExtractor,
  type MlElement,
  type Uuid,
} from "miroir-core";
import { useDomainControllerService } from "miroir-react";
import React, { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { useCurrentModelEnvironment, useEntityInstanceUuidIndexFromLocalCache } from "../../ReduxHooks.js";
import { useBlockRunnerOf } from "../BlockEditor/BlockRunnerHat.js";
import { BlockActionDefaultsContext, BlockRunnerContext } from "../BlockEditor/BlockViewMode.js";
import { TypedValueObjectEditor } from "../Reports/TypedValueObjectEditor.js";
import { StoredRunnerView } from "../Runners/RunnerView.js";
import { saveInstanceFromUI } from "../saveInstanceFromUI.js";
import {
  ThemedButton,
  ThemedDialog,
  ThemedDialogActions,
  ThemedDialogContent,
  ThemedDialogTitle,
  ThemedLabel,
  ThemedLabeledEditor,
  ThemedStyledButton,
  ThemedSwitch,
} from "../Themes/index";

// ################################################################################################
// #505 (analysis #497, G8): the sequence editor of the Tools page. It edits the composite action
// sequence of a custom Runner of the editor application, or a new sequence, in the value editor
// (Blocks / Form / JSON, with undo), under the Runner's "when run" hat, where its form fields are
// added, renamed and removed. "Save <name>" updates the chosen Runner. "Save…" opens the dialog of
// a new sequence: "create Runner" creates a Runner of the application, named and labelled there.
// A saved Runner runs below the editor, with its form.
// #506: "create Action" creates a composite Endpoint action from the sequence, in an Endpoint of
// the application or a new one: the Runner's form fields are its payload parameters. With both
// switches on, the new Runner is an action Runner calling the new action, which runs below.
// ################################################################################################

const RUNNER_ENTITY_UUID = "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd";
const NEW_SEQUENCE = "new";
const FORMIK_ROOT = "sequenceEditor";
const DEFINITION_FIELD = `${FORMIK_ROOT}.definition`;
const SEQUENCE_KEY = "definition.compositeActionSequence";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

/**
 * The value editor sees the sequence, at the path a Runner holds it, and keeps the Runner's form
 * next to it, hidden: a form field renamed in the hat and its reads in the sequence change in one
 * value, so one Undo restores both. The Runner's uuid, hidden too, makes another Runner (a new one
 * saved from the dialog) a new starting point of the history.
 */
const HIDDEN = { tag: { value: { display: { hidden: true } } } };
const SEQUENCE_FORM_SCHEMA: MlElement = {
  type: "object",
  definition: {
    uuid: { type: "string", optional: true, ...HIDDEN },
    definition: {
      type: "object",
      definition: {
        formMLSchema: { type: "any", optional: true, ...HIDDEN },
        compositeActionSequence: {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "compositeActionSequenceTemplate",
          },
        },
      },
    },
  },
};

type RunnerValue = Record<string, unknown> & { uuid: Uuid; name: string; definition: Record<string, unknown> };

/** A new sequence: no step, under a Runner with no form field yet. */
function isCustomRunner(instance: unknown): instance is RunnerValue {
  if (typeof instance !== "object" || instance === null) {
    return false;
  }
  const { uuid, name, definition } = instance as Record<string, unknown>;
  return (
    typeof uuid === "string" &&
    typeof name === "string" &&
    typeof definition === "object" &&
    definition !== null &&
    (definition as Record<string, unknown>).runnerType === "customRunner"
  );
}

function newSequenceRunner(application: Uuid): RunnerValue {
  return newCustomRunner({
    uuid: "",
    application,
    name: "newRunner",
    defaultLabel: "New Runner",
    sequence: { actionType: "compositeActionSequence", actionLabel: "newRunner", endpoint: DOMAIN_ENDPOINT, payload: { actionSequence: [] } },
  }) as RunnerValue;
}

function editedValueOf(runner: RunnerValue) {
  const { formMLSchema, compositeActionSequence } = runner.definition;
  return { uuid: runner.uuid, definition: { formMLSchema, compositeActionSequence } };
}

type EndpointValue = Record<string, unknown> & { uuid: Uuid; name: string; definition: { actions: unknown[] } };

/** An Endpoint declaring actions: an external service declares none, and takes no new one. */
function isEndpointWithActions(instance: unknown): instance is EndpointValue {
  if (typeof instance !== "object" || instance === null) {
    return false;
  }
  const { uuid, name, definition } = instance as Record<string, unknown>;
  return (
    typeof uuid === "string" &&
    typeof name === "string" &&
    typeof definition === "object" &&
    definition !== null &&
    Array.isArray((definition as Record<string, unknown>).actions)
  );
}

function formOf(runner: RunnerValue) {
  return { [FORMIK_ROOT]: editedValueOf(runner) };
}

export interface SequenceEditorProps {
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
}

export function SequenceEditor(props: SequenceEditorProps) {
  const { application, applicationDeploymentMap } = props;
  const runnerSection = getApplicationSection(application, RUNNER_ENTITY_UUID) as ApplicationSection;
  const extractor = useMemo(
    (): LocalCacheExtractor => ({
      queryType: "localCacheEntityInstancesExtractor",
      definition: { application, applicationSection: runnerSection, entityUuid: RUNNER_ENTITY_UUID },
    }),
    [application, runnerSection],
  );
  const runnerIndex = useEntityInstanceUuidIndexFromLocalCache(extractor, applicationDeploymentMap);
  const customRunners = useMemo(
    () =>
      Object.values(runnerIndex ?? {})
        .filter(isCustomRunner)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [runnerIndex],
  );
  const endpointSection = getApplicationSection(application, ENDPOINT_ENTITY_UUID) as ApplicationSection;
  const endpointExtractor = useMemo(
    (): LocalCacheExtractor => ({
      queryType: "localCacheEntityInstancesExtractor",
      definition: { application, applicationSection: endpointSection, entityUuid: ENDPOINT_ENTITY_UUID },
    }),
    [application, endpointSection],
  );
  const endpointIndex = useEntityInstanceUuidIndexFromLocalCache(endpointExtractor, applicationDeploymentMap);
  const endpoints = useMemo(
    () =>
      Object.values(endpointIndex ?? {})
        .filter(isEndpointWithActions)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [endpointIndex],
  );
  const [selected, setSelected] = useState<string>(NEW_SEQUENCE);
  // #506: the action Runner the save dialog created last, run below until another sequence is chosen
  const [actionRunner, setActionRunner] = useState<Uuid | undefined>(undefined);
  const runnerToRun = actionRunner ?? (selected !== NEW_SEQUENCE ? selected : undefined);
  // the edited Runner but its form and sequence, which Formik holds; a new choice remounts the
  // form, which starts a new history
  const [draft, setDraft] = useState<RunnerValue>(() => newSequenceRunner(application));
  const [form, setForm] = useState(() => ({ generation: 0, initialValues: formOf(draft) }));
  const edit = useCallback((uuid: string, runner: RunnerValue) => {
    setSelected(uuid);
    setActionRunner(undefined);
    setDraft(runner);
    setForm((current) => ({ generation: current.generation + 1, initialValues: formOf(runner) }));
  }, []);
  const choose = useCallback(
    (uuid: string) => {
      const runner = uuid === NEW_SEQUENCE ? newSequenceRunner(application) : customRunners.find((each) => each.uuid === uuid);
      if (runner) {
        edit(uuid, runner);
      }
    },
    [application, customRunners, edit],
  );
  const actionDefaults = useMemo(() => ({ applicationUuid: application }), [application]);
  const { currentTheme } = useMiroirTheme();

  return (
    <section data-testid="sequence-editor" aria-label="Sequence editor" css={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
      <ThemedLabeledEditor
        labelElement={<ThemedLabel>Sequence</ThemedLabel>}
        editor={
          <select
            data-testid="sequence-editor-runner"
            aria-label="The sequence to edit"
            value={selected}
            onChange={(event) => choose(event.target.value)}
            css={css({ font: "inherit", padding: "2px 4px", color: currentTheme.colors.text, background: currentTheme.colors.background })}
          >
            <option value={NEW_SEQUENCE}>New sequence</option>
            {customRunners.map((runner) => (
              <option key={runner.uuid} value={runner.uuid}>
                {`Runner ${runner.name}`}
              </option>
            ))}
          </select>
        }
      />
      <Formik
        key={form.generation}
        initialValues={form.initialValues}
        onSubmit={() => undefined}
        validateOnChange={false}
        validateOnBlur={false}
      >
        <BlockActionDefaultsContext.Provider value={actionDefaults}>
          <SequenceEditorForm
            {...props}
            draft={draft}
            stored={selected !== NEW_SEQUENCE}
            runnerNames={customRunners.map((runner) => runner.name)}
            endpoints={endpoints}
            onCreated={(runner) => {
              setSelected(runner.uuid);
              setDraft(runner);
              setActionRunner(undefined);
            }}
            onActionRunnerCreated={setActionRunner}
          />
        </BlockActionDefaultsContext.Provider>
      </Formik>
      {runnerToRun !== undefined && (
        <div data-testid="sequence-editor-run" css={css({ borderTop: `1px solid ${currentTheme.colors.border}`, paddingTop: "8px" })}>
          <StoredRunnerView
            key={runnerToRun}
            applicationUuid={application}
            applicationDeploymentMap={applicationDeploymentMap}
            runnerUuid={runnerToRun}
          />
        </div>
      )}
    </section>
  );
}

type SaveStatus = { status: "saved" | "error"; message: string } | undefined;

/** #506: the Endpoint of a new action: one of the application's, or a new one named here. */
type ActionEndpointChoice = { uuid: Uuid } | { newName: string };

/** What the save dialog asks for. */
interface SequenceSaveRequest {
  createRunner: boolean;
  createAction: boolean;
  /** The name of the Runner, and the action type of the action. */
  name: string;
  label: string;
  endpoint: ActionEndpointChoice;
}

function SequenceEditorForm(
  props: SequenceEditorProps & {
    draft: RunnerValue;
    /** The draft is a stored Runner: "Save <name>" updates it. */
    stored: boolean;
    runnerNames: string[];
    /** #506: the Endpoints of the application a new action can go in. */
    endpoints: EndpointValue[];
    onCreated: (runner: RunnerValue) => void;
    onActionRunnerCreated: (uuid: Uuid) => void;
  },
) {
  const { application, applicationDeploymentMap, deploymentUuid, draft } = props;
  const formik = useFormikContext<Record<string, unknown>>();
  const { setFieldValue } = formik;
  const edited = getIn(formik.values, DEFINITION_FIELD) as Record<string, unknown>;
  const runner = useMemo(
    (): RunnerValue => ({ ...draft, definition: { ...draft.definition, ...edited } }),
    [draft, edited],
  );
  // a hat change writes the form and the sequence (the reads it rewrites) in one value
  const setRunner = useCallback(
    (changed: Record<string, unknown>) => {
      const { formMLSchema, compositeActionSequence } = (changed as RunnerValue).definition;
      setFieldValue(DEFINITION_FIELD, { formMLSchema, compositeActionSequence }, false);
    },
    [setFieldValue],
  );
  const hat = useBlockRunnerOf(runner, setRunner, SEQUENCE_KEY);
  const domainController = useDomainControllerService();
  const modelEnvironment = useCurrentModelEnvironment(application, applicationDeploymentMap);
  const { currentTheme } = useMiroirTheme();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(undefined);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  // the action saved by the dialog, so a retry after its Runner failed saves the Runner only
  const [savedAction, setSavedAction] = useState<{ name: string; endpointUuid: Uuid } | undefined>(undefined);

  /** Saves `instance`; the saved message names it `what`. */
  const save = async (
    instance: Record<string, unknown> & { uuid: Uuid; name: string },
    actionType: "createInstance" | "updateInstance",
    what: string = `Runner ${instance.name}`,
  ) => {
    setSaving(true);
    const result = await saveInstanceFromUI(domainController, {
      application,
      applicationDeploymentMap,
      modelEnvironment,
      instance: instance as typeof instance & { parentUuid: Uuid },
      actionType,
    });
    setSaving(false);
    if (!result.ok) {
      setSaveStatus({ status: "error", message: `${instance.name} was not saved: ${result.error}` });
      return false;
    }
    setSaveStatus({
      status: "saved",
      message: `${what} saved${result.applicationSection === "model" ? ", to commit with the model" : ""}`,
    });
    return true;
  };

  /**
   * #506: "create Action" of the save dialog: the action `actionType` from the edited sequence, its
   * form fields as parameters, in the chosen Endpoint or a new one. Returns the uuid of its
   * Endpoint, or why it was not created.
   */
  const createAction = async (actionType: string, choice: ActionEndpointChoice): Promise<{ endpointUuid: Uuid } | string> => {
    const form = runner.definition.formMLSchema as { formMLSchemaType?: string; mlSchema?: MlElement } | undefined;
    const fields = form?.formMLSchemaType === "mlSchema" && form.mlSchema?.type === "object" ? form.mlSchema.definition : undefined;
    if (!fields) {
      return "the form of the sequence is computed: an action needs form fields declared one by one";
    }
    const existing = "uuid" in choice ? props.endpoints.find((endpoint) => endpoint.uuid === choice.uuid) : undefined;
    if ("uuid" in choice && !existing) {
      return "the chosen Endpoint is not in the application any more";
    }
    if ("newName" in choice && props.endpoints.some((endpoint) => endpoint.name === choice.newName)) {
      return `an Endpoint named ${choice.newName} exists: choose it in the list`;
    }
    const endpointUuid = existing?.uuid ?? uuidv4();
    let endpoint: Record<string, unknown> & { uuid: Uuid; name: string };
    try {
      const action = compositeEndpointAction({
        actionType,
        endpointUuid,
        sequence: runner.definition.compositeActionSequence,
        runnerName: runner.name,
        fields: fields as Record<string, MlElement>,
        registry: endpointActionRegistry(modelEnvironment),
      });
      endpoint = (
        existing
          ? addEndpointAction(existing, action)
          : newEndpoint({ uuid: endpointUuid, application, name: "newName" in choice ? choice.newName : "", actions: [action] })
      ) as typeof endpoint;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    const what = `Action ${actionType} of the Endpoint ${endpoint.name}`;
    if (!(await save(endpoint, existing ? "updateInstance" : "createInstance", what))) {
      return "the action was not saved";
    }
    return { endpointUuid };
  };

  /** #506: with both switches on, the new Runner calls the new action. */
  const createActionRunner = async (name: string, label: string, endpointUuid: Uuid): Promise<string | undefined> => {
    const actionRunner = {
      uuid: uuidv4(),
      parentName: "Runner",
      parentUuid: RUNNER_ENTITY_UUID,
      application,
      name,
      defaultLabel: label.length > 0 ? label : name,
      definition: { runnerType: "actionRunner", endpoint: endpointUuid, action: name },
    };
    if (!(await save(actionRunner, "createInstance", `Action ${name} and its Runner`))) {
      return "the action was saved, its Runner was not: save again to create the Runner";
    }
    props.onActionRunnerCreated(actionRunner.uuid);
    return undefined;
  };

  const saveAs = async (request: SequenceSaveRequest): Promise<string | undefined> => {
    if (!request.createAction) {
      return createRunner(request.name, request.label);
    }
    if (request.createRunner && props.runnerNames.includes(request.name)) {
      return `a Runner named ${request.name} exists: choose another name`;
    }
    const created =
      request.createRunner && savedAction?.name === request.name
        ? savedAction
        : await createAction(request.name, request.endpoint);
    if (typeof created === "string") {
      return created;
    }
    setSavedAction({ name: request.name, endpointUuid: created.endpointUuid });
    return request.createRunner ? createActionRunner(request.name, request.label, created.endpointUuid) : undefined;
  };

  /** "create Runner" of the save dialog: the draft named `name`, its reads of the form renamed with it, its form kept. */
  const createRunner = async (name: string, label: string): Promise<string | undefined> => {
    if (props.runnerNames.includes(name)) {
      return `a Runner named ${name} exists: choose another name`;
    }
    let created: RunnerValue;
    try {
      const renamed = renameRunner(runner, name);
      created = newCustomRunner({
        uuid: uuidv4(),
        application,
        name,
        defaultLabel: label,
        sequence: (renamed.definition as Record<string, unknown>).compositeActionSequence,
        formMLSchema: (renamed.definition as Record<string, unknown>).formMLSchema,
      }) as RunnerValue;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    if (!(await save(created, "createInstance"))) {
      return "the Runner was not saved";
    }
    // the view stays as it is; its history starts again from the new Runner
    setFieldValue(FORMIK_ROOT, editedValueOf(created), false);
    props.onCreated(created);
    return undefined;
  };

  return (
    <div css={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
      <div data-testid="sequence-editor-save" css={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" })}>
        {props.stored && (
          <ThemedButton
            data-testid="sequence-editor-save-runner"
            variant="secondary"
            disabled={saving}
            onClick={() => void save(runner, "updateInstance")}
          >
            {`Save ${draft.name}`}
          </ThemedButton>
        )}
        <ThemedButton data-testid="sequence-editor-save-as" variant="secondary" onClick={() => setDialogOpen(true)}>
          Save…
        </ThemedButton>
        {saveStatus && (
          <span
            role={saveStatus.status === "error" ? "alert" : "status"}
            data-testid="sequence-editor-save-status"
            data-status={saveStatus.status}
            css={css({
              fontSize: "13px",
              color: saveStatus.status === "error" ? (currentTheme.colors.error ?? "#c62828") : currentTheme.colors.text,
            })}
          >
            {saveStatus.message}
          </span>
        )}
      </div>
      {dialogOpen && (
        <SequenceSaveDialog
          initialName={props.stored ? `${draft.name}Copy` : ""}
          saving={saving}
          endpoints={props.endpoints}
          onCancel={() => setDialogOpen(false)}
          onSave={async (request) => {
            const error = await saveAs(request);
            if (!error) {
              setDialogOpen(false);
            }
            return error;
          }}
        />
      )}
      <BlockRunnerContext.Provider value={hat}>
        <TypedValueObjectEditor
          labelElement={<>Sequence</>}
          formValueMLSchema={SEQUENCE_FORM_SCHEMA}
          formikValuePathAsString={FORMIK_ROOT}
          application={application}
          applicationDeploymentMap={applicationDeploymentMap}
          deploymentUuid={deploymentUuid}
          applicationSection={"model"}
          formLabel={"Sequence Editor"}
          displaySubmitButton="noDisplay"
          valueObjectEditMode="create"
          maxRenderDepth={Infinity}
        />
      </BlockRunnerContext.Provider>
    </div>
  );
}

const NEW_ENDPOINT = "new";

/**
 * The save dialog of a new sequence: "create Runner" (on) creates a Runner named and labelled
 * here; "create Action" (#506) creates an Endpoint action of that name, in the Endpoint chosen
 * here or a new one named here.
 */
function SequenceSaveDialog(props: {
  initialName: string;
  saving: boolean;
  endpoints: EndpointValue[];
  onCancel: () => void;
  onSave: (request: SequenceSaveRequest) => Promise<string | undefined>;
}) {
  const { currentTheme } = useMiroirTheme();
  const [createRunner, setCreateRunner] = useState(true);
  const [createAction, setCreateAction] = useState(false);
  const [name, setName] = useState(props.initialName);
  const [label, setLabel] = useState("");
  const [endpoint, setEndpoint] = useState<string>(props.endpoints[0]?.uuid ?? NEW_ENDPOINT);
  const [endpointName, setEndpointName] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const inputCss = css({
    font: "inherit",
    padding: "4px 8px",
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: "4px",
    color: currentTheme.colors.text,
    background: currentTheme.colors.background,
  });
  const confirm = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(createAction ? "Give the action a name" : "Give the Runner a name");
      return;
    }
    if (createAction && endpoint === NEW_ENDPOINT && endpointName.trim().length === 0) {
      setError("Give the new Endpoint a name");
      return;
    }
    setError(
      await props.onSave({
        createRunner,
        createAction,
        name: trimmed,
        label: label.trim(),
        endpoint: endpoint === NEW_ENDPOINT ? { newName: endpointName.trim() } : { uuid: endpoint },
      }),
    );
  };
  return (
    <ThemedDialog open={true} onClose={props.onCancel} disableEnforceFocus data-testid="sequence-editor-save-dialog" aria-label="Save the sequence">
      <ThemedDialogTitle>Save the sequence</ThemedDialogTitle>
      <ThemedDialogContent>
        <div css={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
          <ThemedLabeledEditor
            labelElement={<ThemedLabel>create Runner</ThemedLabel>}
            editor={
              <ThemedSwitch
                checked={createRunner}
                onChange={(event) => setCreateRunner(event.target.checked)}
                size="small"
                inputProps={{ "data-testid": "sequence-editor-create-runner" } as React.InputHTMLAttributes<HTMLInputElement>}
              />
            }
          />
          <ThemedLabeledEditor
            labelElement={<ThemedLabel>create Action</ThemedLabel>}
            editor={
              <span title={createRunner ? "An Endpoint action, called by the new Runner" : "An Endpoint action, its parameters the form fields"}>
                <ThemedSwitch
                  checked={createAction}
                  onChange={(event) => setCreateAction(event.target.checked)}
                  size="small"
                  inputProps={{ "data-testid": "sequence-editor-create-action" } as React.InputHTMLAttributes<HTMLInputElement>}
                />
              </span>
            }
          />
          <input
            data-testid="sequence-editor-runner-name"
            aria-label={createAction ? "Name of the action" : "Name of the Runner"}
            placeholder="name"
            autoFocus
            value={name}
            disabled={!createRunner && !createAction}
            onChange={(event) => {
              setName(event.target.value);
              setError(undefined);
            }}
            css={inputCss}
          />
          <input
            data-testid="sequence-editor-runner-label"
            aria-label="Label of the Runner"
            placeholder="label (the name when empty)"
            value={label}
            disabled={!createRunner}
            onChange={(event) => setLabel(event.target.value)}
            css={inputCss}
          />
          {createAction && (
            <ThemedLabeledEditor
              labelElement={<ThemedLabel>in the Endpoint</ThemedLabel>}
              editor={
                <span css={css({ display: "inline-flex", gap: "8px" })}>
                  <select
                    data-testid="sequence-editor-endpoint"
                    aria-label="The Endpoint of the action"
                    value={endpoint}
                    onChange={(event) => {
                      setEndpoint(event.target.value);
                      setError(undefined);
                    }}
                    css={inputCss}
                  >
                    {props.endpoints.map((each) => (
                      <option key={each.uuid} value={each.uuid}>
                        {each.name}
                      </option>
                    ))}
                    <option value={NEW_ENDPOINT}>New Endpoint</option>
                  </select>
                  {endpoint === NEW_ENDPOINT && (
                    <input
                      data-testid="sequence-editor-endpoint-name"
                      aria-label="Name of the new Endpoint"
                      placeholder="Endpoint name"
                      value={endpointName}
                      onChange={(event) => {
                        setEndpointName(event.target.value);
                        setError(undefined);
                      }}
                      css={inputCss}
                    />
                  )}
                </span>
              }
            />
          )}
          {error && (
            <span role="alert" data-testid="sequence-editor-save-error" css={css({ color: currentTheme.colors.error ?? "#c62828", fontSize: "13px" })}>
              {error}
            </span>
          )}
        </div>
      </ThemedDialogContent>
      <ThemedDialogActions>
        <ThemedStyledButton type="button" variant="outlined" onClick={props.onCancel} data-testid="sequence-editor-save-cancel">
          Cancel
        </ThemedStyledButton>
        <ThemedStyledButton
          type="button"
          variant="contained"
          disabled={(!createRunner && !createAction) || props.saving}
          onClick={() => void confirm()}
          data-testid="sequence-editor-save-confirm"
        >
          Save
        </ThemedStyledButton>
      </ThemedDialogActions>
    </ThemedDialog>
  );
}
