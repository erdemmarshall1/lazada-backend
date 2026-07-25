const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.resolve(__dirname, '..', 'src', 'locales')
const REFERENCE_FILE = 'en.json'

const TARGET_LOCALES = [
  'ar', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'ms',
  'nl', 'pl', 'pt', 'ru', 'th', 'tr', 'vi', 'zh-CN', 'zh-TW',
]

const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY

function flattenKeys(obj, prefix = '') {
  let result = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flattenKeys(v, key))
    } else {
      result[key] = typeof v === 'string' ? v : String(v)
    }
  }
  return result
}

function buildNestedFromFlat(flat) {
  const result = {}
  const keys = Object.keys(flat).sort()
  for (const key of keys) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {}
      }
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = flat[key]
  }
  return result
}

function getFileFormat(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim()
    if (content.startsWith('[')) return 'array'
    if (content.startsWith('{')) return 'object'
    return 'unknown'
  } catch {
    return 'missing'
  }
}

function parseArrayFormat(content) {
  const seen = {}
  const result = {}
  try {
    const arr = JSON.parse(content)
    function walk(item, contextPrefix) {
      if (Array.isArray(item)) {
        item.forEach(sub => walk(sub, contextPrefix))
      } else if (typeof item === 'object' && item !== null) {
        for (const [k, v] of Object.entries(item)) {
          const key = contextPrefix ? `${contextPrefix}.${k}` : k
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            walk(v, key)
          } else if (typeof v === 'string') {
            if (!seen[key]) {
              result[key] = v
              seen[key] = true
            }
          }
        }
      }
    }
    arr.forEach(item => walk(item, ''))
    return result
  } catch {
    return {}
  }
}

function parseExistingFile(filePath) {
  const format = getFileFormat(filePath)
  if (format === 'missing') return {}
  const content = fs.readFileSync(filePath, 'utf-8')
  if (format === 'array') {
    return parseArrayFormat(content)
  }
  if (format === 'object') {
    try {
      return flattenKeys(JSON.parse(content))
    } catch {
      return {}
    }
  }
  return {}
}

async function translateBatch(texts, targetLang) {
  if (!GOOGLE_API_KEY || texts.length === 0) return texts

  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`
  const maxBatch = 128
  const results = new Array(texts.length).fill(null)

  for (let i = 0; i < texts.length; i += maxBatch) {
    const batch = texts.slice(i, i + maxBatch)
    const body = {
      q: batch,
      target: targetLang,
      format: 'text',
    }

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await resp.json()
      if (data.data && data.data.translations) {
        data.data.translations.forEach((t, idx) => {
          results[i + idx] = t.translatedText
        })
      }
    } catch (err) {
      console.error(`  Translate batch failed for ${targetLang}: ${err.message}`)
    }
  }

  return results.map((r, idx) => r || texts[idx])
}

async function generate() {
  console.log('\n\x1b[36m=== Translation Generator ===\x1b[0m\n')

  const refPath = path.join(LOCALES_DIR, REFERENCE_FILE)
  let refObj
  try {
    refObj = JSON.parse(fs.readFileSync(refPath, 'utf-8'))
  } catch {
    console.error(`Failed to parse ${REFERENCE_FILE}`)
    process.exit(1)
  }

  const refFlat = flattenKeys(refObj)
  const refKeys = Object.keys(refFlat)
  const refValues = Object.values(refFlat)
  console.log(`Reference: \x1b[33m${refKeys.length}\x1b[0m keys loaded from ${REFERENCE_FILE}`)

  if (GOOGLE_API_KEY) {
    console.log('Google Translate API: \x1b[32mkey found\x1b[0m')
  } else {
    console.log('Google Translate API: \x1b[33mno key set\x1b[0m (values will remain as English/fallback)')
    console.log('  Set GOOGLE_TRANSLATE_API_KEY env var to enable translations.\n')
  }

  for (const locale of TARGET_LOCALES) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    const existing = parseExistingFile(filePath)
    const existingKeyCount = Object.keys(existing).length
    console.log(`\n\x1b[1m${locale}\x1b[0m (${existingKeyCount} existing values)`)

    const newFlat = {}

    if (locale === 'zh-TW' && GOOGLE_API_KEY) {
      for (const key of refKeys) {
        newFlat[key] = refFlat[key]
      }
      const allTexts = refKeys.map(k => refFlat[k])
      console.log(`  Translating ${allTexts.length} strings via Google API...`)
      const translatedTexts = await translateBatch(allTexts, 'zh-TW')
      refKeys.forEach((key, idx) => {
        newFlat[key] = translatedTexts[idx]
      })
    } else if (locale === 'zh-CN' && GOOGLE_API_KEY) {
      for (const key of refKeys) {
        newFlat[key] = refFlat[key]
      }
      const allTexts = refKeys.map(k => refFlat[k])
      console.log(`  Translating ${allTexts.length} strings via Google API...`)
      const translatedTexts = await translateBatch(allTexts, 'zh-CN')
      refKeys.forEach((key, idx) => {
        newFlat[key] = translatedTexts[idx]
      })
    } else {
      for (const key of refKeys) {
        const existingVal = existing[key]
        if (existingVal && existingVal !== refFlat[key]) {
          newFlat[key] = existingVal
        } else {
          newFlat[key] = refFlat[key]
        }
      }

      if (GOOGLE_API_KEY) {
        const toTranslate = refKeys.filter(k => !existing[k] || existing[k] === refFlat[k])
        if (toTranslate.length > 0) {
          const textsToTranslate = toTranslate.map(k => refFlat[k])
          console.log(`  Translating ${textsToTranslate.length} strings via Google API...`)
          const translatedTexts = await translateBatch(textsToTranslate, locale === 'zh-TW' ? 'zh-TW' : locale)
          toTranslate.forEach((key, idx) => {
            newFlat[key] = translatedTexts[idx]
          })
          console.log(`  Translated ${translatedTexts.length} strings`)
        } else {
          console.log('  All values already appear translated, skipping API call')
        }
      } else {
        const sameAsEnglish = refKeys.filter(k => existing[k] === refFlat[k] || !existing[k]).length
        console.log(`  ${sameAsEnglish} keys still have English values (no API key)`)
      }
    }

    const nested = buildNestedFromFlat(newFlat)
    const output = JSON.stringify(nested, null, 2) + '\n'
    fs.writeFileSync(filePath, output, 'utf-8')
    console.log(`  Written: \x1b[90m${locale}.json\x1b[0m (\x1b[33m${Object.keys(newFlat).length}\x1b[0m keys)`)
  }

  console.log('\n\x1b[32m=== Generation Complete ===\x1b[0m\n')
  if (!GOOGLE_API_KEY) {
    console.log('\x1b[33mNOTE:\x1b[0m To translate values, set GOOGLE_TRANSLATE_API_KEY and re-run.')
    console.log('  All locale files now have the correct nested-object format.\n')
  }
}

generate().catch(err => {
  console.error('Generation failed:', err)
  process.exit(1)
})