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
import React, { useState, useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
// import ExpandLessIcon from "@mui/icons-material/ExpandLess";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { ExpandLessIcon, ExpandMoreIcon } from "../../components/Themes/MaterialSymbolWrappers.js";

// ──────────────────────────────────────────────────────────────────────────────
// Tool catalog — kept in sync with the useCopilotAction registrations below.
// Displayed in the AgentToolsPanel component.
// ──────────────────────────────────────────────────────────────────────────────
type ToolCategory = "miroir" | "library" | "utility";
interface AgentToolEntry {
  name: string;
  description: string;
  category: ToolCategory;
}

const AGENT_TOOLS: AgentToolEntry[] = [
  {
    name: "generateMiroirEntity",
    description: "Generate a new Miroir Entity and EntityDefinition from a description. Presents a proposal for review before applying.",
    category: "miroir",
  },
  {
    name: "getMiroirContext",
    description: "Return the current Miroir deployment context (deployment UUID, available entity types, etc.).",
    category: "miroir",
  },
  {
    name: "findLibraryInstanceByName",
    description: "Look up a library entity (book, user, author, publisher) by name. Returns the UUID when exactly one match is found, presents choices for 2–10 results, errors otherwise.",
    category: "library",
  },
  {
    name: "lendDocument",
    description: "Lend a library document (book) to a user. Requires user UUID, book UUID, and a start date.",
    category: "library",
  },
  {
    name: "getCurrentDate",
    description: "Return today's date as an ISO date string (YYYY-MM-DD). Use before any action that needs a date.",
    category: "utility",
  },
  {
    name: "getCurrentTimestamp",
    description: "Return the current date-time as a full ISO 8601 timestamp string.",
    category: "utility",
  },
];

const CATEGORY_COLOR: Record<ToolCategory, "primary" | "secondary" | "default"> = {
  miroir: "primary",
  library: "secondary",
  utility: "default",
};

const CATEGORY_LABEL: Record<ToolCategory, string> = {
  miroir: "Miroir",
  library: "Library",
  utility: "Utility",
};

// ──────────────────────────────────────────────────────────────────────────────
// AgentToolsPanel — displays the registered tools in a collapsible themed card
// ──────────────────────────────────────────────────────────────────────────────
function AgentToolsPanel(): React.JSX.Element {
  const [open, setOpen] = useState(true);

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: "hidden",
        borderColor: "primary.main",
        opacity: 0.92,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.75,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
          Agent tools ({AGENT_TOOLS.length})
        </Typography>
        <IconButton size="small" sx={{ color: "inherit", p: 0 }}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Tool chips */}
      <Collapse in={open}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            p: 1.5,
            bgcolor: "background.paper",
          }}
        >
          {AGENT_TOOLS.map((tool) => (
            <Tooltip
              key={tool.name}
              title={
                <Box sx={{ maxWidth: 280 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="caption">{tool.description}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, opacity: 0.8, fontStyle: "italic" }}
                  >
                    category: {CATEGORY_LABEL[tool.category]}
                  </Typography>
                </Box>
              }
              placement="top"
              arrow
            >
              <Chip
                label={tool.name}
                color={CATEGORY_COLOR[tool.category]}
                size="small"
                variant="outlined"
                sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
              />
            </Tooltip>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}

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

  // ── Deployment selection ────────────────────────────────────────────────────
  // Compute available deployment options from the application deployment map.
  // Entries: appUuid → deploymentUuid.  We show the deploymentUuid as the value
  // and a short label "App <appUuid truncated>".
  const deploymentOptions = useMemo((): { value: string; label: string }[] => {
    const map = context.applicationDeploymentMap ?? {};
    return Object.entries(map)
      .filter(([, depUuid]) => Boolean(depUuid))
      .map(([appUuid, depUuid]) => ({
        value: depUuid,
        label: `${appUuid.slice(0, 8)}…  →  deploy ${depUuid.slice(0, 8)}…`,
      }));
  }, [context.applicationDeploymentMap]);

  // User-selected deployment UUID (empty = not yet chosen)
  const [selectedDeploymentUuid, setSelectedDeploymentUuid] = useState<string>("");

  // Effective deployment UUID: explicit selection → context page UUID → single available option
  const effectiveDeploymentUuid = useMemo(() => {
    if (selectedDeploymentUuid) return selectedDeploymentUuid;
    if (context.deploymentUuid) return context.deploymentUuid;
    if (deploymentOptions.length === 1) return deploymentOptions[0].value;
    return "";
  }, [selectedDeploymentUuid, context.deploymentUuid, deploymentOptions]);

  // Inject system prompt into LLM context
  useCopilotAdditionalInstructions({
    instructions: MIROIR_SYSTEM_PROMPT,
  });

  // Expose current deployment UUID to the LLM via useCopilotReadable
  useCopilotReadable({
    description:
      "Currently selected target deployment UUID. Use this for all entity/query creation " +
      "unless the user explicitly requests a different deployment.",
    value: effectiveDeploymentUuid || "(none — the user has not selected a target application yet)",
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
        deploymentUuid: deploymentUuid ?? effectiveDeploymentUuid ?? "",
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

  // ── findLibraryInstanceByName ─────────────────────────────────────────────
  // Looks up a library entity (book, user, author, publisher) by (partial) name.
  // Calls /api/copilotkit/findInstanceByName, which runs a filtered query via the
  // server-side domainController.
  //
  // Return shapes (pass through to the LLM):
  //   { status: "not_found", message }                         — 0 matches
  //   { status: "single",    uuid, name, instance }            — 1 match → use uuid
  //   { status: "multiple",  count, instances, message }       — 2–10 → ask user to pick
  //   { status: "too_many",  count, message }                  — >10 → ask for more specific name
  //   { status: "error",     message }                         — error
  useCopilotAction({
    name: "findLibraryInstanceByName",
    description:
      "Look up a library entity by name (partial, case-insensitive). " +
      "Use this BEFORE calling lendDocument whenever you have a book title or a user name " +
      "instead of a UUID. " +
      "If status is 'single', use the returned uuid directly. " +
      "If status is 'multiple', show the options to the user and ask which one they mean, " +
      "then call findLibraryInstanceByName again with the exact name. " +
      "If status is 'not_found' or 'too_many', report the message to the user.",
    parameters: [
      {
        name: "entityType",
        type: "string",
        description:
          'Type of library entity to search: "book" (also called document), "user", "author", or "publisher"',
        required: true,
      },
      {
        name: "name",
        type: "string",
        description: "Name or partial name to search for (case-insensitive substring match)",
        required: true,
      },
    ],
    handler: async ({ entityType, name }: Record<string, any>) => {
      // Map human-readable entity types to their library entity UUIDs.
      const LIBRARY_APP_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
      const LIBRARY_DEPLOYMENT_UUID = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
      const entityTypeMap: Record<string, { entityUuid: string; entityParentName: string }> = {
        book:      { entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5", entityParentName: "Book" },
        document:  { entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5", entityParentName: "Book" },
        user:      { entityUuid: "ca794e28-b2dc-45b3-8137-00151557eea8", entityParentName: "User" },
        author:    { entityUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733", entityParentName: "Author" },
        publisher: { entityUuid: "a027c379-8468-43a5-ba4d-bf618be25cab", entityParentName: "Publisher" },
      };

      const typeInfo = entityTypeMap[(entityType ?? "").toLowerCase()];
      if (!typeInfo) {
        return {
          status: "error",
          message: `Unknown entity type "${entityType}". Supported values: book, user, author, publisher.`,
        };
      }

      const response = await fetch("/api/copilotkit/findInstanceByName", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityUuid: typeInfo.entityUuid,
          entityParentName: typeInfo.entityParentName,
          namePattern: name,
          applicationUuid: LIBRARY_APP_UUID,
          deploymentUuid: LIBRARY_DEPLOYMENT_UUID,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Request failed" }));
        return { status: "error", message: (err as any).message ?? "Request failed" };
      }
      return response.json();
    },
  });

  // ── lendDocument ──────────────────────────────────────────────────────────
  // CopilotKit in agent/run mode forwards all LLM tool calls to the frontend.
  // This handler calls the /api/copilotkit/lendDocument REST endpoint which uses
  // the server-side domainController to perform the actual domain action.
  useCopilotAction({
    name: "lendDocument",
    description: "Lend a library document (book) to a user.",
    parameters: [
      {
        name: "user",
        type: "string",
        description: "UUID of the user borrowing the document",
        required: true,
      },
      {
        name: "book",
        type: "string",
        description: "UUID of the book/document to lend",
        required: true,
      },
      {
        name: "startDate",
        type: "string",
        description: "Start date of the loan (ISO date string, e.g. '2024-01-15')",
        required: true,
      },
      {
        name: "note",
        type: "string",
        description: "Optional note about the loan",
        required: false,
      },
    ],
    handler: async ({ user, book, startDate, note }: Record<string, any>) => {
      const response = await fetch("/api/copilotkit/lendDocument", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, book, startDate, note }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Request failed" }));
        return { status: "error", message: (err as any).message ?? "Request failed" };
      }
      return response.json();
    },
  });

  // ── getCurrentDate ────────────────────────────────────────────────────────
  // Mirrors the miroir `currentDate` transformer: returns the current date as
  // an ISO date string (YYYY-MM-DD). Use this whenever the user says "today".
  useCopilotAction({
    name: "getCurrentDate",
    description:
      "Return today's date as an ISO date string (YYYY-MM-DD, e.g. '2026-05-28'). " +
      "Use this to get the real current date before calling lendDocument or any other " +
      "action that needs a date — do NOT guess or invent a date.",
    parameters: [],
    handler: async () => {
      return { date: new Date().toISOString().split("T")[0] };
    },
  });

  // ── getCurrentTimestamp ───────────────────────────────────────────────────
  // Mirrors the miroir `currentTimestamp` transformer: returns the current
  // date-time as a full ISO 8601 timestamp string.
  useCopilotAction({
    name: "getCurrentTimestamp",
    description:
      "Return the current date and time as a full ISO 8601 timestamp string " +
      "(e.g. '2026-05-28T14:32:10.123Z'). Use this when a precise timestamp is needed.",
    parameters: [],
    handler: async () => {
      return { timestamp: new Date().toISOString() };
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

        {/* Agent tools panel */}
        <AgentToolsPanel />

        {/* Deployment selector — must pick a target before the AI can create elements */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 420 }}>
            <InputLabel id="ai-deployment-select-label">Target deployment</InputLabel>
            <Select
              labelId="ai-deployment-select-label"
              value={effectiveDeploymentUuid}
              label="Target deployment"
              onChange={(e) => setSelectedDeploymentUuid(e.target.value as string)}
              displayEmpty
            >
              {deploymentOptions.length === 0 && (
                <MenuItem value="" disabled>
                  No deployments loaded — navigate to an application first
                </MenuItem>
              )}
              {deploymentOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!effectiveDeploymentUuid && (
            <Typography variant="body2" color="warning.main">
              Select a target deployment before asking the AI to create elements.
            </Typography>
          )}
        </Box>

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
