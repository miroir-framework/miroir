const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
  const config = require('./app.config.json');
  // const zoomFactor = 0.2;
  // const zoomFactor = 1;

  mainWindow = new BrowserWindow({
    width: config.development.windowSize.width,
    height: config.development.windowSize.height,
    // icon: path.join('./miroir-logo.png'), // Specify the path to your icon file
    // icon: path.join(__dirname, 'miroir-logo.png'), // Specify the path to your icon file
    // icon: path.join(__dirname, 'miroir-logo.png'), // Specify the path to your icon file
    webPreferences: {
      nodeIntegration: true,
    },
  });
  // // mainWindow.webContents.on('did-finish-load', () => {
  // mainWindow.webContents.setZoomFactor(zoomFactor);
  // // });

  mainWindow.loadURL(config.development.webAppUrl);

});