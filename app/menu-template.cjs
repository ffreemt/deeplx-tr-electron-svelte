const { app, dialog } = require('electron')
const path = require('path')
const axios = require('axios')
const converter = require('json-2-csv')
const { PythonShell } = require('python-shell')
const ProgressBar = require('electron-progressbar')

const loadFile = require('./loadFile.cjs').loadFile
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
const onSaveDocx = () => {
    // const pyscript = path.join(__dirname, 'app', 'pyscript.py')
    let pyscript
    if (app.isPackaged) {
      pyscript = path.join(process.resourcesPath, 'app', 'pyscript.py')
    } else {
      pyscript = path.join(__dirname, 'app', 'pyscript.py')
    }
    logger.debug('onSaveDocx pyscript.py: %s', pyscript)
  
    // pythonPath = path.join(process.resourcesPath, 'app', 'install', 'python.exe')
    logger.debug('onSaveDocx pythonPath: %s', pythonPath)
  
    // const pyshell = new PythonShell(pyscript, { mode: 'json', pythonPath })
    const pyshell = new PythonShell(pyscript, { mode: 'binary', pythonPath })
  
    const _ = {rowdata: rowData, infilepath: savedFilename, rowdata2file: ns.get('rowdata2file')}
  
    logger.debug(`ns.get('rowdata2file'): ${ns.get('rowdata2file')}`)
  
    pyshell.childProcess.stdin.write(JSON.stringify(_))
    pyshell.childProcess.stdin.end()
  
    let fileloc = savedFilename.replace(/(\.\w+)?$/, '.docx')
    logger.debug(`ns.get('rowdata2file'): ${ns.get('rowdata2file')}`)
  
    if (ns.get('rowdata2file').endsWith('docx_t')) {
      fileloc = fileloc.replace(/\.docx$/, '-t.docx')
    }
    dialog.showMessageBox(
      {
        title: 'Info',
        message: `Saved file at ${fileloc}`,
        buttons: ['OK'],
        type: 'info' // none/info/error/question/warning
      }
    )
  
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
                click: async () => { await loadFile(mainWindow, ns) } // ns to pass ns namespace around
            },
            {
                label: 'Open File2',
                visible: false,
                // accelerator: 'CmdOrCtrl+P',
                role: 'open',
                click: async () => {
                    logger.debug('open file2')
                    let res = []
                    try {
                        res = await loadFile(mainWindow, 2)
                    } catch (err) {
                        dialog.showErrorBox('Error', err)
                    }
                    if (res.success) {
                        dialog.showMessageBox(
                            {
                                message: 'File 2 successfully loaded.',
                                title: 'Info',
                                buttons: ['OK'],
                                type: 'info' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                            }
                        )
                    } else {
                        dialog.showMessageBox(
                            {
                                message: 'Loading File 2 canceled.',
                                title: 'Warning',
                                buttons: ['OK'],
                                type: 'warning' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                            }
                        )
                    }
                }
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
                    
                    if (typeof col1 === 'undefined') { 
                        logger.debug('col1 undefined')
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

                    // let rowData  // moved to top as global
                    let pairsList
                    try {
                        logger.debug('\n\t ns.store: ', ns.store)
                        logger.debug(' ns.get targetLang1: ', ns.get('targetLang1'))

                        // note to self: must fill arguments sequentially!
                        // pairsList = await trText(col1.join('\n'), toLang=ns.get('targetLang1'))
                        pairsList = await trText(col1.join('\n'), null, ns.get('targetLang1'))

                        // logger.debug('trtext: %s', trtext)
                        logger.debug('pairsList.slice(0, 5): %j', pairsList.slice(0, 5))
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
                        pairsList = [[e.name, e.message]]
                    } finally {
                        progressBar.setCompleted()
                    }

                    // fix rowData
                    // col2 = trtext.trim().split(/[\r\n]+/)

                    // logger.debug('col1: %j', col1.slice(0,5))
                    // logger.debug('col2: %j', col2.slice(0,5))
                    // rowData = genRowdata({ col1, col2 })

                    rowData = genRowdata({ col1: pairsList, isRow: true })
                    // logger.debug(' rowData from col1 col2: %j', rowData)
                    logger.debug(' rowData from pairsList: %j', pairsList)

                    if (!rowData) {
                        logger.error(' rowData is undefined ')
                    } else {
                        logger.debug(' send to via rowData channel ')
                        // rowData.map((el, idx) => {
                        rowData.forEach((el, idx) => {
                            if (idx < 5) {
                                logger.debug(' send via rowData channel ')
                            }
                        })

                        // if (metric.some( el => !!el )) {
                        mainWindow.webContents.send('rowData', rowData)

                        /*
                        if (ratio < 0.1) {
                          let extra_msg = ''
                          if(engineURL.match(/5555/)) {
                               extra_msg = `
            
              You may wish to try mlbee (Menu/Preferences/AlignEngin/forind-mlbee)
              instead, which takes a tad longer tho.`
                          }
            
                          dialog.showMessageBox(
                            {
                              title: 'bummer',
                              message: `
              No meaningful result returned, either because
              there is a bug in the app, or the server is down,
              or there is an issue with your
              data/parameters selected. If possible, feedback to the dev,
              best with some descriptions and/or your data if feasible.${extra_msg}
                              `,
                              buttons: ['OK'],
                              type: 'warning' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                            }
                          )
                        }
                        // */

                    }
                }
            },
            {
                label: 'Save(docx)',
                accelerator: 'CmdOrCtrl+S',
                click: async () => {
                    logger.debug('SaveDocx clicked...')

                    if (!rowData) { // undefined or empty
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
                    savedFilename = `${path.parse(filename1).name}-tr.csv`

                    savedFilename = path.join(path.parse(path.resolve(filename1)).dir, savedFilename)

                    logger.debug(' onSaveDocx savedFilename: ', savedFilename)

                    // talk to pyshell
                    try {
                        onSaveDocx()
                    } catch (e) {
                        logger.debug(`${e.name}: ${e.message}`)
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
                // accelerator: 'CmdOrCtrl+S',
                click: async () => {
                    logger.debug('SaveCsv clicked...')

                    if (!rowData) { // undefined or empty
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
                    savedFilename = `${path.parse(filename1).name}-tr.csv`

                    savedFilename = path.join(path.parse(path.resolve(filename1)).dir, savedFilename)

                    logger.debug('SaveCsv savedFilename: ', savedFilename)

                    converter.json2csv(rowData, (err, csv) => {
                        if (err) {
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
                            logger.debug('csv: ', csv.slice(0, 200))
                        } catch (e) {
                            logger.debug(e.message)
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
                    })
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
                    await shell.openExternal('https://github.com/ffreemt/deepl-tr-electron')
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

exports.menuTemplate = menuTemplate
