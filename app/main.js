const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { getPrinters, printCard } = require('./printer_service');

let sidecarProcess = null;

function startSidecar() {
  const sidecarPort = 8000;
  
  if (app.isPackaged) {
    // In production, the sidecar is an executable inside the resources directory
    // PyInstaller --onedir creates a 'main' directory, and the executable is inside it
    const sidecarExecutable = process.platform === 'win32' ? 'main.exe' : 'main';
    const sidecarPath = path.join(process.resourcesPath, 'sidecar', 'main', sidecarExecutable);
    
    console.log('Starting packaged sidecar from:', sidecarPath);
    sidecarProcess = spawn(sidecarPath, [], {
      detached: false
    });
  } else {
    // In development, spawn the python script
    const sidecarDir = path.join(__dirname, '..', 'sidecar');
    const pythonExecutable = process.platform === 'win32' 
      ? path.join(sidecarDir, 'venv', 'Scripts', 'python.exe')
      : path.join(sidecarDir, 'venv', 'bin', 'python');
      
    console.log('Starting dev sidecar from:', pythonExecutable);
    sidecarProcess = spawn(pythonExecutable, ['main.py'], {
      cwd: sidecarDir,
      detached: false
    });
  }

  sidecarProcess.stdout.on('data', (data) => {
    console.log(`Sidecar: ${data}`);
  });

  sidecarProcess.stderr.on('data', (data) => {
    console.error(`Sidecar Error: ${data}`);
  });

  // Verify IPC by polling the health endpoint
  const checkHealth = () => {
    require('http').get('http://127.0.0.1:8000/health', (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`[IPC Spike Validation] Sidecar Health Check: ${data}`);
      });
    }).on('error', (err) => {
      console.log('Sidecar not ready yet, retrying in 1s...');
      setTimeout(checkHealth, 1000);
    });
  };
  
  setTimeout(checkHealth, 1000);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (app.isPackaged) {
    // In production, load the built React app
    mainWindow.loadFile(path.join(__dirname, 'renderer_dist', 'index.html'));
  } else {
    // In dev mode, load the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
  }
  
  mainWindow.webContents.openDevTools();

  // Printer IPC Handlers
  ipcMain.handle('get-printers', (event) => getPrinters(event));
  ipcMain.handle('print-card', (event, args) => printCard(event, args));
}

app.whenReady().then(() => {
  startSidecar();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (sidecarProcess) {
    sidecarProcess.kill();
  }
});
