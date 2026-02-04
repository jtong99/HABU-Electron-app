const { contextBridge, ipcRenderer } = require('electron');

// User API (for main app)
contextBridge.exposeInMainWorld('habuAPI', {
    clearSessionAndReload: () => ipcRenderer.invoke('clear-session-and-reload'),
    importCookiesAndReload: () => ipcRenderer.invoke('import-cookies-and-reload'),
    pasteCookiesFromClipboard: () => ipcRenderer.invoke('paste-cookies-from-clipboard'),
    goToWelcomePage: () => ipcRenderer.invoke('go-to-welcome-page'),
    goToAdminPage: () => ipcRenderer.invoke('go-to-admin-page'),
    // New: Use cookies from Supabase directly
    useSupabaseCookies: () => ipcRenderer.invoke('use-supabase-cookies'),
    // Get active app config
    getActiveAppConfig: () => ipcRenderer.invoke('get-active-app-config')
});

// Admin API (for admin panel)
contextBridge.exposeInMainWorld('adminAPI', {
    // Auth
    verifyAdmin: (username, password) => ipcRenderer.invoke('admin-verify', username, password),

    // Cookies
    getAllCookies: () => ipcRenderer.invoke('admin-get-all-cookies'),
    saveCookies: (cookies, name) => ipcRenderer.invoke('admin-save-cookies', cookies, name),
    deleteCookies: (id) => ipcRenderer.invoke('admin-delete-cookies', id),
    formatExpiration: (expiresAt) => ipcRenderer.invoke('admin-format-expiration', expiresAt),

    // App Config
    getAllAppConfigs: () => ipcRenderer.invoke('admin-get-all-configs'),
    saveAppConfig: (configData) => ipcRenderer.invoke('admin-save-config', configData),
    updateAppConfig: (id, configData) => ipcRenderer.invoke('admin-update-config', id, configData),
    deleteAppConfig: (id) => ipcRenderer.invoke('admin-delete-config', id),

    // Superusers
    getAllSuperusers: () => ipcRenderer.invoke('admin-get-all-users'),
    createSuperuser: (userData) => ipcRenderer.invoke('admin-create-user', userData),
    updateSuperuser: (id, userData) => ipcRenderer.invoke('admin-update-user', id, userData),
    deleteSuperuser: (id) => ipcRenderer.invoke('admin-delete-user', id)
});
