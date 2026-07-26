const translate = require('google-translate-api-x');

const TARGET_LANGS = [
  'zh-CN', 'zh-TW', 'vi', 'de', 'fr', 'ja', 'es', 'ko', 'pt',
  'ru', 'it', 'th', 'ar', 'tr', 'nl', 'pl', 'hi', 'id', 'ms',
];

const LANG_MAP = {
  'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'vi': 'vi', 'de': 'de',
  'fr': 'fr', 'ja': 'ja', 'es': 'es', 'ko': 'ko', 'pt': 'pt',
  'ru': 'ru', 'it': 'it', 'th': 'th', 'ar': 'ar', 'tr': 'tr',
  'nl': 'nl', 'pl': 'pl', 'hi': 'hi', 'id': 'id', 'ms': 'ms',
};

const translating = new Set();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function translateText(text, targetLang, retries = 3) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return text;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const code = LANG_MAP[targetLang] || targetLang;
      const result = await translate(text, { to: code });
      await sleep(300 + Math.random() * 200);
      return result.text || text;
    } catch (err) {
      if (err.message && err.message.includes('BAD_REQUEST')) return text;
      await sleep(2000 * (attempt + 1));
    }
  }
  return text;
}

function fieldExists(doc, field, lang) {
  if (!doc.translations) return false;
  const t = doc.translations[field];
  if (!t) return false;
  return t.get ? !!t.get(lang) : !!t[lang];
}

async function autoTranslateDocument(doc, fields) {
  const id = doc._id?.toString();
  if (!id || translating.has(id)) return;
  translating.add(id);

  try {
    let modified = false;
    if (!doc.translations) {
      doc.translations = {};
      modified = true;
    }

    for (const field of fields) {
      const val = doc[field];
      if (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) continue;

      for (const lang of TARGET_LANGS) {
        if (!fieldExists(doc, field, lang)) {
          const text = Array.isArray(val) ? val.join(',') : String(val);
          const translated = await translateText(text, lang);
          if (translated && translated !== text) {
            if (!doc.translations[field]) doc.translations[field] = {};
            doc.translations[field][lang] = translated;
            modified = true;
          }
        }
      }
    }

    if (modified) {
      await doc.constructor.updateOne({ _id: doc._id }, { $set: { translations: doc.translations } });
    }
  } catch (e) {
    console.warn(`Auto-translate error for ${doc.constructor?.modelName || 'document'} ${doc._id}: ${e.message}`);
  } finally {
    translating.delete(id);
  }
}

module.exports = { autoTranslateDocument };
