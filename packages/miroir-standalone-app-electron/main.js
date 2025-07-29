const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
  const config = require('./app.config.json');
  // const zoomFactor = 0.2;
  // const zoomFactor = 1;

  mainWindow = new BrowserWindow({
    width: config.development.windowSize.width,
    height: config.development.windowSize.height,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  // // mainWindow.webContents.on('did-finish-load', () => {
  // mainWindow.webContents.setZoomFactor(zoomFactor);
  // // });

  mainWindow.loadURL(config.development.webAppUrl);

});