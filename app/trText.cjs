const splitText = require('./splitText.cjs')
const zipLongest = require('./zipLongest.cjs')
// const deeplTranslate = require('./deeplTranslate.cjs')
const deeplTranslate = require('deeplx-tr-node')

// vec1.extend(vec2) -> vec1.concat(vec2): vec1.concat([...zipLongest()])
// lst = [[1, 2, 3], [4, 5, 6]]
// [*zip(*lst)] -> transpose: lst[0].map((_, idx) => lst.map(el => el[idx]))

const logger = require('tracer').colorConsole({
  // format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info' // set TRACER_DEBUG=debug
})

const trText = async (text, fromLang = null, toLang = null, limit = null) => {
  /*
    const splitText = require('./src/splitText');const zipLongest = require('./src/zipLongest');const deeplTranslate = require('./src/deeplTranslate');

    ch = splitText(text)
    el = ch[0]
  */

  // for some reason, text following / is ignored, hence the subs
  // text = text.replace(/\//g, '-')  // no need for deeplx-tr-node

  logger.debug('\n\tfromLang, toLang = ', fromLang, toLang)

  if (toLang === null) {
    if (fromLang === null) toLang = 'zh'
    else {
      if (fromLang !== 'zh')  toLang = 'zh'
      else toLang = 'en'
    }
  }

  logger.debug('\n\tfromLang, toLang', fromLang, toLang)

  let res = []
  // splitText(text).forEach( el =>
  for (const el of splitText(text)) {
    let trel
    try {
      // trel = await deeplTranslate(el, fromLang, to_lang)

      // await deeplTranslate({ text: 'test  this and \n\n that', toLang: 'zh', fromLang: 'en' })
      // { alternatives: [], text: '测试这个和\n\n 那个' }
      let text = el
      let trtext = await deeplTranslate({ text, fromLang, toLang })
      logger.debug('\n\t input: %j', { text, fromLang, toLang })
      logger.debug('**** trtext', trtext)

      trel = trtext.text
    } catch (e) {
      logger.error(e)
      trel = e.name + ': ' + e.message
    }


    // logger.debug(typeof trel)
    if (el.split(/[\r\n]+/).length !== trel.split(/[\r\n]+/).length) {
      logger.warn(' text paras # and trtext paras # not equal \n\t this may indicate a potential problem, but we proceed nevertheless ')
    }
    res = res.concat([...zipLongest(el.split(/[\r\n]+/), trel.split(/[\r\n]+/))])
  }
  return res
}

module.exports = trText
