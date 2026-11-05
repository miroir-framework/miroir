/**
 * #691: the history of the Git page, folded to its last commit under the active tab. Unfolding it shows
 * the commit list in place, and the strip keeps only its toggle, so that a commit is shown once.
 */
import { Box, Button, Chip, Typography } from "@mui/material";
import React from "react";

import type { GitCommitSummary } from "@miroir-framework/core";

export function GitHistoryStrip(props: {
  /** Undefined while the history loads. */
  commits: GitCommitSummary[] | undefined;
  unfolded: boolean;
  onToggle: () => void;
}) {
  const last = props.commits?.[0];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }} data-testid="git-history-strip">
      <Button size="small" data-testid="git-history-toggle" onClick={props.onToggle}>
        {props.unfolded ? "Hide the history" : `Show the history${props.commits ? ` (${props.commits.length})` : ""}`}
      </Button>
      {!props.unfolded && props.commits && !last && <Typography variant="body2">No commit yet.</Typography>}
      {!props.unfolded && last && (
        <>
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
            {last.oid.slice(0, 7)}
          </Typography>
          <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
            {last.message.split("\n")[0]}
          </Typography>
          <Typography variant="caption" noWrap sx={{ opacity: 0.6 }}>
            {last.author.name}, {new Date(last.author.timestamp * 1000).toLocaleString()}
          </Typography>
          {last.refs.map((ref) => (
            <Chip key={ref} size="small" variant="outlined" label={ref} />
          ))}
        </>
      )}
    </Box>
  );
}
