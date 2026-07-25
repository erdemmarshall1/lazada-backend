const fs = require('fs')
const path = require('path')
const translate = require('google-translate-api-x')

const LOCALES_DIR = path.resolve(__dirname, '../src/locales')
const REFERENCE_FILE = path.join(LOCALES_DIR, 'en.json')

const LANG_MAP = {
  'ar': 'ar', 'de': 'de', 'es': 'es', 'fr': 'fr', 'hi': 'hi',
  'id': 'id', 'it': 'it', 'ja': 'ja', 'ko': 'ko', 'ms': 'ms',
  'nl': 'nl', 'pl': 'pl', 'pt': 'pt', 'ru': 'ru', 'th': 'th',
  'tr': 'tr', 'vi': 'vi', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW',
}

const BATCH_SIZE = 50
const DELAY_MS = 500
const SKIP_FILES = []

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function getLeafEntries(obj, prefix = '') {
  const entries = []
  for (const [key, val] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      entries.push(...getLeafEntries(val, currentPath))
    } else {
      entries.push({ path: currentPath, value: val })
    }
  }
  return entries
}

function setValue(obj, path, value) {
  const keys = path.split('.')
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
}

async function translateLocale(localeFile, targetLang, refEntries) {
  const filePath = path.join(LOCALES_DIR, localeFile)
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const leafEntries = getLeafEntries(locale)
  const refMap = new Map(refEntries.map(e => [e.path, e.value]))

  const toTranslate = leafEntries.filter(e => {
    const refVal = refMap.get(e.path)
    return refVal !== undefined && e.value === refVal
  })

  if (toTranslate.length === 0) {
    console.log(`  ${localeFile}: nothing to translate`)
    return
  }

  console.log(`  ${localeFile}: translating ${toTranslate.length} keys...`)

  let translated = 0
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE)
    const texts = batch.map(e => e.value)

    try {
      const results = await translate(texts, { to: targetLang, rejectOnPartialFail: false })
      for (let j = 0; j < batch.length; j++) {
        setValue(locale, batch[j].path, results[j].text)
      }
      translated += batch.length
      process.stdout.write(`\r    Progress: ${translated}/${toTranslate.length}`)
      await sleep(DELAY_MS)
    } catch (err) {
      console.error(`\n    Error translating batch starting at index ${i}: ${err.message}`)
      console.log('    Waiting 10s before retry...')
      await sleep(10000)
      i -= BATCH_SIZE
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + '\n', 'utf-8')
  console.log(`\n    ✓ Done. ${translated} keys translated.`)
}

async function main() {
  const reference = JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'))
  const refEntries = getLeafEntries(reference)

  console.log(`Auto-Translate Locales\n`)
  console.log(`Reference: en.json (${refEntries.length} keys)\n`)

  const files = fs.readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json') && f !== 'en.json' && !SKIP_FILES.includes(f))
    .sort()

  for (const file of files) {
    const lang = file.replace('.json', '')
    const targetLang = LANG_MAP[lang]
    if (!targetLang) {
      console.log(`  ${file}: unknown language code '${lang}', skipping`)
      continue
    }
    await translateLocale(file, targetLang, refEntries)
    console.log('')
  }

  console.log(`Done. ${files.length} locales processed.`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
