const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ultronBrain', {
    ask: (question) => ipcRenderer.invoke('ask', question),
    hasKey: () => ipcRenderer.invoke('has-key'),
    saveKey: (key) => ipcRenderer.invoke('save-key', key),
    setFlying: (allowed) => ipcRenderer.send('set-flying', allowed),
    getSprites: () => ipcRenderer.invoke('get-sprites'),
    onCharacterChanged: (callback) => ipcRenderer.on('character-changed', () => callback()),
    getCharacterName: () => ipcRenderer.invoke('get-character-name'),

});