/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Formik, getIn, useFormikContext } from "formik";
import {
  getApplicationSection,
  newCustomRunner,
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
// a new sequence: "create Runner" creates a Runner of the application, named and labelled there;
// "create Action" (an Endpoint action, #506) is not offered yet. A saved Runner runs below the
// editor, with its form.
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
  const [selected, setSelected] = useState<string>(NEW_SEQUENCE);
  // the edited Runner but its form and sequence, which Formik holds; a new choice remounts the
  // form, which starts a new history
  const [draft, setDraft] = useState<RunnerValue>(() => newSequenceRunner(application));
  const [form, setForm] = useState(() => ({ generation: 0, initialValues: formOf(draft) }));
  const edit = useCallback((uuid: string, runner: RunnerValue) => {
    setSelected(uuid);
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
            onCreated={(runner) => {
              setSelected(runner.uuid);
              setDraft(runner);
            }}
          />
        </BlockActionDefaultsContext.Provider>
      </Formik>
      {selected !== NEW_SEQUENCE && (
        <div data-testid="sequence-editor-run" css={css({ borderTop: `1px solid ${currentTheme.colors.border}`, paddingTop: "8px" })}>
          <StoredRunnerView
            key={selected}
            applicationUuid={application}
            applicationDeploymentMap={applicationDeploymentMap}
            runnerUuid={selected}
          />
        </div>
      )}
    </section>
  );
}

type SaveStatus = { status: "saved" | "error"; message: string } | undefined;

function SequenceEditorForm(
  props: SequenceEditorProps & {
    draft: RunnerValue;
    /** The draft is a stored Runner: "Save <name>" updates it. */
    stored: boolean;
    runnerNames: string[];
    onCreated: (runner: RunnerValue) => void;
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

  const save = async (instance: RunnerValue, actionType: "createInstance" | "updateInstance") => {
    setSaving(true);
    const result = await saveInstanceFromUI(domainController, {
      application,
      applicationDeploymentMap,
      modelEnvironment,
      instance: instance as RunnerValue & { parentUuid: Uuid },
      actionType,
    });
    setSaving(false);
    if (!result.ok) {
      setSaveStatus({ status: "error", message: `${instance.name} was not saved: ${result.error}` });
      return false;
    }
    setSaveStatus({
      status: "saved",
      message: `Runner ${instance.name} saved${result.applicationSection === "model" ? ", to commit with the model" : ""}`,
    });
    return true;
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
          onCancel={() => setDialogOpen(false)}
          onCreateRunner={async (name, label) => {
            const error = await createRunner(name, label);
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

/**
 * The save dialog of a new sequence: "create Runner" (on) creates a Runner named and labelled
 * here; "create Action" (an Endpoint action) comes with #506.
 */
function SequenceSaveDialog(props: {
  initialName: string;
  saving: boolean;
  onCancel: () => void;
  onCreateRunner: (name: string, label: string) => Promise<string | undefined>;
}) {
  const { currentTheme } = useMiroirTheme();
  const [createRunner, setCreateRunner] = useState(true);
  const [name, setName] = useState(props.initialName);
  const [label, setLabel] = useState("");
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
      setError("Give the Runner a name");
      return;
    }
    setError(await props.onCreateRunner(trimmed, label.trim()));
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
              <span title="An Endpoint action from a sequence comes with issue #506">
                <ThemedSwitch
                  checked={false}
                  disabled
                  size="small"
                  inputProps={{ "data-testid": "sequence-editor-create-action" } as React.InputHTMLAttributes<HTMLInputElement>}
                />
              </span>
            }
          />
          <input
            data-testid="sequence-editor-runner-name"
            aria-label="Name of the Runner"
            placeholder="name"
            autoFocus
            value={name}
            disabled={!createRunner}
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
          disabled={!createRunner || props.saving}
          onClick={() => void confirm()}
          data-testid="sequence-editor-save-confirm"
        >
          Save
        </ThemedStyledButton>
      </ThemedDialogActions>
    </ThemedDialog>
  );
}
