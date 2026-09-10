import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { setAuthToken } from "../auth/authSession.js";

export function LoginPage(): React.JSX.Element {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get("return") || "/?page=home";

  return (
    <div style={{ maxWidth: 360, margin: "4rem auto", padding: "1rem" }}>
      <h1>Sign in</h1>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError(undefined);
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
          }
        }}
      >
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          Username
          <input
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          Password
          <input
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            style={{ display: "block", width: "100%" }}
          />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
