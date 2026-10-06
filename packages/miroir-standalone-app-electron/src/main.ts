import { app, BrowserWindow, Menu, shell, ipcMain, dialog, protocol, net } from "electron";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath, URL } from "url";
import { createRequire } from "module";
import { log } from "console";

// Not `__filename` / `__dirname`: the esbuild bundle (scripts/bundle-main.mjs) declares those for
// the CommonJS code it bundles.
const mainFilename = fileURLToPath(import.meta.url);
const mainDirname = path.dirname(mainFilename);
// Store factories and domain-controller setup are handled inside the IPC server.
// The renderer process cannot reach Node.js / filesystem APIs, so all persistence
// operations are forwarded from the renderer to this main process through IPC.
import { setupIpcServer } from "./ipcServerSetup.js";
import {
  parseSelfTestArgs,
  rendererLoadUrl,
  SELF_TEST_RESULT_CHANNEL,
  selfTestExit,
  type ElectronSelfTestEnd,
  type ElectronSelfTestOptions,
} from "./selfTestMain.js";

// #487: `--self-test` runs the renderer's self-test in a hidden window, prints the report and exits.
let selfTest: ElectronSelfTestOptions | undefined;
try {
  selfTest = parseSelfTestArgs(process.argv);
} catch (error) {
  process.stderr.write(`${String(error)}\n`);
  process.exit(2);
}

// Resolve TLS certificate paths (same defaults as miroir-server and vite.config.js).
// mkcert-generated certs are placed in <repo-root>/certs/ by scripts/setup-https.sh(.ps1).
const _defaultCertsDir = path.resolve(mainDirname, '../../../certs');
const _certFile = process.env.MIROIR_TLS_CERT ?? path.join(_defaultCertsDir, 'localhost.pem');
const _keyFile  = process.env.MIROIR_TLS_KEY  ?? path.join(_defaultCertsDir, 'localhost-key.pem');
const _certsReady = fs.existsSync(_certFile) && fs.existsSync(_keyFile);
const _devServerScheme = _certsReady ? 'https' : 'http';

// Register custom scheme BEFORE app is ready (required by Electron)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
const _require = createRequire(import.meta.url);
if (_require("electron-squirrel-startup")) {
  app.quit();
}

class MainWindow {
  private mainWindow: BrowserWindow | null = null;
  private isDev: boolean;
  private selfTestEnded = false;

  constructor() {
    this.isDev = process.argv.includes("--dev") || !app.isPackaged;
    this.createWindow = this.createWindow.bind(this);
    this.setupEventHandlers();
  }

