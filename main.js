const { app, BrowserWindow } = require('electron');

// Wayland blocks apps from positioning themselves and staying on top,
// so run under X11 (XWayland) instead.
app.commandLine.appendSwitch('ozone-platform', 'x11');
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);