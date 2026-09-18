import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { setAuthToken } from "../auth/authSession.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import {
  ThemedBox,
  ThemedButton,
  ThemedCard,
  ThemedEditableInput,
  ThemedFlexColumn,
  ThemedLabel,
  ThemedSpan,
  ThemedStackedLabeledEditor,
  ThemedTitle,
} from "../components/Themes/index.js";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";

export function LoginPage(): React.JSX.Element {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTheme } = useMiroirTheme();
  const returnTo = searchParams.get("return") || "/?page=home";

  const fullWidthInputStyle = { width: "100%", boxSizing: "border-box" as const };

  return (
    <PageContainer withSidebar={false} withDocumentOutline={false}>
      <ThemedBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
        padding={currentTheme.spacing.lg}
      >
        <ThemedCard style={{ maxWidth: 360, width: "100%" }}>
          <ThemedTitle>Sign in</ThemedTitle>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError(undefined);
              setSubmitting(true);
              try {
                const response = await fetch("/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username, password }),
                });
                const body = await response.json();
                if (!response.ok || !body?.token) {
                  setError("Authentication failed");
                  return;
                }
                setAuthToken(body.token);
                navigate(returnTo);
              } catch {
                setError("Authentication failed");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <ThemedFlexColumn gap={currentTheme.spacing.md} style={{ width: "100%", marginTop: currentTheme.spacing.md }}>
              <ThemedStackedLabeledEditor
                style={{ width: "100%" }}
                labelElement={<ThemedLabel>Username</ThemedLabel>}
                editor={
                  <ThemedEditableInput
                    name="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    dynamicWidth={false}
                    style={fullWidthInputStyle}
                  />
                }
              />
              <ThemedStackedLabeledEditor
                style={{ width: "100%" }}
                labelElement={<ThemedLabel>Password</ThemedLabel>}
                editor={
                  <ThemedEditableInput
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    dynamicWidth={false}
                    style={fullWidthInputStyle}
                  />
                }
              />
              {error ? (
                <ThemedSpan role="alert" color={currentTheme.colors.error}>
                  {error}
                </ThemedSpan>
              ) : null}
              <ThemedButton type="submit" loading={submitting} disabled={submitting}>
                Sign in
              </ThemedButton>
            </ThemedFlexColumn>
          </form>
        </ThemedCard>
      </ThemedBox>
    </PageContainer>
  );
}
