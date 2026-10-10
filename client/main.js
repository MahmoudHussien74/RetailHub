const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');

// Ignore self-signed certificates on localhost (ASP.NET dev certificate)
app.commandLine.appendSwitch('ignore-certificate-errors');

let mainWindow = null;
let splashWindow = null;
let apiProcess = null;
let isSpawningBackend = false;

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const API_PORT = 5150;
const HEALTH_URL = `http://127.0.0.1:${API_PORT}/api/health`;

/**
 * Pings the API health endpoint to check readiness.
 */
function pingHealth(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Creates the sleek loading / splash window.
 */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 380,
    frame: false,
    resizable: false,
    center: true,
    show: true,
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

/**
 * Sends a status update message to the splash window.
 */
function updateSplashStatus(text) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('status-update', text);
  }
}

/**
 * Displays an error on the splash screen with retry options.
 */
function notifySplashError(errorMsg) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('backend-failed', errorMsg);
  }
}

/**
 * Resolves the backend executable or command.
 */
function getBackendLaunchConfig() {
  const packagedExe = path.join(process.resourcesPath, 'api', 'RetailHub.API.exe');
  const distExe = path.join(__dirname, '..', 'dist', 'backend', 'RetailHub.API.exe');

  if (app.isPackaged && fs.existsSync(packagedExe)) {
    return { type: 'exe', path: packagedExe, cwd: path.dirname(packagedExe) };
  }

  if (fs.existsSync(distExe)) {
    return { type: 'exe', path: distExe, cwd: path.dirname(distExe) };
  }

  // Fallback to dotnet run for pure development without dist
  const projectDir = path.join(__dirname, '..', 'src', 'RetailHub.API');
  return { type: 'dotnet', path: 'dotnet', args: ['run', '--project', projectDir], cwd: projectDir };
}

/**
 * Spawns the backend process if not already running.
 */
function spawnBackendProcess() {
  if (apiProcess || isSpawningBackend) return;
  isSpawningBackend = true;

  const config = getBackendLaunchConfig();
  console.log('[Electron] Starting backend via:', config);

  const env = {
    ...process.env,
    ASPNETCORE_ENVIRONMENT: 'Production',
    ASPNETCORE_URLS: 'http://localhost:5150;https://localhost:7048'
  };

  try {
    if (config.type === 'exe') {
      apiProcess = spawn(config.path, [], {
        cwd: config.cwd,
        env,
        windowsHide: true,
        stdio: 'ignore'
      });
    } else {
      apiProcess = spawn(config.path, config.args, {
        cwd: config.cwd,
        env,
        windowsHide: true,
        stdio: 'ignore'
      });
    }

    apiProcess.on('error', (err) => {
      console.error('[Electron] Failed to spawn backend process:', err);
      notifySplashError('فشل تشغيل خادم النظام: ' + err.message);
    });

    apiProcess.on('exit', (code, signal) => {
      console.log(`[Electron] Backend process exited with code ${code}, signal ${signal}`);
      apiProcess = null;
      isSpawningBackend = false;
    });
  } catch (e) {
    console.error('[Electron] Exception launching backend:', e);
    notifySplashError('خطأ أثناء تشغيل النظام: ' + e.message);
  }
}

/**
 * Periodically polls the API until ready, then opens the main application window.
 */
async function waitForBackendAndLaunch() {
  updateSplashStatus('جاري التحقق من اتصال النظام...');

  // 1. Check if backend is already running
  const isAlreadyRunning = await pingHealth(1500);
  if (isAlreadyRunning) {
    console.log('[Electron] Backend is already running and responsive.');
    createMainWindow();
    return;
  }

  // 2. Start the backend process
  updateSplashStatus('جاري تشغيل خادم النظام وقاعدة البيانات...');
  spawnBackendProcess();

  // 3. Wait with polling
  const maxAttempts = 60; // 60 * 500ms = 30 seconds
  let attempt = 0;

  const interval = setInterval(async () => {
    attempt++;

    if (attempt % 6 === 0) {
      updateSplashStatus('جاري تهيئة قاعدة البيانات والخدمات...');
    }

    const ready = await pingHealth(500);
    if (ready) {
      clearInterval(interval);
      console.log('[Electron] Backend is ready!');
      updateSplashStatus('تم الاتصال بنجاح! جاري فتح البرنامج...');
      setTimeout(() => {
        createMainWindow();
      }, 400);
      return;
    }

    if (attempt >= maxAttempts) {
      clearInterval(interval);
      console.error('[Electron] Timeout waiting for backend to respond.');
      notifySplashError('استغرق تشغيل النظام وقتاً أطول من المتوقع. تأكد من عمل خدمة SQL Server ثم أعد المحاولة.');
    }
  }, 500);
}

/**
 * Creates the native desktop main window.
 */
function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'RetailHub - نظام نقاط البيع وإدارة المخزون',
    icon: path.join(__dirname, 'icon.ico'),
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const indexPath = path.join(__dirname, 'dist', 'client', 'browser', 'index.html');

  if (isDev) {
    // Check if Angular dev server (4200) is running, otherwise use production dist
    const req = http.get('http://localhost:4200', () => {
      console.log('[Electron] Loading dev server http://localhost:4200 ...');
      mainWindow.loadURL('http://localhost:4200');
    });
    req.on('error', () => {
      console.log('[Electron] Angular dev server not active, loading local dist file:', indexPath);
      mainWindow.loadFile(indexPath);
    });
    req.setTimeout(500, () => {
      req.destroy();
      mainWindow.loadFile(indexPath);
    });
  } else {
    console.log('[Electron] Loading local file:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Cleanup backend on exit
 */
function cleanupBackend() {
  if (apiProcess && apiProcess.pid) {
    const pid = apiProcess.pid;
    console.log('[Electron] Terminating backend process tree for PID:', pid);
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${pid} /T /F`, (err) => {
          if (err) console.warn('[Electron] taskkill error (process may have exited):', err.message);
        });
      } else {
        apiProcess.kill();
      }
    } catch (e) {
      // Ignore
    }
    apiProcess = null;
  }
}

// App lifecycle
app.whenReady().then(() => {
  createSplashWindow();
  waitForBackendAndLaunch();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (!mainWindow) {
        createMainWindow();
      }
    }
  });
});

app.on('before-quit', cleanupBackend);

app.on('window-all-closed', () => {
  cleanupBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Splash IPC handlers
ipcMain.on('retry-start', () => {
  waitForBackendAndLaunch();
});

ipcMain.on('close-splash', () => {
  cleanupBackend();
  app.quit();
});

// IPC Handler for silent printing (Thermal Printers)
ipcMain.handle('print-receipt', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No window available' };

  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: options.silent ?? true,
        printBackground: true,
        deviceName: options.deviceName || ''
      },
      (success, failureReason) => {
        resolve({ success, error: failureReason });
      }
    );
  });
});