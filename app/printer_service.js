const { BrowserWindow } = require('electron');

let printWindow = null;

function getPrinters(event) {
  return event.sender.getPrintersAsync();
}

async function printCard(event, { htmlContent, printerName }) {
  return new Promise((resolve, reject) => {
    if (printWindow) {
      printWindow.close();
    }

    printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
    
    printWindow.loadURL(dataUrl);

    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({
        silent: true,
        deviceName: printerName,
        printBackground: true,
        margins: { marginType: 'none' }
      }, (success, errorType) => {
        if (!success) {
          reject(new Error(`Print failed: ${errorType}`));
        } else {
          resolve(true);
        }
        printWindow.close();
        printWindow = null;
      });
    });
  });
}

module.exports = {
  getPrinters,
  printCard
};
