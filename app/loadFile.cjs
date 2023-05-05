const { dialog } = require('electron')
const file2lines = require('./file2lines.cjs')
const genRowdata = require('./genRowdata.cjs')

let isDev;
try {
  isDev = eval(process.env.IS_DEV.toLowerCase());
} catch (error) {
  isDev = undefined;
}
let tracer_debug
if (isDev) {
  tracer_debug = 'debug'
} else {
  tracer_debug = 'info'
}
const tracer = require('tracer')
  // import {tracer} from 'tracer';

// const logger = tracer.colorConsole({
const logger = tracer.console({
  format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || tracer_debug // 'debug'
})

let col1 = []
let col2 = []

const Store = require('electron-store')
const ns = new Store()

// const loadFile = async (win, ns, file = 1) => {
const loadFile = async (win, file = 1) => {
    const properties = ['openFile']
    if (file === 1) {
      properties.push('multiSelections')
    }

    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties,
        filters: [
          {
            name: 'textfile',
            extensions: ['txt', 'md', 'srt']
          }
        ]
      })

      // debug('%o, %o', fn + cl().line, filePaths)
      logger.debug('loaded: ', filePaths)

      if (!canceled) {
        try {
          logger.debug('executing file2lines(%s)... ', file)
          if (file === 1) {
            for (const [idx, filePath] of filePaths.slice(0, 2).entries()) {
              if (idx) {
                col2 = file2lines(filePath)
                filename2 = filePath
              } else {
                col1 = file2lines(filePath)
                filename1 = filePath
              }
            }
          } else {
            const [filePath] = filePaths
            col2 = file2lines(filePath)
            filename2 = filePath
          }
        } catch (err) {
          throw new Error(err.message)
        }

        rowData = genRowdata({ col1, col2 })

        ns.set('rowData', rowData)
        // logger.debug('ns.store ', ns.store)

        // logger.debug('win.webContents: ', win.webContents)
        try {
            win.webContents.send('rowData', rowData) // TODO preload.js m2r 'rowData', r2m 'update-rowdata'
            logger.debug(" m2r 'rowData' sent ")
        } catch (e) {
            logger.debug('error1: %s', e)
        }

        return { success: true, rowData }
      } else {
        logger.debug(' conceled')
        return { canceled }
      }
    } catch (error) {
      logger.debug('error2: %s', error)
      return { error }
    }
  }

// exports.loadFile = loadFile
module.exports = loadFile
