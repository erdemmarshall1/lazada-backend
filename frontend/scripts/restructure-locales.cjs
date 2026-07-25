const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.resolve(__dirname, '../src/locales')
const REFERENCE_FILE = path.join(LOCALES_DIR, 'en.json')

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function setNestedValue(obj, pathStr, value) {
  const keys = pathStr.split('.')
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
}

function getLeafEntries(obj, prefix = '') {
  const entries = []
  for (const [key, val] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      entries.push(...getLeafEntries(val, p))
    } else {
      entries.push({ path: p, value: val })
    }
  }
  return entries
}

function extractLeafKeys(obj) {
  const keys = new Set()
  function walk(o) {
    for (const [k, v] of Object.entries(o)) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) walk(v)
      else keys.add(k)
    }
  }
  walk(obj)
  return keys
}

function findCommonParent(keyToPaths, leafKeys) {
  const candidates = {}

  for (const key of leafKeys) {
    const paths = keyToPaths[key]
    if (!paths) continue
    for (const p of paths) {
      const parts = p.split('.')
      for (let i = 0; i < parts.length - 1; i++) {
        const prefix = parts.slice(0, i + 1).join('.')
        candidates[prefix] = (candidates[prefix] || 0) + 1
      }
    }
  }

  let bestPrefix = null
  let bestScore = 0
  for (const [prefix, score] of Object.entries(candidates)) {
    if (score > bestScore) {
      bestScore = score
      bestPrefix = prefix
    }
  }

  return bestPrefix
}

function buildNestedFromArray(arr, reference) {
  const result = deepClone(reference)
  const refEntries = getLeafEntries(reference)

  const keyToPaths = {}
  for (const { path: p } of refEntries) {
    const key = p.split('.').pop()
    if (!keyToPaths[key]) keyToPaths[key] = []
    keyToPaths[key].push(p)
  }

  for (const item of arr) {
    const leafKeys = extractLeafKeys(item)
    const parentPath = findCommonParent(keyToPaths, leafKeys)

    if (!parentPath) continue

    function walk(o, currentPrefix) {
      for (const [k, v] of Object.entries(o)) {
        const fullPath = currentPrefix ? `${currentPrefix}.${k}` : k
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          walk(v, fullPath)
        } else {
          const mappedPath = `${parentPath}.${k}`
          setNestedValue(result, mappedPath, v)
        }
      }
    }
    walk(item, '')
  }

  return result
}

function main() {
  const reference = JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'))
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json') && f !== 'en.json')

  for (const file of files) {
    const filePath = path.join(LOCALES_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const arr = JSON.parse(content)

    if (!Array.isArray(arr)) {
      console.log(`  Skipping ${file} — already an object`)
      continue
    }

    const restructured = buildNestedFromArray(arr, reference)
    fs.writeFileSync(filePath, JSON.stringify(restructured, null, 2) + '\n', 'utf-8')
    console.log(`  ✓ ${file} restructured (${arr.length} array elements → nested object)`)
  }

  console.log(`\nDone. ${files.length} locale files restructured.`)
}

main()