  private getAppDistPath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, "app")
      : path.join(mainDirname, "../../miroir-standalone-app/dist");
  }

  private setupEventHandlers(): void {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on("ready", () => {
      // Register the app:// protocol to serve production build files.
      // This avoids the broken asset paths and BrowserRouter issues that
      // occur when loading directly from file:// URLs (Vite default base='/').
      protocol.handle("app", (request) => {
        const url = new URL(request.url);
        const appDir = this.getAppDistPath();
        let filePath = path.join(appDir, url.pathname);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          // For files with an extension (assets, CSS, JS) that don't exist,
          // return 404 so the browser reports a clean missing-resource error.
          // For extensionless paths (SPA routes like /home, /report/...) fall
          // back to index.html so React Router handles the routing.
          const hasExtension = path.extname(url.pathname).length > 0;
          if (hasExtension) {
            return new Response(null, { status: 404 });
          }
          filePath = path.join(appDir, "index.html");
        }
        return net.fetch(`file://${filePath.replace(/\\/g, "/")}`);
      });
      this.createWindow();
    });

    // Quit when all windows are closed, except on macOS.
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("activate", () => {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Handle external links
    app.on("web-contents-created", (event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
      });
    });
  }

  private createWindow(): void {
    // Create the browser window.
    this.mainWindow = new BrowserWindow({
      height: 1000,
      width: 1400,
      // icon: path.join(__dirname, 'miroir-logo.png'), // Specify the path to your icon file
      backgroundColor: '#fff',
      icon: this.getIconPath(),
      webPreferences: {
        preload: path.join(mainDirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
      show: false, // Don't show window until ready
      titleBarStyle: "default",
    });
    if (selfTest) {
      this.mainWindow.webContents.setBackgroundThrottling(false);
      this.watchSelfTest(selfTest);
    }

    // Show window when ready to prevent visual flash
    this.mainWindow.once("ready-to-show", () => {
      if (this.mainWindow && !selfTest) {
        this.mainWindow.show();

        // Focus the window if in development
        if (this.isDev) {
          this.mainWindow.webContents.openDevTools();
        }
      }
    });

    // Load the app (async: awaits IPC server setup before loading the URL)
    void this.loadApp();

    // Handle window closed
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    // Set up the menu
    this.createMenu();

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  }

  private async loadApp(): Promise<void> {
    if (!this.mainWindow) return;

    // Initialise store factories + domain controller in the main process and register the IPC
    // handler BEFORE loading the renderer URL.  The renderer will call back via IPC once it
    // starts initialising Miroir (store-management and persistence actions).
    try {
      await setupIpcServer(selfTest);
    } catch (error) {
      if (!selfTest) {
        throw error;
      }
      this.endSelfTest({ kind: "main-error", error: String(error) });
      return;
    }
    log("Starting miroir standalone app - IPC server ready");

    // Development: the Vite dev server, over HTTPS when certs are available (generated by
    // scripts/setup-https.sh/.ps1), else HTTP. Production and self-test: the custom app://
    // protocol, so absolute asset paths (/assets/...) resolve and React Router starts at /home.
    this.mainWindow.loadURL(rendererLoadUrl({ isDev: this.isDev, selfTest: !!selfTest, devServerScheme: _devServerScheme }));
  }

  /** #487: ends the process on the renderer's result, a timeout, or a renderer that cannot run. */
  private watchSelfTest(options: ElectronSelfTestOptions): void {
    const webContents = this.mainWindow!.webContents;
    ipcMain.once(SELF_TEST_RESULT_CHANNEL, (_event, result) => this.endSelfTest({ kind: "result", result }));
    setTimeout(() => this.endSelfTest({ kind: "timeout" }), options.timeoutSeconds * 1000);
    webContents.on("render-process-gone", (_event, details) =>
      this.endSelfTest({ kind: "render-process-gone", reason: details.reason }),
    );
    webContents.on("did-fail-load", (_event, _errorCode, errorDescription, _url, isMainFrame) => {
      if (isMainFrame) {
        this.endSelfTest({ kind: "did-fail-load", errorDescription });
      }
    });
  }

  private endSelfTest(end: ElectronSelfTestEnd): void {
    if (this.selfTestEnded) {
      return;
    }
    this.selfTestEnded = true;
    const { exitCode, report } = selfTestExit(end);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    app.exit(exitCode);
  }

  private getIconPath(): string {
    // Return path to icon file
    // const iconPath = path.join(__dirname, "../assets/miroir-logo.png");
    const iconPath = path.join(mainDirname, "./resources/app/assets/miroir-logo-4ec98748.png");
    return iconPath;
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: "File",
        submenu: [
          {
            label: "Quit",
            accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Window",
        submenu: [{ role: "minimize" }, { role: "close" }],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "About",
            click: async () => {
              await dialog.showMessageBox(this.mainWindow!, {
                type: "info",
                title: "About Miroir Standalone App",
                message: "Miroir Standalone App",
                detail: "A desktop application built with Electron and the Miroir Framework.",
              });
            },
          },
        ],
      },
    ];

    // macOS specific menu adjustments
    if (process.platform === "darwin") {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      });

      // Window menu
      const windowMenu = template.find((menu) => menu.label === "Window");
      if (windowMenu && Array.isArray(windowMenu.submenu)) {
        windowMenu.submenu = [
          { role: "close" },
          { role: "minimize" },
          { role: "zoom" },
          { type: "separator" },
          { role: "front" },
        ];
      }
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// Prevent multiple instances; a self-test runs beside a running app.
const gotTheLock = selfTest ? true : app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, focus our window instead
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Create main application window
  new MainWindow();
}

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
});
