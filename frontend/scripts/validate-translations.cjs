const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.resolve(__dirname, '../src/locales')
const REFERENCE_FILE = path.join(LOCALES_DIR, 'en.json')

function getLeafPaths(obj, prefix = '') {
  let paths = []
  for (const [key, val] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      paths.push(...getLeafPaths(val, currentPath))
    } else {
      paths.push(currentPath)
    }
  }
  return paths
}

function getValueByPath(obj, path) {
  return path.split('.').reduce((cur, key) => cur && cur[key], obj)
}

function main() {
  const reference = JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'))
  const refPaths = getLeafPaths(reference)
  const totalKeys = refPaths.length

  console.log(`\nTranslation Validation Report`)
  console.log(`=============================`)
  console.log(`Reference (en.json): ${totalKeys} translation keys\n`)

  const files = fs.readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json') && f !== 'en.json')
    .sort()

  let totalMissing = 0
  let totalEnglish = 0

  for (const file of files) {
    const filePath = path.join(LOCALES_DIR, file)
    const locale = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    let missing = 0
    let englishCount = 0

    for (const p of refPaths) {
      const val = getValueByPath(locale, p)
      if (val === undefined || val === null) {
        missing++
      } else {
        const refVal = getValueByPath(reference, p)
        if (val === refVal) {
          englishCount++
        }
      }
    }

    const translated = totalKeys - missing
    const pct = ((translated / totalKeys) * 100).toFixed(1)
    totalMissing += missing
    totalEnglish += englishCount

    if (missing > 0 || englishCount > 0) {
      console.log(`  ${file}:`)
      console.log(`    Keys present: ${translated}/${totalKeys} (${pct}%)`)
      if (missing > 0) console.log(`    Missing keys: ${missing}`)
      if (englishCount > 0) console.log(`    Untranslated (still English): ${englishCount}`)
    }
  }

  const avgPct = ((1 - totalMissing / (totalKeys * files.length)) * 100).toFixed(1)
  console.log(`\nSummary:`)
  console.log(`  Files checked: ${files.length}`)
  console.log(`  Total missing keys: ${totalMissing}`)
  console.log(`  Total untranslated keys: ${totalEnglish}`)
  console.log(`  Average coverage: ${avgPct}%\n`)
}

main()
