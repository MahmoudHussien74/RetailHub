const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  printReceipt: (options) => ipcRenderer.invoke('print-receipt', options)
});
