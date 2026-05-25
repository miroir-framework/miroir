/**
 * AiEntityProposalForm
 *
 * Displays an AI-generated Entity + EntityDefinition proposal for user review.
 * The user may edit fields, then Accept (apply via DomainController) or Reject.
 */
import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface EntityProposal {
  entity: {
    uuid: string;
    parentName: string;
    parentUuid: string;
    parentDefinitionVersionUuid: string;
    conceptLevel: string;
    name: string;
    description?: string;
    [key: string]: unknown;
  };
  entityDefinition: {
    uuid: string;
    parentName: string;
    parentUuid: string;
    parentDefinitionVersionUuid: string;
    name: string;
    entityUuid: string;
    conceptLevel: string;
    jzodSchema: Record<string, unknown>;
    [key: string]: unknown;
  };
  deploymentUuid: string;
  summary: string;
}

export interface AiEntityProposalFormProps {
  proposal: EntityProposal;
  onAccept: (proposal: EntityProposal) => void;
  onReject: () => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export function AiEntityProposalForm({
  proposal,
  onAccept,
  onReject,
}: AiEntityProposalFormProps): React.JSX.Element {
  const [entityName, setEntityName] = useState(proposal.entity.name);
  const [entityDescription, setEntityDescription] = useState(
    proposal.entity.description ?? "",
  );

  // Derive visible custom attributes (exclude system fields)
  const systemFields = new Set([
    "uuid",
    "parentUuid",
    "conceptLevel",
    "parentDefinitionVersionUuid",
  ]);
  const jzodDef =
    (proposal.entityDefinition.jzodSchema as any)?.definition ?? {};
  const customAttributeNames = Object.keys(jzodDef).filter(
    (k) => !systemFields.has(k) && k !== "name",
  );

  const handleAccept = () => {
    const updated: EntityProposal = {
      ...proposal,
      entity: {
        ...proposal.entity,
        name: entityName,
        description: entityDescription || undefined,
      },
      entityDefinition: {
        ...proposal.entityDefinition,
        name: `${entityName}Definition`,
      },
    };
    onAccept(updated);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        AI Entity Proposal
      </Typography>

      {/* Summary */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {proposal.summary}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        {/* Entity Name */}
        <TextField
          label="Name"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          fullWidth
          size="small"
        />

        {/* Entity Description */}
        {customAttributeNames.includes("description") && (
          <TextField
            label="Description"
            value={entityDescription}
            onChange={(e) => setEntityDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
        )}

        {/* Custom attribute labels (read-only preview) */}
        {customAttributeNames
          .filter((a) => a !== "description")
          .map((attrName) => {
            const attrSchema = (jzodDef as any)[attrName];
            const label =
              attrSchema?.tag?.value?.defaultLabel ?? attrName;
            return (
              <Typography key={attrName} variant="body2">
                <strong>{label}</strong>: {attrSchema?.type ?? "string"}
              </Typography>
            );
          })}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="outlined" color="error" onClick={onReject}>
          Reject
        </Button>
        <Button variant="contained" color="primary" onClick={handleAccept}>
          Accept
        </Button>
      </Stack>
    </Box>
  );
}
