/**
 * #679: the form a Git remote action opens when the remote asks for a token: a username, a token, and
 * whether to save it as the Admin secret `git.<host>` once the action succeeded with it.
 */
import { Box, Button, Checkbox, FormControlLabel, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

export type GitTypedCredential = { username: string; token: string; save: boolean };

export function GitCredentialForm(props: {
  host: string;
  /** The label of the button that runs the action again with the credential. */
  actionLabel: string;
  busy: boolean;
  onSubmit: (credential: GitTypedCredential) => void;
  onCancel: () => void;
}) {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [save, setSave] = useState(true);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }} data-testid="git-credential-form">
      <Typography variant="body2">
        {props.host} asks for a username and a token (a personal access token, not your password).
      </Typography>
      <TextField
        size="small"
        label="Username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        slotProps={{ htmlInput: { "data-testid": "git-credential-username", autoComplete: "username" } }}
      />
      <TextField
        size="small"
        label="Token"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        slotProps={{ htmlInput: { "data-testid": "git-credential-token", autoComplete: "off" } }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={save}
            onChange={(event) => setSave(event.target.checked)}
            slotProps={{ input: { "data-testid": "git-credential-save" } as React.InputHTMLAttributes<HTMLInputElement> }}
          />
        }
        label={`Save it as a Miroir secret for ${props.host}`}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          data-testid="git-credential-retry"
          disabled={props.busy || username.trim() === "" || token === ""}
          onClick={() => {
            props.onSubmit({ username: username.trim(), token, save });
            setToken("");
          }}
        >
          {props.actionLabel}
        </Button>
        <Button size="small" data-testid="git-credential-cancel" onClick={props.onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

/** The notice after a typed token worked: saved as a secret, or why it was not. */
export function savedCredentialNotice(
  host: string,
  saved: { status: "ok"; value: { name: string } } | { status: "error"; error: { errorMessage?: string; reason?: string } } | { status: string },
): string {
  if (saved.status === "ok" && "value" in saved) {
    return `Saved as the secret ${saved.value.name}: the next actions on ${host} use it.`;
  }
  const error = "error" in saved ? saved.error : undefined;
  return `The token worked but was not saved: ${error?.errorMessage ?? error?.reason ?? ""}`;
}
