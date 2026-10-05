# Miroir Standalone App Electron - Quick Start Guide

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js 16+ installed
- All monorepo dependencies installed

### 2. Install Dependencies
```bash
# From the monorepo root
npm install

# Or from the electron package directory
cd packages/miroir-standalone-app-electron
npm install
```

### 3. Development Workflow

#### Option A: Using the startup scripts (Recommended)

**Windows:**
```cmd
cd packages\miroir-standalone-app-electron
start-dev.bat
```

**Linux/macOS:**
```bash
cd packages/miroir-standalone-app-electron
chmod +x start-dev.sh
./start-dev.sh
```

#### Option B: Manual steps

1. **Start the web app development server:**
   ```bash
   cd packages/miroir-standalone-app
   npm run dev
   ```
   
2. **In a new terminal, start the Electron app:**
   ```bash
   cd packages/miroir-standalone-app-electron
   npm run electron-dev
   ```

### Signing in

Authentication is on by default: the window opens on the login page. In development, sign in with a seed user such as `alice` / `alice-dev` (list in `docs/reference/authentication.md`). To start without login, pass `--disable-auth` or set `MIROIR_AUTH_ENABLED=0`.

### 4. Production Build

1. **Build the web app:**
   ```bash
   cd packages/miroir-standalone-app
   npm run build
   ```

2. **Run the Electron app:**
   ```bash
   cd packages/miroir-standalone-app-electron
   npm run electron
   ```

### 5. Create Distributables

```bash
cd packages/miroir-standalone-app-electron

# Build for current platform
npm run dist

# Build for specific platforms
npm run dist-win    # Windows installer
npm run dist-mac    # macOS DMG
npm run dist-linux  # Linux AppImage
```

## 📁 Project Structure

```
miroir-standalone-app-electron/
├── src/
│   ├── main.ts         # Electron main process
│   └── preload.ts      # Preload script for security
├── assets/
│   └── README.md       # Icon placement instructions
├── dist/               # Compiled JavaScript (generated)
├── release/            # Built distributables (generated)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── app.config.json     # App configuration
├── start-dev.bat       # Windows development script
├── start-dev.sh        # Linux/macOS development script
└── README.md           # Full documentation
```

## 🔧 Key Features

- **Cross-platform**: Windows, macOS, Linux
- **Hot-reloading**: Development mode connects to Vite dev server
- **Security**: Context isolation, no node integration in renderer
- **Single instance**: Prevents multiple app instances
- **Modern APIs**: Uses latest Electron security practices

## 🛠️ Customization

### App Configuration
Edit `app.config.json` to modify:
- Development server URL
- Window dimensions
- Dev tools settings

### Icons
Place your app icons in the `assets/` directory:
- `icon.png` (512x512) for Linux
- `icon.ico` (256x256) for Windows
- `icon.icns` (512x512) for macOS

### Build Settings
Modify `package.json` build configuration to customize:
- Output directory
- Platform-specific settings
- Installer options

## 🔍 Troubleshooting

### Common Issues

1. **"Dev server not running"**
   - Ensure `miroir-standalone-app` dev server is running on port 5173
   - Check if the port is blocked by firewall

2. **Build errors**
   - Run `npm run build` to check TypeScript errors
   - Ensure all dependencies are installed

3. **App won't start**
   - Check if `miroir-standalone-app` is built for production mode
   - Verify all paths in the configuration

### Debug Mode
```bash
# Enable detailed logs
DEBUG=electron* npm run electron-dev
```

## 📝 Development Notes

- The app automatically detects if it's running in development mode
- In development, it connects to the Vite dev server at http://localhost:5173
- In production, it loads the built files from `../miroir-standalone-app/dist/`
- External links automatically open in the system browser
- The app enforces single instance behavior

---

**Need help?** Check the full `README.md` for detailed documentation.
