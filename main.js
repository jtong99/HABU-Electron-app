const { app, BrowserWindow, session, ipcMain, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const TARGET_URL = 'https://aistudio.google.com/apps/drive/1YVQ9iSXMXaLq5IDCIjLdSK5u0SBwqN7h?fullscreenApplet=true&showPreview=true&showAssistant=true&pli=1';

// Clean Chrome User-Agent (no Electron or app name)
const CHROME_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

// Path to cookies file (place exported cookies here)
const COOKIES_FILE = path.join(__dirname, 'cookies.json');
const WELCOME_FILE = path.join(__dirname, 'welcome.html');

// Check if cookies file exists and has content
function hasSavedCookies() {
    try {
        if (!fs.existsSync(COOKIES_FILE)) return false;
        const data = fs.readFileSync(COOKIES_FILE, 'utf8');
        const cookies = JSON.parse(data);
        return Array.isArray(cookies) && cookies.length > 0;
    } catch {
        return false;
    }
}

// Import cookies from JSON file
async function importCookiesFromFile() {
    try {
        if (!fs.existsSync(COOKIES_FILE)) {
            console.log('No cookies.json file found. Skipping cookie import.');
            return false;
        }

        const cookiesData = fs.readFileSync(COOKIES_FILE, 'utf8');
        const cookies = JSON.parse(cookiesData);

        console.log(`Importing ${cookies.length} cookies...`);

        for (const cookie of cookies) {
            try {
                // Convert cookie format from browser extension to Electron format
                const electronCookie = {
                    url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}${cookie.path || '/'}`,
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path || '/',
                    secure: cookie.secure || false,
                    httpOnly: cookie.httpOnly || false,
                    sameSite: cookie.sameSite || 'no_restriction'
                };

                // Handle expiration
                if (cookie.expirationDate) {
                    electronCookie.expirationDate = cookie.expirationDate;
                }

                await session.defaultSession.cookies.set(electronCookie);
            } catch (err) {
                console.log(`Failed to set cookie ${cookie.name}: ${err.message}`);
            }
        }

        console.log('Cookies imported successfully!');
        return true;
    } catch (error) {
        console.error('Failed to import cookies:', error.message);
        return false;
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: 'HABU AI GEN PREMIUM',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,
    });

    // Disable F1-F12 and Escape keys to prevent issues
    mainWindow.webContents.on('before-input-event', (event, input) => {
        const blockedKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Escape'];
        if (blockedKeys.includes(input.key)) {
            event.preventDefault();
        }
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Open external URLs in default browser
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Inject script to hide fullscreen button and add reload button (only for AI Studio)
    mainWindow.webContents.on('did-finish-load', () => {
        const currentURL = mainWindow.webContents.getURL();
        // Only inject UI buttons on AI Studio, not on welcome page
        if (!currentURL.includes('welcome.html')) {
            mainWindow.webContents.executeJavaScript(`
            (function() {
                const TARGET_URL = '${TARGET_URL}';

                // Hide fullscreen exit button
                function hideFullscreenButton() {
                    const selectors = [
                        'button[aria-label="Leave fullscreen"]',
                        'button[iconname="fullscreen_exit"]',
                        'button[mattooltip="Leave fullscreen"]',
                        '[aria-label="Leave fullscreen"]',
                        '[mattooltip="Leave fullscreen"]'
                    ];

                    selectors.forEach(selector => {
                        document.querySelectorAll(selector).forEach(el => {
                            el.style.setProperty('display', 'none', 'important');
                            el.remove();
                        });
                    });

                    document.querySelectorAll('.material-symbols-outlined').forEach(el => {
                        if (el.textContent && el.textContent.trim() === 'fullscreen_exit') {
                            const btn = el.closest('button');
                            if (btn) btn.remove();
                        }
                    });
                }

                // Auto-dismiss the "untrusted app" dialog
                let dialogDismissed = false;
                function dismissUntrustedDialog() {
                    if (dialogDismissed) return;
                    const dialog = document.getElementById('untrusted-dialog');
                    if (dialog) {
                        const continueBtn = dialog.querySelector('button[type="submit"], button.ms-button-primary');
                        if (continueBtn) {
                            continueBtn.click();
                            dialogDismissed = true;
                            console.log('Auto-dismissed untrusted app dialog');
                        }
                    }
                }

                // Watch for dialog to appear using MutationObserver
                const dialogObserver = new MutationObserver((mutations) => {
                    if (!dialogDismissed) {
                        dismissUntrustedDialog();
                    }
                });
                dialogObserver.observe(document.body || document.documentElement, {
                    childList: true,
                    subtree: true
                });

                // Also check periodically as backup
                const dialogInterval = setInterval(() => {
                    if (dialogDismissed) {
                        clearInterval(dialogInterval);
                        return;
                    }
                    dismissUntrustedDialog();
                }, 200);

                // Create switch account button (goes to cookies page)
                function createSwitchAccountButton() {
                    if (document.getElementById('habu-switch-btn')) return;
                    if (!document.body) return;

                    const btn = document.createElement('button');
                    btn.id = 'habu-switch-btn';
                    btn.textContent = '🔄';
                    btn.title = 'Đổi tài khoản';
                    btn.setAttribute('style', \`
                        position: fixed !important;
                        bottom: 20px !important;
                        right: 20px !important;
                        width: 50px !important;
                        height: 50px !important;
                        border-radius: 50% !important;
                        background: #5f6368 !important;
                        color: white !important;
                        border: none !important;
                        font-size: 20px !important;
                        cursor: pointer !important;
                        z-index: 2147483647 !important;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    \`);
                    btn.onclick = async function() {
                        if (window.habuAPI && window.habuAPI.goToWelcomePage) {
                            await window.habuAPI.goToWelcomePage();
                        }
                    };
                    btn.onmouseover = function() { btn.style.background = '#4a4d50'; };
                    btn.onmouseout = function() { btn.style.background = '#5f6368'; };
                    document.body.appendChild(btn);
                }

                // Inject CSS
                function injectCSS() {
                    if (document.getElementById('hide-fullscreen-css')) return;
                    const style = document.createElement('style');
                    style.id = 'hide-fullscreen-css';
                    style.textContent = \`
                        button[aria-label="Leave fullscreen"],
                        button[iconname="fullscreen_exit"],
                        button[mattooltip="Leave fullscreen"] {
                            display: none !important;
                            visibility: hidden !important;
                        }

                        /* Hide the subheader bar */
                        ms-console-subheader,
                        ms-console-subheader.fullscreen-variant {
                            display: none !important;
                            visibility: hidden !important;
                            height: 0 !important;
                            overflow: hidden !important;
                        }

                        /* Hide the safety info warning */
                        .safety-info-container {
                            display: none !important;
                            visibility: hidden !important;
                            height: 0 !important;
                            overflow: hidden !important;
                        }
                    \`;
                    (document.head || document.documentElement).appendChild(style);
                }

                injectCSS();
                hideFullscreenButton();
                createSwitchAccountButton();

                setInterval(() => {
                    injectCSS();
                    hideFullscreenButton();
                    createSwitchAccountButton();
                }, 500);

                const observer = new MutationObserver(() => {
                    hideFullscreenButton();
                });
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            })();
        `);
        }
    });

    // Load welcome page if no cookies, otherwise load AI Studio
    if (hasSavedCookies()) {
        mainWindow.loadURL(TARGET_URL);
    } else {
        mainWindow.loadFile(WELCOME_FILE);
    }

    // Open DevTools in development
    // mainWindow.webContents.openDevTools();
}

// IPC handler to clear session data and reload
ipcMain.handle('clear-session-and-reload', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
        // Clear all storage data (cookies, localStorage, sessionStorage, indexedDB, etc.)
        await session.defaultSession.clearStorageData();
        // Clear HTTP cache
        await session.defaultSession.clearCache();
        // Delete saved cookies file
        if (fs.existsSync(COOKIES_FILE)) {
            fs.unlinkSync(COOKIES_FILE);
        }
        // Go back to welcome page to paste new cookies
        if (win) {
            win.loadFile(WELCOME_FILE);
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to clear session:', error);
        return { success: false, error: error.message };
    }
});

// IPC handler to import cookies and reload
ipcMain.handle('import-cookies-and-reload', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
        const imported = await importCookiesFromFile();
        if (win) {
            win.loadURL(TARGET_URL);
        }
        return { success: true, imported };
    } catch (error) {
        console.error('Failed to import cookies:', error);
        return { success: false, error: error.message };
    }
});

// IPC handler to paste cookies from clipboard
ipcMain.handle('paste-cookies-from-clipboard', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
        const clipboardText = clipboard.readText();

        if (!clipboardText || clipboardText.trim() === '') {
            return { success: false, error: 'Clipboard empty' };
        }

        // Try to parse as JSON
        let cookies;
        try {
            cookies = JSON.parse(clipboardText);
        } catch (e) {
            return { success: false, error: 'Invalid JSON' };
        }

        if (!Array.isArray(cookies)) {
            return { success: false, error: 'Not an array' };
        }

        // Check if array is empty
        if (cookies.length === 0) {
            return { success: false, error: 'Empty array' };
        }

        // Validate cookie format - each cookie must have domain, name, value
        const isValidFormat = cookies.every(cookie =>
            cookie &&
            typeof cookie === 'object' &&
            typeof cookie.domain === 'string' &&
            typeof cookie.name === 'string' &&
            typeof cookie.value === 'string'
        );

        if (!isValidFormat) {
            return { success: false, error: 'Invalid cookie format' };
        }

        // Check if cookies are from correct domain (google.com or aistudio.google.com)
        const hasGoogleCookies = cookies.some(cookie =>
            cookie.domain.includes('google.com')
        );

        if (!hasGoogleCookies) {
            return { success: false, error: 'Wrong domain' };
        }

        // Save to file for future use
        fs.writeFileSync(COOKIES_FILE, clipboardText, 'utf8');
        console.log(`Saved ${cookies.length} cookies to ${COOKIES_FILE}`);

        // Import the cookies
        for (const cookie of cookies) {
            try {
                const electronCookie = {
                    url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}${cookie.path || '/'}`,
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path || '/',
                    secure: cookie.secure || false,
                    httpOnly: cookie.httpOnly || false,
                    sameSite: cookie.sameSite || 'no_restriction'
                };
                if (cookie.expirationDate) {
                    electronCookie.expirationDate = cookie.expirationDate;
                }
                await session.defaultSession.cookies.set(electronCookie);
            } catch (err) {
                console.log(`Failed to set cookie ${cookie.name}: ${err.message}`);
            }
        }

        console.log('Cookies imported from clipboard successfully!');

        // Navigate to AI Studio
        if (win) {
            win.loadURL(TARGET_URL);
        }

        return { success: true, count: cookies.length };
    } catch (error) {
        console.error('Failed to paste cookies:', error);
        return { success: false, error: error.message };
    }
});

// IPC handler to go to welcome page (for switching account)
ipcMain.handle('go-to-welcome-page', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
        if (win) {
            win.loadFile(WELCOME_FILE);
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to go to welcome page:', error);
        return { success: false, error: error.message };
    }
});

app.whenReady().then(async () => {
    // Override User-Agent to remove Electron and app name from ALL requests
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = CHROME_USER_AGENT;
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    // Import cookies from file if it exists
    await importCookiesFromFile();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
