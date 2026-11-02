// The client: one startup call (startMiroirClient) against this project's server, then Miroir's standard shell.
import "material-symbols/outlined.css";

import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import loglevelnext from "loglevelnext";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import {
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  setRestClientAuthorizationInvalidationHandler,
  setRestClientAuthorizationTokenGetter,
  type LoggerFactoryInterface,
  type MiroirConfigClient,
} from "@miroir-framework/core";
import {
  ErrorPage,
  fetchAuthenticationEnabledOverHttp,
  getAuthToken,
  LocalCacheProvider,
  MiroirContextReactProvider,
  PageDispatcher,
  RootComponent,
  setAuthenticationEnabled,
  setAuthToken,
  startMiroirClient,
  usePageConfiguration,
} from "@miroir-framework/react";

/** Loads the configurations of the open deployments once the shell is mounted. */
function LoadConfigurations(): null {
  usePageConfiguration({ autoFetchOnMount: true, actionName: "startup configuration fetch" });
  return null;
}

/** Served by this project's server, the client calls the origin it was loaded from; under `vite` (dev), the configured URL. */
function clientConfiguration(configured: MiroirConfigClient): MiroirConfigClient {
  if (import.meta.env.DEV || configured.client.emulateServer) {
    return configured;
  }
  return {
    ...configured,
    client: { ...configured.client, serverConfig: { ...configured.client.serverConfig, rootApiUrl: window.location.origin } },
  };
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootComponent />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <PageDispatcher /> },
      { path: "*", element: <PageDispatcher /> },
    ],
  },
]);

async function start(): Promise<void> {
  const activityTracker = new MiroirActivityTracker();
  const eventService = new MiroirEventService(activityTracker);
  MiroirLoggerFactory.startRegisteredLoggers(activityTracker, eventService, loglevelnext as unknown as LoggerFactoryInterface, {
    defaultLevel: "WARN",
    defaultTemplate: "[{{time}}] {{level}} {{name}} ### ",
    specificLoggerOptions: {},
  });

  // authentication (server.authentication in environments/local.json): every request carries the session's token, an
  // expired session is dropped, and with authentication on the shell sends the user to its login page
  setRestClientAuthorizationTokenGetter(() => getAuthToken());
  setRestClientAuthorizationInvalidationHandler(() => setAuthToken(undefined));
  setAuthenticationEnabled(await fetchAuthenticationEnabledOverHttp());

  // the server opens the deployments: the client registers no store
  const { miroirContext, domainController, processCapabilities, localCacheBinding } = await startMiroirClient(
    clientConfiguration(__MIROIR_CLIENT_CONFIG__),
    { stores: [], activityTracker, eventService },
  );

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider theme={createTheme({})}>
        <StyledEngineProvider injectFirst>
          <LocalCacheProvider binding={localCacheBinding} store={domainController.getLocalCache().getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainController}
              processCapabilities={processCapabilities}
            >
              <LoadConfigurations />
              <RouterProvider router={router} />
            </MiroirContextReactProvider>
          </LocalCacheProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

start().catch((error) => {
  console.error("startup failed", error);
  document.getElementById("root")!.innerHTML = `<pre style="color: red; padding: 32px">${String(error)}</pre>`;
});
