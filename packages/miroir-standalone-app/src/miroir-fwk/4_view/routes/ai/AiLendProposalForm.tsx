/**
 * AiLendProposalForm
 *
 * Displays a proposed library lend for user review. Accept posts via the
 * caller; Reject responds without posting.
 */
import React from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";

export interface LendProposal {
  user: string;
  book: string;
  startDate: string;
  note?: string;
}

export interface AiLendProposalFormProps {
  proposal: LendProposal;
  onAccept: (proposal: LendProposal) => void;
  onReject: () => void;
}

export function AiLendProposalForm({
  proposal,
  onAccept,
  onReject,
}: AiLendProposalFormProps): React.JSX.Element {
  return (
    <Box sx={{ p: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        AI Lend Proposal
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {`Lend book ${proposal.book} to user ${proposal.user} starting ${proposal.startDate}.`}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={1}>
        <Typography variant="body2">
          <strong>User</strong>: {proposal.user}
        </Typography>
        <Typography variant="body2">
          <strong>Book</strong>: {proposal.book}
        </Typography>
        <Typography variant="body2">
          <strong>Start date</strong>: {proposal.startDate}
        </Typography>
        {proposal.note ? (
          <Typography variant="body2">
            <strong>Note</strong>: {proposal.note}
          </Typography>
        ) : null}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="outlined" color="error" onClick={onReject}>
          Reject
        </Button>
        <Button variant="contained" color="primary" onClick={() => onAccept(proposal)}>
          Accept
        </Button>
      </Stack>
    </Box>
  );
}
