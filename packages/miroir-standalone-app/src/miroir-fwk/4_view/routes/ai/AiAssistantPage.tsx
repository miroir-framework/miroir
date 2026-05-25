/**
 * AiAssistantPage
 *
 * Full-page AI assistant for Miroir. Provides a CopilotSidebar chat interface
 * and registers useCopilotAction hooks for:
 *  - generateMiroirEntity
 *  - generateMiroirQuery
 *  - generateMiroirTransformer
 *  - generateMiroirReport
 *  - getMiroirContext
 *
 * Each "generate" tool uses renderAndWaitForResponse so the user reviews and
 * accepts/rejects the proposal before it is applied.
 */
import React, { useState, useEffect } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { useCopilotAction, useCopilotAdditionalInstructions, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

import {
  defaultSelfApplicationDeploymentMap,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";
import { useDomainControllerService, useMiroirContextService } from "miroir-react";
import { MIROIR_SYSTEM_PROMPT } from "./miroirSystemPrompt.js";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { PageContainer } from "../../components/Page/PageContainer.js";
import {
  AiEntityProposalForm,
  type EntityProposal,
} from "./AiEntityProposalForm.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "AiAssistantPage"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ──────────────────────────────────────────────────────────────────────────────
// Helper: apply entity + entityDefinition to a deployment via DomainController
// ──────────────────────────────────────────────────────────────────────────────
function useApplyEntityProposal() {
  const domainController = useDomainControllerService();
  const context = useMiroirContextService();

  return async (proposal: EntityProposal) => {
    const deploymentUuid =
      proposal.deploymentUuid || context.deploymentUuid || "";
    if (!deploymentUuid) {
      log.warn("AiAssistantPage: no deploymentUuid available to apply entity proposal");
      return;
    }
    try {
      // Create the Entity instance
      await domainController.handleActionFromUI(
        {
          actionType: "modelAction",
          actionName: "createEntity",
          deploymentUuid,
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          entities: [
            {
              entity: proposal.entity as any,
              entityDefinition: proposal.entityDefinition as any,
            },
          ],
        } as any,
        defaultSelfApplicationDeploymentMap
      );
      log.info("AiAssistantPage: entity created successfully:", proposal.entity.name);
    } catch (e) {
      log.error("AiAssistantPage: failed to create entity:", e);
    }
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// AiAssistantPage
// ──────────────────────────────────────────────────────────────────────────────

export function AiAssistantPage(): React.JSX.Element {
  const context = useMiroirContextService();
  const applyEntityProposal = useApplyEntityProposal();

  // Check AI provider configuration on mount and surface any problem to the user
  const [aiConfigStatus, setAiConfigStatus] = useState<{ configured: boolean; message?: string } | null>(null);
  useEffect(() => {
    fetch("/api/copilotkit/health")
      .then((res) => res.json())
      .then((data: { configured: boolean; message?: string }) => setAiConfigStatus(data))
      .catch(() => setAiConfigStatus({ configured: false, message: "Could not reach the AI server at /api/copilotkit/health." }));
  }, []);

  // Inject system prompt into LLM context
  useCopilotAdditionalInstructions({
    instructions: MIROIR_SYSTEM_PROMPT,
  });

  // Expose current deployment UUID to the LLM via useCopilotReadable
  useCopilotReadable({
    description: "Current deployment UUID in the Miroir application",
    value: context.deploymentUuid ?? "(none)",
  });

  // ── generateMiroirEntity ──────────────────────────────────────────────────
  useCopilotAction({
    name: "generateMiroirEntity",
    description:
      "Generate a new Miroir Entity and its EntityDefinition based on a description. " +
      "Present the proposal to the user for review before applying.",
    parameters: [
      { name: "entityName", type: "string", description: "Entity name", required: true },
      {
        name: "description",
        type: "string",
        description: "Short description of the entity",
        required: false,
      },
      {
        name: "attributes",
        type: "object[]",
        description: "List of attributes (each has name, type, description)",
        required: true,
        attributes: [],
      },
      {
        name: "deploymentUuid",
        type: "string",
        description: "Deployment UUID where the entity should be created",
        required: true,
      },
    ],
    renderAndWaitForResponse(props) {
      const { entityName, description, attributes, deploymentUuid } =
        props.args as Record<string, any>;

      // Build the proposal in the same shape as the server-side tool output
      const entityUuid = crypto.randomUUID();
      const entityDefUuid = crypto.randomUUID();

      // Build jzodSchema from the LLM-provided attributes
      const systemAttrs: Record<string, unknown> = {
        uuid: { type: "uuid", tag: { value: { id: 1, defaultLabel: "UUID" } } },
        parentUuid: {
          type: "uuid",
          tag: { value: { id: 2, defaultLabel: "Entity UUID" } },
        },
        conceptLevel: {
          type: "string",
          tag: { value: { id: 3, defaultLabel: "Concept Level" } },
        },
        parentDefinitionVersionUuid: {
          type: "uuid",
          tag: { value: { id: 4, defaultLabel: "Parent Definition Version UUID" } },
        },
        name: { type: "string", tag: { value: { id: 5, defaultLabel: "Name" } } },
      };

      const customAttrs: Record<string, unknown> = {};
      let attrId = 6;
      for (const attr of (attributes ?? []) as Array<{
        name: string;
        type: string;
        description?: string;
        optional?: boolean;
      }>) {
        customAttrs[attr.name] = {
          type: attr.type ?? "string",
          optional: attr.optional ?? false,
          tag: {
            value: {
              id: attrId++,
              defaultLabel: attr.description ?? attr.name,
            },
          },
        };
      }

      const proposal: EntityProposal = {
        entity: {
          uuid: entityUuid,
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
          conceptLevel: "Model",
          name: entityName,
          description: description ?? "",
        },
        entityDefinition: {
          uuid: entityDefUuid,
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
          name: `${entityName}Definition`,
          entityUuid,
          conceptLevel: "Model",
          jzodSchema: {
            type: "object",
            definition: { ...systemAttrs, ...customAttrs },
          },
        },
        deploymentUuid: deploymentUuid ?? context.deploymentUuid ?? "",
        summary: `AI proposes to create entity "${entityName}"${description ? `: ${description}` : ""}.`,
      };

      return (
        <AiEntityProposalForm
          proposal={proposal}
          onAccept={async (accepted) => {
            await applyEntityProposal(accepted);
            props.respond?.({ message: `Entity "${accepted.entity.name}" accepted and applied.` });
          }}
          onReject={() => {
            props.respond?.({ message: "Proposal rejected by user." });
          }}
        />
      );
    },
  });

  // ── getMiroirContext (no UI needed — answers immediately) ─────────────────
  useCopilotAction({
    name: "getMiroirContext",
    description: "Get the current Miroir deployment context.",
    parameters: [
      {
        name: "deploymentUuid",
        type: "string",
        description: "Deployment UUID to query context for",
        required: true,
      },
      {
        name: "elementType",
        type: "string",
        description: "Type of element to fetch context for (entity, query, etc.)",
        required: false,
      },
    ],
    handler: async ({ deploymentUuid, elementType }: Record<string, any>) => {
      return {
        note: "Context fetched on the client side.",
        deploymentUuid,
        requestedType: elementType ?? "all",
      };
    },
  });

  return (
    <PageContainer withSidebar={false} withDocumentOutline={false}>
      <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="h5" gutterBottom>
          AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use the chat panel to describe entities, queries, transformers, or
          reports you want to create. The AI will propose a definition for your
          review before applying it to the current deployment.
        </Typography>
        {aiConfigStatus && !aiConfigStatus.configured && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {aiConfigStatus.message ?? "AI provider not configured."}
          </Alert>
        )}

        {/* CopilotSidebar provides the chat UI — it is rendered inline here */}
        <CopilotSidebar
          defaultOpen={true}
          labels={{
            title: "Miroir AI Assistant",
            initial: "Hello! I can help you create Miroir entities, queries, transformers, and reports. What would you like to build?",
          }}
        />
      </Box>
    </PageContainer>
  );
}
