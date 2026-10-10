process.env.ELECTRON_CACHE = 'D:\\electron_cache';
process.env.TEMP = 'D:\\electron_cache';
process.env.TMP = 'D:\\electron_cache';

console.log('Downloading Electron with cache and temp set to D:\\electron_cache ...');
require('./node_modules/electron/install.js');
