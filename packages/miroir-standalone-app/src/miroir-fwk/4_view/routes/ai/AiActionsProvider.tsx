/**
 * AiActionsProvider
 *
 * Always-mounted component that registers all CopilotKit useCopilotAction hooks
 * and renders a CopilotSidebar whose visibility is controlled by
 * context.showAiSidebar (toggled from the AppBar).
 *
 * The effective deployment UUID is derived from
 *   context.toolsPageState.applicationSelector → context.applicationDeploymentMap
 * so it stays in sync with the ApplicationSelector in the left Sidebar.
 */
import React, { useMemo } from "react";

import { useCopilotAction, useCopilotAdditionalInstructions, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotDevConsole, CopilotSidebar, useChatContext } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "./aiSidebar.css";

import {
  defaultSelfApplicationDeploymentMap,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";
import {
  useDomainControllerService,
  useMiroirContextService,
  useSelector,
  selectInstanceArrayForDeploymentSectionEntity,
  type ReduxStateWithUndoRedo,
  JsonDisplayHelper,
} from "miroir-react";
import { entityEntity, entitySelfApplication, selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { adminSelfApplication, entityDeployment } from "miroir-test-app_deployment-admin";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { MIROIR_SYSTEM_PROMPT } from "./miroirSystemPrompt.js";
import { AiEntityProposalForm, type EntityProposal } from "./AiEntityProposalForm.js";

// ── Selector params (module-level, constant) ──────────────────────────────────
const APPLICATIONS_SELECTOR_PARAMS = {
  queryType: "localCacheEntityInstancesExtractor" as const,
  definition: {
    application: selfApplicationMiroir.uuid,
    applicationSection: "data" as const,
    entityUuid: entitySelfApplication.uuid,
  },
};

const DEPLOYMENTS_SELECTOR_PARAMS = {
  queryType: "localCacheEntityInstancesExtractor" as const,
  definition: {
    application: adminSelfApplication.uuid,
    applicationSection: "data" as const,
    entityUuid: entityDeployment.uuid,
  },
};

const ENTITY_ENTITY_UUID = entityEntity.uuid;

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "AiActionsProvider"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ── Custom sidebar header ─────────────────────────────────────────────────────
// Defined at module level so React never treats it as a new component type on
// re-render.  Excludes the auto-rendered CopilotDevConsole debug button from
// the header; the dev console is instead controlled via the AppBar terminal
// toggle (context.showCopilotDevConsole).
function SidebarHeader(): React.JSX.Element {
  const { setOpen, icons, labels } = useChatContext();
  const miroirContext = useMiroirContextService();
  log.info("Rendering SidebarHeader", "context.showCopilotDevConsole=", miroirContext.showCopilotDevConsole);
  return (
    <div className="copilotKitHeader">
      <div>{labels.title}</div>
      <div className="copilotKitHeaderControls">
        {miroirContext.showCopilotDevConsole && <CopilotDevConsole />}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="copilotKitHeaderCloseButton"
        >
          {icons.headerCloseIcon}
        </button>
      </div>
    </div>
  );
}

// ── Helper hook ───────────────────────────────────────────────────────────────
function useApplyEntityProposal() {
  const domainController = useDomainControllerService();
  const context = useMiroirContextService();

  return async (proposal: EntityProposal) => {
    const deploymentUuid = proposal.deploymentUuid || context.deploymentUuid || "";
    if (!deploymentUuid) {
      log.warn("AiActionsProvider: no deploymentUuid available to apply entity proposal");
      return;
    }
    try {
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
      log.info("AiActionsProvider: entity created successfully:", proposal.entity.name);
    } catch (e) {
      log.error("AiActionsProvider: failed to create entity:", e);
    }
  };
}

// ── AiActionsProvider ─────────────────────────────────────────────────────────
export function AiActionsProvider(): React.JSX.Element {
  const context = useMiroirContextService();
  log.info("Rendering AiActionsProvider", "context.showAiSidebar=", context.showAiSidebar);
  const applyEntityProposal = useApplyEntityProposal();
  const applicationDeploymentMap = context.applicationDeploymentMap ?? {};

  // Derive deployment UUID from the shared ApplicationSelector state
  const effectiveDeploymentUuid = useMemo(() => {
    const appUuid = context.toolsPageState?.applicationSelector;
    if (appUuid && applicationDeploymentMap[appUuid]) {
      return applicationDeploymentMap[appUuid];
    }
    // fallback: context page UUID or first available deployment
    if (context.deploymentUuid) return context.deploymentUuid;
    const entries = Object.values(applicationDeploymentMap).filter(Boolean);
    if (entries.length === 1) return entries[0];
    return "";
  }, [context.toolsPageState?.applicationSelector, applicationDeploymentMap, context.deploymentUuid]);

  // Read all registered SelfApplications and Deployments from the local cache.
  const allApplications = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(state, applicationDeploymentMap, APPLICATIONS_SELECTOR_PARAMS)
  ) ?? [];
  const allDeployments = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(state, applicationDeploymentMap, DEPLOYMENTS_SELECTOR_PARAMS)
  ) ?? [];

  // ── CopilotKit context ──────────────────────────────────────────────────────
  useCopilotAdditionalInstructions({
    instructions: MIROIR_SYSTEM_PROMPT,
  });

  useCopilotReadable({
    description:
      "Currently selected target deployment UUID. Use this for all entity/query creation " +
      "unless the user explicitly requests a different deployment.",
    value: effectiveDeploymentUuid || "(none — the user has not selected a target application yet)",
  });

  // ── generateMiroirEntity ────────────────────────────────────────────────────
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

      const entityUuid = crypto.randomUUID();
      const entityDefUuid = crypto.randomUUID();

      const systemAttrs: Record<string, unknown> = {
        uuid: { type: "uuid", tag: { value: { id: 1, defaultLabel: "UUID" } } },
        parentUuid: { type: "uuid", tag: { value: { id: 2, defaultLabel: "Entity UUID" } } },
        conceptLevel: { type: "string", tag: { value: { id: 3, defaultLabel: "Concept Level" } } },
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
          tag: { value: { id: attrId++, defaultLabel: attr.description ?? attr.name } },
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

  // ── getMiroirContext ────────────────────────────────────────────────────────
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

  // ── lookupApplicationByName ─────────────────────────────────────────────────
  useCopilotAction({
    name: "lookupApplicationByName",
    description:
      "Find a Miroir application UUID from its name (partial, case-insensitive). " +
      "Call this first when you have an application name but not its UUID. " +
      "If status is 'single', use the returned uuid in subsequent calls. " +
      "If status is 'multiple', show the options to the user and ask which one they mean. " +
      "If status is 'not_found', report failure.",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "Application name or partial name to search for",
        required: true,
      },
    ],
    handler: async ({ name }: Record<string, any>) => {
      const needle = (name ?? "").toLowerCase();
      const matches = (allApplications as Array<{ uuid?: string; name?: string }>)
        .filter((app) => (app.name ?? "").toLowerCase().includes(needle));
      if (matches.length === 0) {
        return { status: "not_found", message: `No application matching "${name}" found.` };
      }
      const simplified = matches.map((a) => ({ uuid: a.uuid, name: a.name }));
      if (matches.length === 1) {
        return { status: "single", uuid: matches[0].uuid, name: matches[0].name };
      }
      if (matches.length <= 10) {
        return {
          status: "multiple",
          count: matches.length,
          applications: simplified,
          message: `Found ${matches.length} applications matching "${name}". Please specify which one.`,
        };
      }
      return {
        status: "too_many",
        count: matches.length,
        message: `Too many applications (${matches.length}) matching "${name}". Please be more specific.`,
      };
    },
  });

  // ── lookupDeploymentByApplicationUuid ──────────────────────────────────────
  useCopilotAction({
    name: "lookupDeploymentByApplicationUuid",
    description:
      "Find the deployment UUID(s) for a given application UUID. " +
      "Call this after lookupApplicationByName. " +
      "If status is 'single', use the returned deploymentUuid in subsequent calls. " +
      "If status is 'multiple', show the options to the user.",
    parameters: [
      {
        name: "applicationUuid",
        type: "string",
        description: "Application UUID to look deployments up for",
        required: true,
      },
    ],
    handler: async ({ applicationUuid }: Record<string, any>) => {
      const matches = (
        allDeployments as Array<{ uuid?: string; name?: string; selfApplication?: string }>
      ).filter((d) => d.selfApplication === applicationUuid);
      if (matches.length === 0) {
        return {
          status: "not_found",
          message: `No deployment found for application "${applicationUuid}".`,
        };
      }
      const simplified = matches.map((d) => ({
        uuid: d.uuid,
        name: d.name,
        selfApplication: d.selfApplication,
      }));
      if (matches.length === 1) {
        return { status: "single", deploymentUuid: matches[0].uuid, name: matches[0].name };
      }
      return {
        status: "multiple",
        count: matches.length,
        deployments: simplified,
        message: `Found ${matches.length} deployments for application "${applicationUuid}". Please specify which one.`,
      };
    },
  });

  // ── lookupEntityByName ──────────────────────────────────────────────────────
  useCopilotAction({
    name: "lookupEntityByName",
    description:
      "Find an entity type UUID from its name within an application's model (case-insensitive). " +
      "Call this after lookupDeploymentByApplicationUuid to get the entityUuid for findInstanceByName. " +
      "If status is 'single', use the returned uuid as entityUuid for findInstanceByName.",
    parameters: [
      {
        name: "applicationUuid",
        type: "string",
        description: "Application UUID that owns the entity type",
        required: true,
      },
      {
        name: "deploymentUuid",
        type: "string",
        description: "Deployment UUID of the application",
        required: true,
      },
      {
        name: "entityName",
        type: "string",
        description: "Entity type name or partial name to search for (e.g. 'Book', 'User')",
        required: true,
      },
    ],
    handler: async ({ applicationUuid, deploymentUuid, entityName }: Record<string, any>) => {
      const response = await fetch("/api/copilotkit/findInstanceByName", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityUuid: ENTITY_ENTITY_UUID,
          entityParentName: "Entity",
          namePattern: entityName,
          applicationUuid,
          deploymentUuid,
          applicationSection: "model",
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Request failed" }));
        return { status: "error", message: (err as any).message ?? "Request failed" };
      }
      return response.json();
    },
  });

  // ── findInstanceByName ──────────────────────────────────────────────────────
  useCopilotAction({
    name: "findInstanceByName",
    description:
      "Look up any entity instance by name (partial, case-insensitive). " +
      "Requires applicationUuid, deploymentUuid (from lookupDeploymentByApplicationUuid) " +
      "and entityUuid (from lookupEntityByName). " +
      "If status is 'single', use the returned uuid. " +
      "If status is 'multiple', show options to the user. " +
      "If status is 'not_found' or 'too_many', report the message.",
    parameters: [
      { name: "applicationUuid", type: "string", description: "Application UUID", required: true },
      { name: "deploymentUuid", type: "string", description: "Deployment UUID", required: true },
      {
        name: "entityUuid",
        type: "string",
        description: "UUID of the entity type to search in",
        required: true,
      },
      {
        name: "namePattern",
        type: "string",
        description: "Name or partial name to search for (case-insensitive)",
        required: true,
      },
    ],
    handler: async ({
      applicationUuid,
      deploymentUuid,
      entityUuid,
      namePattern,
    }: Record<string, any>) => {
      const response = await fetch("/api/copilotkit/findInstanceByName", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityUuid,
          namePattern,
          applicationUuid,
          deploymentUuid,
          applicationSection: "data",
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Request failed" }));
        return { status: "error", message: (err as any).message ?? "Request failed" };
      }
      return response.json();
    },
  });

  // ── lendDocument ────────────────────────────────────────────────────────────
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

  // ── getCurrentDate ──────────────────────────────────────────────────────────
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

  // ── getCurrentTimestamp ─────────────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────────────────
  // CopilotSidebar is conditionally rendered so that each time showAiSidebar
  // becomes true it mounts fresh with defaultOpen={true}, avoiding the stuck
  // "closed" internal state that occurs with display:none toggling.
  // clickOutsideToClose={false} prevents the sidebar from auto-closing when
  // the user clicks elsewhere in the application.
  // Chat history is preserved in the CopilotKitProvider context above.
  return (
    <div style={{ zIndex: 9999, position: "relative" }}>
      <JsonDisplayHelper debug={true}
        componentName="AiActionsProvider"
        elements={[
          { label: "context.showAiSidebar", data: context.showAiSidebar },
        ]}
      />
      {context.showAiSidebar && (
        <CopilotSidebar
          defaultOpen={true}
          clickOutsideToClose={false}
          hitEscapeToClose={false}
          onSetOpen={(open) => {
            log.info("CopilotSidebar onSetOpen called with: ", open);
            context.setShowAiSidebar(open);
          }}
          Button={() => null}
          Header={SidebarHeader}
          labels={{
            title: "Miroir AI Assistant",
            initial:
              "Hello! I can help you create Miroir entities, queries, transformers, and reports. What would you like to build?",
          }}
        />
      )}
      {/* CopilotDevConsole is rendered inside SidebarHeader when showCopilotDevConsole=true */}
    </div>
  );
}
