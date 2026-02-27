import React, { useCallback } from "react";
import {
  LoggerInterface,
  MiroirLoggerFactory,
  transformer_extended_apply_wrapper,
  type ApplicationDeploymentMap,
  type TransformerReturnType,
  type Uuid,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useMiroirContextService } from "miroir-react";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { ThemedStyledButton } from "../Themes/index.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodEditorButton"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

export type JzodEditorButtonConfig = {
  label?: string;
  transformer?: any;
};

type JzodEditorButtonProps = {
  editorButton: JzodEditorButtonConfig;
  currentValue: any;
  rootLessListKey: string;
  currentApplication: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  onApplyResult: (newValue: any) => void;
};

export const JzodEditorButton: React.FC<JzodEditorButtonProps> = ({
  editorButton,
  currentValue,
  rootLessListKey,
  currentApplication,
  applicationDeploymentMap,
  onApplyResult,
}) => {
  const context = useMiroirContextService();
  const currentApplicationModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    applicationDeploymentMap
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const result: TransformerReturnType<any> = transformer_extended_apply_wrapper(
        context.miroirContext.miroirActivityTracker,
        "runtime",
        [],
        editorButton?.label ?? `editorButton@${rootLessListKey || "ROOT"}`,
        editorButton?.transformer,
        currentApplicationModelEnvironment,
        {},
        {
          originTransformer: currentValue,
          originValue: currentValue,
        },
        "value"
      );

      if ((result as any)?.status === "error") {
        log.error("JzodEditorButton transformer error:", (result as any)?.message);
        return;
      }

      onApplyResult(result);
    },
    [
      context.miroirContext.miroirActivityTracker,
      editorButton,
      rootLessListKey,
      currentApplicationModelEnvironment,
      currentValue,
      onApplyResult,
    ]
  );

  if (!editorButton?.transformer || !editorButton?.label) {
    return <></>;
  }

  return (
    <ThemedStyledButton
      variant="outlined"
      size="small"
      type="button"
      onClick={handleClick}
    >
      {editorButton.label}
    </ThemedStyledButton>
  );
};

JzodEditorButton.displayName = "JzodEditorButton";
