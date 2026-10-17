const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ultronBrain', {
    ask: (question) => ipcRenderer.invoke('ask', question),
});