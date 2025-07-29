import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

class MainWindow {
  private mainWindow: BrowserWindow | null = null;
  private isDev: boolean;

  constructor() {
    this.isDev = process.argv.includes('--dev') || !app.isPackaged;
    this.createWindow = this.createWindow.bind(this);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on('ready', this.createWindow);

    // Quit when all windows are closed, except on macOS.
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Handle external links
    app.on('web-contents-created', (event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });
  }

  private createWindow(): void {
    // Create the browser window.
    this.mainWindow = new BrowserWindow({
      height: 1000,
      width: 1400,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
      icon: this.getIconPath(),
      show: false, // Don't show window until ready
      titleBarStyle: 'default',
    });

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        
        // Focus the window if in development
        if (this.isDev) {
          this.mainWindow.webContents.openDevTools();
        }
      }
    });

    // Load the app
    this.loadApp();

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Set up the menu
    this.createMenu();

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private loadApp(): void {
    if (!this.mainWindow) return;

    if (this.isDev) {
      // In development, load from the dev server
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      // In production, load the built files
      const appPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'app', 'index.html')
        : path.join(__dirname, '../../miroir-standalone-app/dist/index.html');
      
      this.mainWindow.loadFile(appPath);
    }
  }

  private getIconPath(): string {
    // Return path to icon file
    const iconPath = path.join(__dirname, '../assets/icon.png');
    return iconPath;
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: async () => {
              await dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'About Miroir Standalone App',
                message: 'Miroir Standalone App',
                detail: 'A desktop application built with Electron and the Miroir Framework.',
              });
            },
          },
        ],
      },
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      });

      // Window menu
      const windowMenu = template.find(menu => menu.label === 'Window');
      if (windowMenu && Array.isArray(windowMenu.submenu)) {
        windowMenu.submenu = [
          { role: 'close' },
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' },
        ];
      }
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
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
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});
