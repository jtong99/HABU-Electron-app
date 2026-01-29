# HABU AI GEN PREMIUM (Electron)

Desktop app for Google AI Studio using Electron (full Chromium).

## Why Electron?

Electron uses full Chromium browser engine, which sends all the proper Chrome headers that Google's API expects. This fixes the 403 Forbidden error that occurs with Tauri's WebView2.

## Development

### Run in dev mode
```bash
npm start
```

### Build for Windows
```bash
npm run build:win
```

### Build for macOS
```bash
npm run build:mac
```

### Build for Linux
```bash
npm run build:linux
```

## Output

Built files will be in the `dist` folder:
- Windows: `.exe` installer and portable `.exe`
- macOS: `.dmg`
- Linux: `.AppImage`
