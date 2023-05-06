// https://www.jsgarden.co/blog/how-to-handle-electron-ipc-events-with-typescript
/*
export type ContextBridgeApi = {
  // Declare a `readFile` function that will return a promise. This promise
  // will contain the data of the file read from the main process.
  readFile: () => Promise<string>
}
// */

// for preload.cjs can only require electron
const { app, contextBridge, ipcRenderer } = require('electron');

console.log(' preload.cjs entry ')

// window.ipcRenderer = ipcRenderer  // book: electron quickly
// console.log(' window.ipcRenderer: ', window.ipcRenderer)
// window.ipcRenderer does not work in App.svelte

// https://chiragagrawal65.medium.com/how-to-import-ipcrenderer-in-renderer-process-component-26fef55fa4b7  !!works
// const {ipcRenderer, contextBridge} = require('electron');

// contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer) // for sendSync
contextBridge.exposeInMainWorld('api', {
  ipcRenderer: ipcRenderer,
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ["toMain"];
    if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data, 'data1');
    }
  },
  // receive: (fromMain, func) => {
    // ipcRenderer.on(fromMain, (event, ...args) => {
      // func(...args)
    // })
  // },
  receive: (channel, func) => {
      let validChannels = ["fromMain"];
      if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender`
          ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
  },
  rowData: (channel, func) => {
    // ipcRenderer.on('rowData', (event, ...args) => func(...args))
    console.log('api.rowData')
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },
  updateRowdata: (channel, data) => {
    // console.log(' update-rowdata received %o', data)
    if (['update-rowdata'].includes(channel)) {
      console.log('preload.cjs update-rowdata received: ', data)
      ipcRenderer.send(channel, data)
    }
  },
})

/*
contextBridge.exposeInMainWorld('api', {
  send: ('toMain', data) => {
    ipcRenderer.send('toMain', data)
  },
  // receive: ('fromMain', func) => {
    // ipcRenderer.on('fromMain', (event, args) => {
      // func(args))
  // }},
})
// */

// renderer to main ch1: r2m1
contextBridge.exposeInMainWorld('r2m1', {
  store: {
    get(key) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property, val) {
      ipcRenderer.send('electron-store-set', property, val);
    },
    // Other method you want to add like has(), reset(), etc.
  },
  // Any other methods you want to expose in the window object.
  // ...
});
