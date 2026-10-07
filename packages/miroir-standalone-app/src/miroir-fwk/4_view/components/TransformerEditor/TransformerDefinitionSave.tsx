/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import {
  compositeTransformerDefinition,
  getApplicationSection,
  transformerDefinitionParameters,
  type Action2Error,
  type TransactionalInstanceAction,
  type MiroirModelEnvironment,
  type TransformerDefinition,
  type TransformerDefinitionRegistry,
  type Uuid,
} from "miroir-core";
import { useDomainControllerService } from "miroir-react";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { ThemedButton } from "../Themes/index";

// ################################################################################################
// #502 (analysis #497): the TransformerEditor saves the edited transformer as a composite
// TransformerDefinition of the editor application. "Save as TransformerDefinition" creates one,
// named in place, whose parameters are the names the transformer reads free (or the define
// header's, in "defined" mode). "Save" updates the composite edited in "defined" mode with the
// body and the parameters of its define header. The result schema is inferred (#88) either way.
// A model-section change goes through a transaction, which the user commits as any other model
// change.
// ################################################################################################

const CREATE_INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const TRANSACTIONAL_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

type SaveStatus = { status: "saved" | "error"; message: string } | undefined;

export interface TransformerDefinitionSaveProps {
  application: Uuid;
  applicationDeploymentMap: Record<Uuid, Uuid>;
  modelEnvironment: MiroirModelEnvironment;
  transformerDefinitions: TransformerDefinitionRegistry;
  /** The edited transformer, the body of the saved composite. */
  body: unknown;
  /** The composite edited in "defined" mode, with the parameters of its define header. */
  defined?: TransformerDefinition;
}

export function TransformerDefinitionSave(props: TransformerDefinitionSaveProps) {
  const domainController = useDomainControllerService();
  const { currentTheme } = useMiroirTheme();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(undefined);
  const [saving, setSaving] = useState(false);

  const save = async (definition: TransformerDefinition, actionType: "createInstance" | "updateInstance") => {
    const applicationSection = getApplicationSection(props.application, definition.parentUuid);
    const instanceAction = {
      actionType,
      endpoint: CREATE_INSTANCE_ENDPOINT,
      payload: { application: props.application, applicationSection, objects: [definition] },
    } as TransactionalInstanceAction["payload"]["instanceAction"];
    setSaving(true);
    try {
      const result = await domainController.handleActionFromUI(
        applicationSection === "model"
          ? {
              actionType: "transactionalInstanceAction",
              endpoint: TRANSACTIONAL_ENDPOINT,
              payload: { application: props.application, instanceAction },
            }
          : instanceAction,
        props.applicationDeploymentMap,
        props.modelEnvironment,
      );
      if (result.status === "error") {
        const error = result as Action2Error;
        setSaveStatus({
          status: "error",
          message: `${definition.name} was not saved: ${error.errorMessage ?? error.errorType}`,
        });
        return false;
      }
      setSaveStatus({
        status: "saved",
        message: `${definition.name} saved${applicationSection === "model" ? ", to commit with the model" : ""}`,
      });
      return true;
    } catch (error) {
      setSaveStatus({ status: "error", message: `${definition.name} was not saved: ${String(error)}` });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAs = async () => {
    const newName = name.trim();
    if (newName.length === 0) {
      setSaveStatus({ status: "error", message: "Give the TransformerDefinition a name" });
      return;
    }
    if (Object.hasOwn(props.transformerDefinitions, newName)) {
      setSaveStatus({ status: "error", message: `${newName} is already a transformer: choose another name` });
      return;
    }
    const definition = compositeTransformerDefinition({
      uuid: uuidv4(),
      name: newName,
      body: props.body,
      parameters: props.defined ? transformerDefinitionParameters(props.defined) : undefined,
      transformerDefinitions: props.transformerDefinitions,
    });
    if (await save(definition, "createInstance")) {
      setNaming(false);
      setName("");
    }
  };

  const update = async () => {
    const defined = props.defined;
    if (!defined) {
      return;
    }
    const rebuilt = compositeTransformerDefinition({
      uuid: defined.uuid,
      name: defined.name,
      body: props.body,
      parameters: transformerDefinitionParameters(defined),
      transformerDefinitions: props.transformerDefinitions,
    });
    await save(
      {
        ...defined,
        transformerInterface: rebuilt.transformerInterface,
        transformerImplementation: rebuilt.transformerImplementation,
      },
      "updateInstance",
    );
  };

  return (
    <div
      data-testid="transformer-editor-save"
      css={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" })}
    >
      {props.defined && (
        <ThemedButton data-testid="transformer-editor-save-defined" variant="secondary" disabled={saving} onClick={update}>
          {`Save ${props.defined.name}`}
        </ThemedButton>
      )}
      {naming ? (
        <>
          <input
            data-testid="transformer-editor-save-as-name"
            aria-label="Name of the new TransformerDefinition"
            placeholder="name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveAs();
              } else if (event.key === "Escape") {
                setNaming(false);
              }
            }}
            css={css({
              font: "inherit",
              padding: "4px 8px",
              border: `1px solid ${currentTheme.colors.border}`,
              borderRadius: "4px",
              color: currentTheme.colors.text,
              background: currentTheme.colors.background,
            })}
          />
          <ThemedButton data-testid="transformer-editor-save-as-confirm" disabled={saving} onClick={() => void saveAs()}>
            Save
          </ThemedButton>
          <ThemedButton data-testid="transformer-editor-save-as-cancel" variant="secondary" onClick={() => setNaming(false)}>
            Cancel
          </ThemedButton>
        </>
      ) : (
        <ThemedButton data-testid="transformer-editor-save-as" variant="secondary" onClick={() => setNaming(true)}>
          Save as TransformerDefinition
        </ThemedButton>
      )}
      {saveStatus && (
        <span
          role={saveStatus.status === "error" ? "alert" : "status"}
          data-testid="transformer-editor-save-status"
          data-status={saveStatus.status}
          css={css({ fontSize: "13px", color: saveStatus.status === "error" ? (currentTheme.colors.error ?? "#c62828") : currentTheme.colors.text })}
        >
          {saveStatus.message}
        </span>
      )}
    </div>
  );
}
