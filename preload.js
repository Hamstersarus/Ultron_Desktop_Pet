const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ultronBrain', {
    ask: (question) => ipcRenderer.invoke('ask', question),
    hasKey: () => ipcRenderer.invoke('has-key'),
    saveKey: (key) => ipcRenderer.invoke('save-key', key),
    setFlying: (allowed) => ipcRenderer.send('set-flying', allowed),
});