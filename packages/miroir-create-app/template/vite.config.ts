// The client of this project: built into dist/, which the server serves. Its Miroir configuration comes from the
// environment the server also reads (environments/local.json), injected as __MIROIR_CLIENT_CONFIG__.
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { environmentRealServerClientConfig, resolveEnvironmentFromFiles } from "@miroir-framework/env";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(() => {
  // no process.env in the call: database passwords must never reach the browser
  const environment = resolveEnvironmentFromFiles({ cwd: projectRoot, env: { MIROIR_ROOT: projectRoot, MIROIR_ENV: process.env.MIROIR_ENV } });
  const clientConfig = environmentRealServerClientConfig(environment);
  // `npm run dev:client`: the page's origin is Vite's, so Miroir's routes go to the running server
  const server = clientConfig.client.emulateServer ? undefined : clientConfig.client.serverConfig.rootApiUrl;
  const proxy = Object.fromEntries(
    ["/CRUD", "/query", "/queryTemplate", "/action", "/auth", "/capabilities", "/mcp"].map((route) => [route, { target: server }]),
  );
  return {
    server: { proxy },
    root: "src/client",
    build: { outDir: "../../dist", emptyOutDir: true, target: "esnext" },
    define: { __MIROIR_CLIENT_CONFIG__: JSON.stringify(clientConfig) },
    resolve: { dedupe: ["react", "react-dom", "@emotion/react", "@emotion/styled", "@mui/material"] },
    plugins: [
      nodePolyfills({ include: ["crypto"], exclude: ["process"] }),
      react({ jsxImportSource: "@emotion/react", include: /\.(t|j)sx$/ }),
      babel({ include: /\.(t|j)sx$/, plugins: ["@emotion/babel-plugin"] }),
    ],
  };
});
