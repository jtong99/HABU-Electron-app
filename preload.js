const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('habuAPI', {
    clearSessionAndReload: () => ipcRenderer.invoke('clear-session-and-reload'),
    importCookiesAndReload: () => ipcRenderer.invoke('import-cookies-and-reload'),
    pasteCookiesFromClipboard: () => ipcRenderer.invoke('paste-cookies-from-clipboard'),
    goToWelcomePage: () => ipcRenderer.invoke('go-to-welcome-page')
});
