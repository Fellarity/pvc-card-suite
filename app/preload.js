const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkSidecarHealth: () => ipcRenderer.invoke('check-sidecar-health'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printCard: (htmlContent, printerName) => ipcRenderer.invoke('print-card', { htmlContent, printerName })
});
