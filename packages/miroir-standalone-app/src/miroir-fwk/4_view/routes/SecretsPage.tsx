import { useState } from "react";

import { getAuthToken } from "../auth/authSession.js";

export function SecretsPage(): React.JSX.Element {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<"process" | "user">("process");
  const [error, setError] = useState<string | undefined>();
  const [setConfirmation, setSetConfirmation] = useState<string | undefined>();

  return (
    <div style={{ maxWidth: 360, margin: "4rem auto", padding: "1rem" }}>
      <h1>Secrets</h1>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError(undefined);
          setSetConfirmation(undefined);
          try {
            const response = await fetch("/secrets", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({ name, value, scope }),
            });
            const body = await response.json();
            if (!response.ok || !body?.set) {
              setError("Failed to set secret");
              return;
            }
            setValue("");
            setSetConfirmation(name);
          } catch {
            setError("Failed to set secret");
          }
        }}
      >
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          Name
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          Value
          <input
            name="value"
            type="password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          Scope
          <select
            name="scope"
            value={scope}
            onChange={(event) => setScope(event.target.value as "process" | "user")}
            style={{ display: "block", width: "100%" }}
          >
            <option value="process">process</option>
            <option value="user">user</option>
          </select>
        </label>
        {error ? <p role="alert">{error}</p> : null}
        {setConfirmation ? <p role="status">{setConfirmation} set</p> : null}
        <button type="submit">Set secret</button>
      </form>
    </div>
  );
}
