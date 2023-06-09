const { app, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
// const fsAsync = require('fs/promises')

const axios = require('axios')
// const converter = require('json-2-csv')
const json2csv = require('json-2-csv').json2csv
const { PythonShell } = require('python-shell')
const ProgressBar = require('electron-progressbar')

const loadFile = require('./loadFile.cjs')
const trText = require('./trText.cjs')
const genRowdata = require('./genRowdata.cjs')

let isDev;
const isMac = process.platform === 'darwin'

try {
  // isDev = process.env.IS_DEV.toLowerCase() === 'true';
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
const logger = tracer.colorConsole({
  format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || tracer_debug // 'debug'
})

const waitOn = require('wait-on')
const checkDeepl = async (opts={}) => {
  if (!opts.port) opts.port = 80
  if (!opts.timeout) opts.timeout = 15000 // 15s
  // opts.resources = [ `http://127.0.0.1:${opts.port}/docs` ]
  let url = 'https://www2.deepl.com/jsonrpc'
  url = 'https://www.deepl.com/translator'
  opts.resources = [ url ]
  delete opts.port

  // try 2 times
  for (const _ of [...Array(2).keys()]){
    logger.debug(` check Deepl ${_ + 1}/2`)
    try {
      await waitOn(opts)
      return 'server ready'
    } catch (e) {
      // return e.name + ': ' + e.message
      logger.error(`check Deepl: failed ${_ + 1} - ${e.name}: ${e.message}`)
      if (_ >= 4) {
        throw e
      } else {
        logger.debug(`Tried: ${_ + 1} times, is net/wifi up/signed on?`)
      }
    }
  }
}

async function checkUrlAccessibility() {
    const url = 'https://www.deepl.com/translator';
    try {
      await axios.get(url);
      console.log('URL is accessible');
      return 'deepl ready'
    } catch (error) {
      console.error(error.message)
      console.log('URL is not accessible');
      return error.message
    }
  }

  // python-shell <=> rowdata2file in python
// const onSaveDocx = () => {
const onSaveDocx = (ns) => {
    // const pyscript = path.join(__dirname, 'app', 'pyscript.py')
    let pyscript
    if (app.isPackaged) {
    //   pyscript = path.join(process.resourcesPath, 'app', 'pyscript.py')
      pyscript = path.join(process.resourcesPath, 'pyenv', 'pyscript.py')
    } else {
    //   pyscript = path.join(__dirname, 'app', 'pyscript.py')
      pyscript = path.join(__dirname, 'pyenv', 'pyscript.py')
    }
    logger.debug('onSaveDocx pyscript.py: %s', pyscript)

    // const pythonPath = path.join(process.resourcesPath, 'app', 'install', 'python.exe')
    // const pythonPath = 'python.exe'
    let pythonPath
    if (app.isPackaged) {
      pythonPath = path.join(process.resourcesPath, 'pyenv', 'python.exe')
    } else {
      pythonPath = path.join(__dirname, 'pyenv', 'python.exe')
    }

    logger.debug('\n\t onSaveDocx pythonPath: %s', pythonPath)

    // const pyshell = new PythonShell(pyscript, { mode: 'json', pythonPath })
    const pyshell = new PythonShell(pyscript, { mode: 'binary', pythonPath })

    let rowData = ns.get('rowData')
    const _ = {rowdata: rowData, infilepath: savedFilename, rowdata2file: ns.get('rowdata2file')}

    logger.debug(`ns.get('rowdata2file'): ${ns.get('rowdata2file')}`)

    pyshell.childProcess.stdin.write(JSON.stringify(_))
    pyshell.childProcess.stdin.end()

    let fileloc = savedFilename.replace(/(\.\w+)?$/, '.docx')
    logger.debug(`ns.get('rowdata2file'): ${ns.get('rowdata2file')}`)

    if (ns.get('rowdata2file').endsWith('docx_t')) {
      fileloc = fileloc.replace(/\.docx$/, '-t.docx')
    }

    pyshell.on('message', (result) => {
      logger.debug('result: %s', result)
      dialog.showMessageBox(
        {
          message: result,
          title: 'Info',
          buttons: ['OK'],
          type: 'info' // none/info/error/question/warning
        }
      )
    })

    pyshell.end((err) => {
      if (err) {
          logger.error(err.name + ': ' + err.message)
          dialog.showMessageBox(
            {
              message: `${err.name}: ${err.message.slice(0,800)} `,
              title: 'Error',
              buttons: ['OK'],
              type: 'error' // none/info/error/question/warning
            }
          )
      } else {
        dialog.showMessageBox(
            {
              title: 'Info',
              message: `Saved file to ${fileloc}`,
              buttons: ['OK'],
              type: 'info' // none/info/error/question/warning
            }
          )
      }
    })
  }

// menu part
const langList = ['zh', 'en', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'pl', 'ru', 'ja']

/**
 *
 */
const menuTemplate = (app, mainWindow, ns) => {
    const submenuTargetLang1 = langList.map(
        label => ({
            label,
            checked: ns.get('targetLang1') === label,
            type: 'radio',
            click: evt => {
                ns.set('targetLang1', label)
                logger.debug('set to ', label)
                logger.debug('ns.store', ns.store)
            }
        })
    )

    const submenuTargetLang1b = langList.map(
        label => ({
            label,
            checked: ns.get('targetLang1')[label],
            type: 'radio',
            click: evt => { handleTargetLang1(`'${label}'`); logger.debug('targetlang set to ', label); }
        })
    )
    // logger.debug('submenuTargetLang1: %j', submenuTargetLang1)

    const submenuTargetLang1a = [
        {
            label: 'en',
            enabled: true,
            checked: false,
            type: 'radio',
            click: e => {
                logger.debug(' TargetLang1 en ')
                dialog.showMessageBox(
                    {
                        title: 'coming soon...',
                        message: `set to en`,
                        buttons: ['OK'],
                        type: 'info'
                    }
                )
                handleTargetLang1('en')
            }
        },
        {
            label: 'zh',
            enabled: true,
            checked: false,
            type: 'radio',
        },
        {
            label: 'de',
            enabled: true,
            checked: false,
            type: 'radio',
        },
        {
            label: 'fr',
            enabled: true,
            checked: false,
            type: 'radio',
        },
        {
            label: 'it',
            enabled: true,
            checked: false,
            type: 'radio',
            // visible: false
        },
        {
            label: 'ru',
            enabled: true,
            checked: false,
            type: 'radio',
            // visible: false
        },
        {
            label: 'ja',
            enabled: true,
            checked: false,
            type: 'radio',
            // visible: false
        },
        {
            label: 'dummy',
            enabled: true,
            checked: true,
            type: 'radio',
            visible: false
        },
    ]

  const resu = [  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
        {
            label: 'Open File',
            accelerator: 'CmdOrCtrl+O',
            role: 'open',
            // click: async () => { await loadFile(mainWindow, ns) } // ns to pass ns namespace around
            click: async () => { await loadFile(mainWindow) } // ns to pass ns namespace around
        },
        { type: 'separator' },
        {
            label: 'DeeplTr',
            // accelerator: 'CmdOrCtrl+L',
            accelerator: 'CmdOrCtrl+T',
            click: async () => {
                logger.debug('DeeplTr clicked... do nothing if !col1')

                logger.debug('ns: %j', ns.store)

                let col1 = ns.get('rowData').map(el => el.text1)
                let col2 = ns.get('rowData').map(el => el.text2)

                if (typeof col1 === 'undefined') {
                    logger.debug('col1 undefined, do nothing')
                    return
                } else logger.debug('\n\n\t=== col1 ', typeof col1, Array.isArray(col1))

                if (typeof col2 === 'undefined') {
                    logger.debug('col2 undefined')
                } else logger.debug('\n\n\t===  col2 ', typeof col2, Array.isArray(col2))

                // logger.debug('\n\n\t=== lines1 ', typeof lines1, Array.isArray(lines1))
                // logger.debug('\n\n\t===  lines2 ', typeof lines2, Array.isArray(lines2))

                const progressBar = new ProgressBar({
                    text: 'diggin...',
                    detail: 'Fetching deepltr result... make sure the net is up and you can access deepl.com '
                })
                progressBar
                    .on('completed', function () {
                        console.info('completed...')
                        progressBar.detail = 'Task completed. Exiting...'
                    })
                    .on('aborted', function () {
                        console.info('aborted...')
                    })

                // check server/deepl status
                try {
                    // await checkPort()
                    // await checkDeepl()
                    await checkUrlAccessibility()
                    logger.debug("server ready") // everything OK
                } catch (e) {
                    logger.error(`${e.name}: ${e.message}`)
                    dialog.showMessageBox(
                        {
                            message: `${e.name}: ${e.message}
    Looks like deepl server is not accessible for some reason. `,
                            title: 'Error',
                            buttons: ['OK'],
                            type: 'error' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                        }
                    )
                    return
                } finally {
                    // progressBar.setCompleted()
                }

                let pairsList
                try {
                    logger.debug('\n\t ns.store: ', ns.store)
                    logger.debug(' ns.get targetLang1: ', ns.get('targetLang1'))

                    // note to self: must fill arguments sequentially!
                    // pairsList = await trText(col1.join('\n'), toLang=ns.get('targetLang1'))
                    pairsList = await trText(col1.join('\n'), null, ns.get('targetLang1'))

                    // logger.debug('trtext: %s', trtext)
                    logger.debug('\n\t pairsList.slice(0, 5): %j', pairsList.slice(0, 5))
                } catch (e) {
                    logger.error(e)
                    rowData = { text1: e.name, text2: e.message }
                    dialog.showMessageBox(
                        {
                            message: `${e.name}: ${e.message}`,
                            title: 'Warning',
                            buttons: ['OK'],
                            type: 'warning' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                        }
                    )
                    // trtext = e.name + ': ' + e.message
                    // pairsList = [[e.name, e.message]]

                    // give up upon errors
                    return
                } finally {
                    progressBar.setCompleted()
                }

                // fix rowData
                // col2 = trtext.trim().split(/[\r\n]+/)

                // logger.debug('col1: %j', col1.slice(0,5))
                // logger.debug('col2: %j', col2.slice(0,5))
                // rowData = genRowdata({ col1, col2 })

                const rowData = genRowdata({ col1: pairsList, isRow: true })
                ns.set('rowData', rowData)
                // logger.debug(' rowData from col1 col2: %j', rowData)
                logger.debug(' rowData from pairsList: %j', pairsList)

                if (!rowData) {
                    logger.error(' rowData is undefined ')
                } else {
                    _ = Object.fromEntries(Object.entries(rowData).slice(0, 3))
                    logger.debug(' send to via rowData channel ', _, '...')
                    mainWindow.webContents.send('rowData', rowData)
                    // update store/ns.rowData
                    try {
                      ns.set('rowData', rowData)
                      logger.debug(' store/ns rowData updated')
                    } catch (e) {
                      logger.error(e)
                      dialog(
                        {
                          message: `${e.name}: ${e.message}`,
                          title: 'Warning',
                          buttons: ['OK'],
                          type: 'warning',
                        }
                      )
                    }
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Save(docx)',
            accelerator: 'CmdOrCtrl+S',
            click: async () => {
                logger.debug('SaveDocx clicked...')

                logger.debug(' ns.get(rowData) ', ns.get('rowData'))
                logger.debug('SaveCsv clicked...')

                let rowData = ns.get('rowData')
                if (typeof rowData === 'undefined' || !rowData) { // undefined or empty
                    console.log('typeof rowData === \'undefined\' || !rowData')
                    dialog.showMessageBox(
                        {
                            message: 'Empty data...Try to load a file or paste some text to a cell in text1  first.',
                            title: 'Warning',
                            buttons: ['OK'],
                            type: 'warning'
                        }
                    )
                    return null
                }
                // proceed to save rowData
                // let savedFilename = `${path.parse(filename1).name}-${path.parse(filename2).name}.csv`

                let filename1 = ns.get('filename1')
                savedFilename = `${path.parse(filename1).name}-tr.csv`

                savedFilename = path.join(path.parse(path.resolve(filename1)).dir, savedFilename)

                logger.debug(' onSaveDocx savedFilename: ', savedFilename)

                // talk to pyshell
                try {
                    // onSaveDocx()
                    onSaveDocx(ns)
                } catch (e) {
                    logger.debug(e)
                    dialog.showMessageBox(
                        {
                            // message: `Unable to save...${e.name}: ${e.message}`,
                            message: `Unable to save...${e}`,
                            title: 'Warning',
                            buttons: ['OK'],
                            type: 'warning'
                        }
                    )
                    return null
                }
            }
        },
        {
            label: 'Save(csv)',
            click: async () => {
                logger.debug('SaveCsv clicked...')

                let rowData = ns.get('rowData')
                logger.debug(' ns.store: ', ns.store)

                if (typeof rowData === 'undefined') {
                    dialog.showMessageBox(
                        {
                            message: 'rowData === \'undefined\'.',
                            title: 'Warning',
                            buttons: ['OK'],
                            type: 'warning'
                        }
                    )
                    return null
                }

                if (!rowData) { // undefined or empty
                    logger.debug(' if (!rowData) ')
                    dialog.showMessageBox(
                        {
                            message: 'Empty data...Try to load a file or paste some text to a cell in text1  first.',
                            title: 'Warning',
                            buttons: ['OK'],
                            type: 'warning'
                        }
                    )
                    return null
                }
                // proceed to save rowData
                const filename1 = ns.get('filename1')
                let savedFilename = `${path.parse(filename1).name}-tr.csv`

                savedFilename = path.join(path.parse(path.resolve(filename1)).dir, savedFilename)

                logger.debug('SaveCsv savedFilename: ', savedFilename)
                logger.debug("rowData'): ", rowData)
                logger.debug("ns.get('rowData'): ", ns.get('rowData'))

                let csv = null
                try {
                    csv = await json2csv(rowData)
                } catch (err) {
                    logger.debug(err.message)
                    dialog.showMessageBox(
                        {
                            message: 'Unable to convert to csv.',
                            title: 'Warning',
                            buttons: ['OK'],
                            type: 'warning'
                        }
                    )
                    return null
                    // throw err
                }

                try {
                    // fs.writeFileSync(savedFilename, csv, 'GB2312')
                    // fs.writeFileSync(savedFilename, Buffer.from('EFBBBF', 'hex'))
                    // fs.writeFileSync(savedFilename, csv)
                    // fs.writeFile(`${outputPath}`, `\ufeff${string}`, 'utf8')
                    fs.writeFileSync(savedFilename, `\ufeff${csv}`, 'utf8')

                    // const arr = iconv.encode (str, 'GB2312')
                    // fs.writeFileSync(savedFilename, arr, 'hex')
                    dialog.showMessageBox(
                        {
                            message: `${path.resolve(savedFilename)} saved`,
                            title: 'Info',
                            buttons: ['OK'],
                            type: 'info'
                        }
                    )
                } catch (e) {
                    logger.error(e)
                    dialog.showMessageBox(
                        {
                            message: 'Unable to save, ' + e.message,
                            title: 'Warning',
                            buttons: ['OK'],
                            type: 'warning'
                        }
                    )
                }
              }
        },
      {
        label: 'Save(trtxt)',
        click: async () => {
          logger.debug('SaveTrtxt clicked...')

          let rowData = ns.get('rowData')

          if (typeof rowData === 'undefined') {
              logger.debug('rowData === \'undefined\'.')
              dialog.showMessageBox(
                  {
                      message: ' rowData === \'undefined\'.',
                      title: 'Warning',
                      buttons: ['OK'],
                      type: 'warning'
                  }
              )
              return null
          }

          if (!rowData) { // undefined or empty
            console.log('Empty data...')
            dialog.showMessageBox(
              {
                message: 'Empty data...Try to load a file or paste some text to a cell in text1  first.',
                title: 'Warning',
                buttons: ['OK'],
                type: 'warning'
              }
            )
            return null
          }
          const filename1 = ns.get('filename1')
          savedFilename = `${path.parse(filename1).name}-tr.txt`

          savedFilename = path.join(path.parse(path.resolve(filename1)).dir, savedFilename)

          logger.debug('SaveTrtxt savedFilename: ', savedFilename)

          logger.debug(' rowData ', rowData)

          // convert text2 of rowData to trtxt
          let trtxt
          try {
            trtxt = rowData.map( _ => _.text2 ).join('\n')
          } catch (e) {
            trtxt = `${e.name}: ${e.message}`
            logger.error(e)
            dialog.showMessageBox(
              {
                message: `${e.name}: ${e.message}`,
                title: 'Error',
                buttons: ['OK'],
                type: 'error'
              }
            )
          }
          // save trtxt
          try {
            fs.writeFileSync(savedFilename, `\ufeff${trtxt}`, 'utf8')

            // const arr = iconv.encode (str, 'GB2312')
            // fs.writeFileSync(savedFilename, arr, 'hex')
            dialog.showMessageBox(
              {
                message: `${path.resolve(savedFilename)} saved`,
                title: 'Info',
                buttons: ['OK'],
                type: 'info'
              }
            )
          } catch (e) {
            logger.error(e)
            dialog.showMessageBox(
              {
                message: 'Unable to save, ' + e.message,
                title: 'Warning',
                buttons: ['OK'],
                type: 'warning'
              }
            )
          }
          }
      },
        {
            label: app.getName(),
            visible: false,
            submenu: [
                {
                    label: 'Preferences',
                    click: _ => {
                        const prefWindow = new BrowserWindow({ width: 500, height: 300, resizable: false })
                        // prefWindow.loadURL(htmlPath)
                        prefWindow.loadFile(path.join(__dirname, 'preferences.html'))
                        prefWindow.show()
                        // on window closed
                    }
                }
            ]
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
    ]
},
// { role: 'editMenu' }
{
    label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac
                ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    // { role: 'selectAll' },
                    // { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ]
                : [
                    { role: 'delete' }
                    // { type: 'separator' },
                    // { role: 'selectAll' },
                ])
        ]
},
// { role: 'viewMenu' }
{
    label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
},
// { role: 'windowMenu' }
{
    label: 'Window',
        submenu: [
            { role: 'minimize' },
            // { role: 'zoom' },
            ...(isMac
                ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ]
                : [
                    { role: 'close' }
                ])
        ]
},
{
    label: 'Options', // HERE
        submenu: [
            {
                label: 'TargetLang1',
                // visible: false,
                enabled: true,
                submenu: submenuTargetLang1,
            },
            {
                label: 'TargetLang2',
                // visible: false,
                enabled: false,
                submenu: [{
                    label: "en",
                    enabled: false,
                    checked: false,
                    type: 'radio',
                    click: e => {
                        logger.debug(' TargetLang1 checkbox ')
                        dialog.showMessageBox(
                            {
                                title: 'coming soon...',
                                message: `Not implemented yet, stay tuned.`,
                                buttons: ['OK'],
                                type: 'info'
                            }
                        )
                        // splitToSents = !splitToSents
                        targetLang2_en = false
                        ns.set('targetLang2_en', targetLang1_en)
                    }
                },
                {
                    label: 'zh',
                    enabled: false,
                    checked: false,
                    type: 'radio',
                }
                ]
            },
            {
                label: 'DocxFormat',
                submenu: [
                    {
                        label: 'topdown',
                        checked: ns.get('rowdata2file') === 'rowdata2docx' ? true : false,
                        type: 'radio',
                        click: evt => {
                            ns.set('rowdata2file', 'rowdata2docx')
                        },
                    },
                    {
                        label: 'side-by-side',
                        checked: ns.get('rowdata2file') === 'rowdata2docx' ? false : true,
                        type: 'radio',
                        click: evt => {
                            ns.set('rowdata2file', 'rowdata2docx_t')
                        },
                    },
                ]
            },
        ]
},
// =================
{
    role: 'help',
        submenu: [
            {
                label: 'Goto repo',
                click: async () => {
                    const { shell } = require('electron')
                    // await shell.openExternal('https://electronjs.org')
                    await shell.openExternal('https://github.com/ffreemt/deeplx-tr-electron-svelte')
                }
            },
            {
                label: 'Join qqgroup-316287378',
                click: async () => {
                    const { shell } = require('electron')
                    // await shell.openExternal('https://electronjs.org')
                    // await shell.openExternal('https://github.com/ffreemt/ptextpad-electron')
                    await shell.openExternal('https://jq.qq.com/?_wv=1027&k=9018eFSV')
                }
            },
            { label: `v.${require('../package.json').version}` }
        ]
}
]
return resu
}

module.exports = menuTemplate
// exports.menuTemplate = menuTemplate
