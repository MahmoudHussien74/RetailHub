const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');

// Ignore self-signed certificates on localhost (ASP.NET dev certificate)
app.commandLine.appendSwitch('ignore-certificate-errors');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let splashWindow = null;
let apiProcess = null;
let isSpawningBackend = false;

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const API_PORT = 5150;
const HEALTH_URL = `http://127.0.0.1:${API_PORT}/api/health`;

/**
 * Returns the path to the backend crash log file.
 */
function getBackendLogPath() {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch {}
  return path.join(logsDir, 'backend-crash.log');
}

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
 * Checks if a specific port is already in use.
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(err.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Tries to find what process is using a port (Windows only).
 */
function getProcessOnPort(port) {
  try {
    const result = execSync(`netstat -aon | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8', timeout: 3000 });
    const lines = result.trim().split('\n');
    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      try {
        const taskInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf-8', timeout: 3000 });
        return { pid, info: taskInfo.trim() };
      } catch { return { pid, info: '' }; }
    }
  } catch {}
  return null;
}

/**
 * Creates the sleek loading / splash window.
 */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 420,
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
function notifySplashError(errorMsg, logPath) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('backend-failed', { message: errorMsg, logPath: logPath || null });
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
 * Now captures stdout/stderr to a log file for crash diagnostics.
 */
function spawnBackendProcess() {
  if (apiProcess || isSpawningBackend) return;
  isSpawningBackend = true;

  const config = getBackendLaunchConfig();
  const logPath = getBackendLogPath();
  console.log('[Electron] Starting backend via:', config);
  console.log('[Electron] Backend logs will be written to:', logPath);

  // Write header to log file
  const timestamp = new Date().toISOString();
  fs.writeFileSync(logPath,
    `=== RetailHub Backend Log ===\n` +
    `Timestamp: ${timestamp}\n` +
    `Launch Config: ${JSON.stringify(config, null, 2)}\n` +
    `Working Dir: ${config.cwd}\n` +
    `=============================\n\n`,
    'utf-8'
  );

  const env = {
    ...process.env,
    ASPNETCORE_ENVIRONMENT: 'Production',
    ASPNETCORE_URLS: 'http://localhost:5150;https://localhost:7048'
  };

  try {
    const spawnArgs = config.type === 'exe' ? [] : config.args;

    apiProcess = spawn(config.path, spawnArgs, {
      cwd: config.cwd,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']  // Capture stdout and stderr
    });

    // Pipe stdout to log file
    if (apiProcess.stdout) {
      apiProcess.stdout.on('data', (data) => {
        const text = data.toString();
        console.log('[Backend STDOUT]', text);
        fs.appendFileSync(logPath, `[STDOUT] ${text}`, 'utf-8');
      });
    }

    // Pipe stderr to log file
    if (apiProcess.stderr) {
      apiProcess.stderr.on('data', (data) => {
        const text = data.toString();
        console.error('[Backend STDERR]', text);
        fs.appendFileSync(logPath, `[STDERR] ${text}`, 'utf-8');
      });
    }

    apiProcess.on('error', (err) => {
      console.error('[Electron] Failed to spawn backend process:', err);
      fs.appendFileSync(logPath, `\n[SPAWN ERROR] ${err.stack || err.message}\n`, 'utf-8');
      notifySplashError(
        'فشل تشغيل خادم النظام: ' + err.message +
        '\n\nتأكد من وجود ملف RetailHub.API.exe في مجلد التطبيق.',
        logPath
      );
    });

    apiProcess.on('exit', (code, signal) => {
      console.log(`[Electron] Backend process exited with code ${code}, signal ${signal}`);
      fs.appendFileSync(logPath, `\n[EXIT] Code: ${code}, Signal: ${signal}\n`, 'utf-8');

      if (code !== 0 && code !== null) {
        // Translate common exit codes to helpful messages
        let errorDetail = '';
        const hexCode = code > 0 ? '0x' + code.toString(16).toUpperCase() : code;

        if (code === 3762504530 || code === -532462766) {
          // 0xE0434352 = .NET CLR unhandled exception
          errorDetail = `خطأ في تشغيل خادم النظام (.NET Exception)\nرمز الخطأ: ${hexCode}\n\nالأسباب المحتملة:\n• البورت ${API_PORT} مستخدم من برنامج آخر\n• ملف قاعدة البيانات تالف أو مقفول\n• نقص في ملفات النظام المطلوبة`;
        } else if (code === 3221225794 || code === -1073741502) {
          // 0xC0000142 = DLL Initialization Failed
          errorDetail = `فشل تهيئة مكتبات النظام (DLL Init Failed)\nرمز: ${hexCode}\n\nالحل: أعد تثبيت .NET Runtime أو أعد تشغيل الجهاز`;
        } else if (code === 3221225781 || code === -1073741515) {
          // 0xC0000135 = Missing DLL
          errorDetail = `ملفات نظام مفقودة\nرمز: ${hexCode}\n\nالحل: تأكد من تثبيت .NET 10 Runtime أو Visual C++ Redistributable`;
        } else {
          errorDetail = `توقف خادم النظام عن العمل\nرمز الخطأ: ${hexCode} (${code})`;
        }

        errorDetail += '\n\nاضغط "عرض السجل" لمعرفة تفاصيل الخطأ.';

        notifySplashError(errorDetail, logPath);
      }
      apiProcess = null;
      isSpawningBackend = false;
    });
  } catch (e) {
    console.error('[Electron] Exception launching backend:', e);
    fs.appendFileSync(logPath, `\n[EXCEPTION] ${e.stack || e.message}\n`, 'utf-8');
    notifySplashError('خطأ أثناء تشغيل النظام: ' + e.message, logPath);
    isSpawningBackend = false;
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

  // 2. Check if port is already in use by another process
  const portBusy = await isPortInUse(API_PORT);
  if (portBusy) {
    console.warn(`[Electron] Port ${API_PORT} is already in use!`);
    const procInfo = getProcessOnPort(API_PORT);
    let portMsg = `البورت ${API_PORT} مستخدم من برنامج آخر على الجهاز.`;
    if (procInfo) {
      portMsg += `\n(PID: ${procInfo.pid})`;
      if (procInfo.info) portMsg += `\n${procInfo.info}`;
    }
    portMsg += '\n\nالحل: أغلق البرنامج الآخر أو أعد تشغيل الجهاز ثم حاول مرة أخرى.';
    notifySplashError(portMsg);
    return;
  }

  // 3. Start the backend process
  updateSplashStatus('جاري تشغيل خادم النظام وقاعدة البيانات...');
  spawnBackendProcess();

  // 4. Wait with polling — generous timeout for slow machines & first-run DB setup
  const maxAttempts = 240; // 240 * 500ms = 120 seconds (2 minutes)
  let attempt = 0;
  let backendRetries = 0;
  const maxBackendRetries = 2;
  const startTime = Date.now();

  // Rotating status messages so the user knows it's still working
  const statusMessages = [
    'جاري تشغيل خادم النظام...',
    'جاري تحميل مكونات النظام...',
    'جاري تهيئة قاعدة البيانات...',
    'جاري إعداد الخدمات والإعدادات...',
    'جاري التحقق من جاهزية النظام...',
    'التشغيل الأول قد يستغرق وقتاً أطول، يرجى الانتظار...',
    'لا يزال النظام يعمل على التهيئة...',
    'جاري تجهيز قاعدة البيانات للمرة الأولى...'
  ];

  const interval = setInterval(async () => {
    attempt++;
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    // Update status message every 3 seconds with a rotating message
    if (attempt % 6 === 0) {
      const msgIndex = Math.min(Math.floor(elapsedSec / 8), statusMessages.length - 1);
      updateSplashStatus(statusMessages[msgIndex]);
    }

    // If backend process died, try restarting it (up to maxBackendRetries times)
    if (!apiProcess && !isSpawningBackend && backendRetries < maxBackendRetries) {
      backendRetries++;
      console.log(`[Electron] Backend not running, retry #${backendRetries}...`);
      updateSplashStatus(`إعادة تشغيل خادم النظام... (محاولة ${backendRetries + 1})`);
      spawnBackendProcess();
    }

    const ready = await pingHealth(800);
    if (ready) {
      clearInterval(interval);
      console.log(`[Electron] Backend is ready after ${elapsedSec}s!`);
      updateSplashStatus('تم الاتصال بنجاح! جاري فتح البرنامج...');
      setTimeout(() => {
        createMainWindow();
      }, 400);
      return;
    }

    if (attempt >= maxAttempts) {
      clearInterval(interval);
      console.error(`[Electron] Timeout (${elapsedSec}s) waiting for backend.`);
      const logPath = getBackendLogPath();
      notifySplashError(
        'استغرق تشغيل خادم النظام وقتاً أطول من المتوقع.\n\n' +
        'الأسباب المحتملة:\n' +
        '• مكافح الفيروسات (مثل Windows Defender) يمنع تشغيل البرنامج\n' +
        '• جدار الحماية (Firewall) يحجب البورت ' + API_PORT + '\n' +
        '• البرنامج يحتاج صلاحيات مدير (Run as Administrator)\n\n' +
        'الحل:\n' +
        '1. أغلق البرنامج وافتحه كمدير (Right click → Run as administrator)\n' +
        '2. أضف مجلد البرنامج لاستثناءات مكافح الفيروسات\n' +
        '3. اضغط "إعادة المحاولة" للمحاولة مرة أخرى',
        logPath
      );
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

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
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

// Open log file in system's default text editor
ipcMain.on('open-log-file', (event, logPath) => {
  if (logPath && fs.existsSync(logPath)) {
    shell.openPath(logPath);
  }
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