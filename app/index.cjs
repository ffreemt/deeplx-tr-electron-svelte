// app/index.js
const path = require('path');

const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
// const ProgressBar = require('electron-progressbar')

// import Store from 'electron-store'; // https://electron-react-boilerplate.js.org/docs/electron-store
const Store = require('electron-store');

const debug = require('electron-debug')

// debug()

// const isDev = process.env.IS_DEV === 'true';
// const isDev = app.isPackaged ? false : require('electron-is-dev')
let isDev;
try {
  isDev = eval(process.env.IS_DEV.toLowerCase());
} catch (error) {
  isDev = undefined;
}

if (app.isPackaged) {
  isDev = isDev ?? false; // if isDev is not null or undefined, return its value, otherwise return false
} else {
  isDev = isDev ?? true; // if isDev is not null or undefined, return its value, otherwise return t
}

let tracer_debug
if (isDev) {
  tracer_debug = 'debug'
} else {
  tracer_debug = 'info'
}
const tracer = require('tracer')
  // import {tracer} from 'tracer';
const logger = tracer.colorConsole({
  format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || tracer_debug // 'debug'
})
logger.debug(" entry ")
logger.info(" entry ")

// devtools wont show if uncommented?
// You can force development mode by setting the ELECTRON_IS_DEV environment variable to 1
// (does not seem to always work)
// logger.info('ELECTRON_IS_DEV, require("electron-is-dev")', process.env.ELECTRON_IS_DEV, require('electron-is-dev'))

logger.info('app\index.js process.env.IS_DEV ', process.env.IS_DEV)
logger.info('app\index.js isDev ', isDev)

// const { spawn } = require('node:child_process')

const genRowdata = require('./genRowdata.cjs')

const store = new Store();
// store is ns (namespace for historical reason) in loadFile.cjs and
// onSaveDocx/ menuTemplate in menu-template.cjs

// ********* default and save-resore
const langList = ['zh', 'en', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'pl', 'ru', 'ja']
// const targetLang1 = Object.fromEntries(langList.map((x) => [x, false]))
// targetLang1.zh = true  // default to zh

const defaultPref = {
  windowBounds: { x: 10, y: 10,  width: 800, height: 600 },
  targetLang1: 'zh', // actually state true/false
  rowdata2file: 'rowdata2docx',
  filename1: 'unnamed',
  filename2: 'unnamed2',
}

// hard reset ns
// store.set('targetLang1', 'zh')

store.set('rowdata2file', store.get('rowdata2file') || defaultPref.rowdata2file)
store.set('targetLang1', store.get('targetLang1') || defaultPref.targetLang1)

// store.delete('rowData')
store.set('rowData', [{text1: '', text2: ''}])
store.set('filename1', defaultPref.filename1) // reset filename1

logger.debug('store.store: ', store.store)
// *********

// reload when build changed
/* https://dev.to/o_a_e/getting-started-with-electron-and-svelte-2gn8
let watcher;
if (process.env.NODE_ENV === 'development') {
 watcher = require('chokidar').watch(path.join(__dirname, '../public/build'), { ignoreInitial: true });
 watcher.on('change', () => {
 mainWindow.reload();
 });
}
// */

// console.log('store.store: ', store.store)
// logger.debug('store.store: %j', store.store)

// IPC listener
// ipcMain.on('store-var', async (event, val) => {
  // event.returnValue = store)
// })
ipcMain.on('electron-store-get', (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val);
});

// channel for returning store.store
ipcMain.on('ch_storestore', (event) => {
  logger.debug('ch-store.store, event.returnValue: %j', store.store)
  logger.debug('ch-store.store, event.returnValue: %s', JSON.stringify(store.store))
  event.returnValue = store.store; // for sendSync
  // event.sender.send('ch_storestore-reply', 'str store.store' )
});

ipcMain.on('update-rowdata', (event, data) => {
  logger.debug('updated rowdata: %j', data)
  // prepare for further saving
  // initially in loadFile.cjs ns.set('rowData', rowData)
  store.set('rowData', data)
  logger.debug('store.store: ', store.store)
})

// *********/
let mainWindow
let col1 = []
let col2 = []
// eslint-disable-next-line prefer-const
// let col3 = []

let rowData = {}
let filename1 = ''
// let filename2 = ''
let savedFilename = ''

const isMac = process.platform === 'darwin'

ipcMain.on('toMain', async (event, data, data1) => { //https://github.com/reZach/secure-electron-template/blob/master/docs/newtoelectron.md
  logger.debug(' toMain: data ', data, data1)
  mainWindow.webContents.send("fromMain", store.store);
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

async function createWindow0() {
  // Create the browser window.
  // const mainWindow = new BrowserWindow({
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(app.getAppPath(), 'preload.js')
      preload: path.join(__dirname, 'preload.cjs'),
      // preload: path.join(__dirname, 'preload.js'),
      // nodeIntegration: false,
      // contextIsolation: true,
      // enableRemoteModule: true,
    },
  });

  // Open the DevTools.
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    try {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    } catch (e) {
      logger.error(e)
      throw e
    }
    // mainWindow.webContents.openDevTools();
    // require('electron-debug')()
    // debug()
  } else {
    // mainWindow.removeMenu();
    await mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }
}

const createWindow = async () => {
  // Use saved window size in user-preferences
  const { x, y, width, height } = store.get('windowBounds') || defaultPref.windowBounds

  // const mainWindow = new BrowserWindow({
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // use a preload script
      // nodeIntegration: true, // + contextIsolation: false to enable require
      // contextIsolation: false,
      // enableRemoteModule: true
      },
      x,
      y,
      width,
      height,
      icon: path.join(__dirname, 'el-svelte.png'),
      // show: false,
  })

  mainWindow.on('resize', () => {
    // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
    // the height, width, and x and y coordinates.
    const { x, y, width, height } = mainWindow.getBounds()
    // Now that we have them, save them using the `set` method.
    store.set('windowBounds', { x, y, width, height })

    // logger.debug('mainWindow.getBounds(): ', mainWindow.getBounds())
  })

  // Open the DevTools.
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    debug()
    logger.debug(' isDev mainWindow.loadURL ')
  } else {
    // mainWindow.removeMenu();
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
    logger.debug(' mainWindow.loadFile ')
  }

  // mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // mainWindow.webContents.openDevTools();
  // handleCommunication()
}

console.log("index.cjs ln279 path.join(process.resourcesPath, 'app'): ", path.join(process.resourcesPath, 'app'))
console.log("index.cjs ln280 path.join(__dirname, 'app'): ", path.join(__dirname, 'app'))
console.log(path.join(path.dirname(__dirname), 'src', 'app'))

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

!async function () {
  // app.whenReady().then(async () => {
  await app.whenReady()

  // await createWindow0();
  await createWindow();

  // const menuTemplate = require('./menu-template.cjs').menuTemplate // exports.menuTemplate = menuTemplate in menu-template.cjs
  const menuTemplate = require('./menu-template.cjs') // module.exports = menuTemplate

  let menuTempl = menuTemplate(app, mainWindow, store)
  // logger.debug(' menuTempl: %j', menuTempl)

  const menu = Menu.buildFromTemplate(menuTempl)
  Menu.setApplicationMenu(menu)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.debug(' did-finish-load, setting setTitle ')
    const package_json = require('../package.json')
    mainWindow.setTitle(`${package_json.name} ${package_json.version}`)

    // now show it
    // logger.debug(' turn the window on') // does not seem to work
    // mainWindow.webContents.show = true
  })

}()

// });

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
