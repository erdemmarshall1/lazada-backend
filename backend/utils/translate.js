const SUPPORTED_LANGS = [
  'en', 'zh-CN', 'zh-TW', 'vi', 'de', 'fr', 'ja', 'es', 'ko', 'pt',
  'ru', 'it', 'th', 'ar', 'tr', 'nl', 'pl', 'hi', 'id', 'ms',
]

function getLang(req) {
  const code = req?.headers?.lang || req?.query?.lang || 'en'
  return SUPPORTED_LANGS.includes(code) ? code : 'en'
}

function applyTranslation(doc, lang, fields) {
  if (!doc || lang === 'en' || !doc.translations) return doc
  const docObj = doc.toObject ? doc.toObject() : doc
  for (const field of fields) {
    const transMap = docObj.translations?.[field]
    if (transMap && transMap[lang]) {
      docObj[field] = transMap[lang]
    }
  }
  return docObj
}

function applyTranslationTags(doc, lang, field) {
  if (!doc || lang === 'en' || !doc.translations) return doc
  const docObj = doc.toObject ? doc.toObject() : doc
  const transMap = docObj.translations?.[field]
  if (transMap && transMap[lang]) {
    docObj[field] = transMap[lang].split(',').map(s => s.trim()).filter(Boolean)
  }
  return docObj
}

function applyTranslationSkuAttrs(doc, lang) {
  if (!doc || lang === 'en' || !doc.translations || !doc.skus) return doc
  const docObj = doc.toObject ? doc.toObject() : doc
  const nameMap = docObj.translations?.skuAttrNames || {}
  const valueMap = docObj.translations?.skuAttrValues || {}
  for (const sku of docObj.skus) {
    if (!sku.attrs) continue
    for (const attr of sku.attrs) {
      const nameKey = `${attr.name}_${lang}`
      if (nameMap[nameKey]) attr.name = nameMap[nameKey]
      const valueKey = `${attr.value}_${lang}`
      if (valueMap[valueKey]) attr.value = valueMap[valueKey]
    }
  }
  return docObj
}

function applyTranslationMenu(doc, lang) {
  if (!doc || lang === 'en' || !doc.translations) return doc
  const docObj = doc.toObject ? doc.toObject() : doc
  const labels = docObj.translations?.labels || {}
  function walkItems(items, prefix) {
    if (!items) return items
    for (let i = 0; i < items.length; i++) {
      const key = `${prefix}${i}_label_${lang}`
      if (labels[key]) items[i].label = labels[key]
      if (items[i].children) walkItems(items[i].children, `${prefix}${i}_children_`)
    }
    return items
  }
  docObj.items = walkItems(docObj.items, '')
  return docObj
}

function applyTranslationNested(doc, lang, parentField, fields) {
  if (!doc || lang === 'en' || !doc.translations) return doc
  const docObj = doc.toObject ? doc.toObject() : doc
  for (const field of fields) {
    const transKey = `${parentField}${field.charAt(0).toUpperCase() + field.slice(1)}`
    const transMap = docObj.translations?.[transKey]
    if (transMap && transMap[lang] && docObj[parentField]) {
      docObj[parentField][field] = transMap[lang]
    }
  }
  return docObj
}

module.exports = {
  SUPPORTED_LANGS, getLang, applyTranslation,
  applyTranslationTags, applyTranslationSkuAttrs,
  applyTranslationMenu, applyTranslationNested,
}
