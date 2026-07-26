const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const translate = require('google-translate-api-x');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/outnet';

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

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RESUME_FILE = args.find(a => a.startsWith('--resume='))?.split('=')[1];
const TYPE_FILTER = args.find(a => a.startsWith('--type='))?.split('=')[1];
const SKIP_LIST = args.filter(a => a.startsWith('--skip=')).map(a => a.split('=')[1]);

const BATCH_SIZE = 5;
let checkpoint = {};

if (RESUME_FILE) {
  try { checkpoint = JSON.parse(require('fs').readFileSync(RESUME_FILE, 'utf8')); }
  catch { console.log('No valid resume file, starting fresh'); }
}

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
      if (err.message && err.message.includes('BAD_REQUEST')) {
        console.log(`  [skip] ${targetLang}: BAD_REQUEST for "${text.substring(0, 30)}..."`);
        return text;
      }
      const wait = 2000 * (attempt + 1);
      console.log(`  [retry ${attempt + 1}/${retries}] ${targetLang}: ${err.message.substring(0, 60)}, waiting ${wait}ms`);
      await sleep(wait);
    }
  }
  return text;
}

const DIRECTION_KEY = Symbol('direction');

function shouldTranslate(doc, lang, field) {
  if (!doc.translations) return true
  const t = doc.translations[field]
  if (!t) return true
  const val = t.get ? t.get(lang) : t[lang]
  return !val
}

function setTranslation(doc, lang, field, value) {
  if (!doc.translations) doc.translations = {}
  if (!doc.translations[field]) doc.translations[field] = {}
  if (doc.translations[field].set) {
    doc.translations[field].set(lang, value)
  } else {
    doc.translations[field][lang] = value
  }
}

async function translateSingleField(doc, lang, field, alreadyTranslated, checkpointKey) {
  const suffixed = `${checkpointKey || field}_${lang}`
  if (doc[DIRECTION_KEY]?.has?.(suffixed)) return
  if (!alreadyTranslated && shouldTranslate(doc, lang, field)) {
    const translated = await translateText(doc[field], lang)
    setTranslation(doc, lang, field, translated)
  }
}

async function translateArrayField(doc, lang, field) {
  if (shouldTranslate(doc, lang, field)) {
    const arr = doc[field]
    if (Array.isArray(arr) && arr.length > 0) {
      const translated = await translateText(arr.join(','), lang)
      setTranslation(doc, lang, field, translated)
    }
  }
}

function translateSingle(lang) {
  return async (doc, ...args) => translateSingleField(doc, lang, ...args)
}

async function translateGeneral(name, Model, fields, fieldConfigs, options = {}) {
  if (TYPE_FILTER && TYPE_FILTER !== name) return
  if (SKIP_LIST.includes(name)) { console.log(`Skipping ${name}...`); return }

  console.log(`\n=== Translating ${name} ===`);
  const query = {};
  if (checkpoint[name]) query._id = { $gt: checkpoint[name] };
  const total = await Model.countDocuments(query);
  if (total === 0) { console.log(`No ${name} found.`); return }
  console.log(`${name} to process: ${total}`);

  const cursor = Model.find(query).sort({ _id: 1 }).cursor();
  let count = 0;
  for await (const doc of cursor) {
    const processed = new Set()
    doc[DIRECTION_KEY] = processed
    for (const lang of TARGET_LANGS) {
      for (const f of fields) {
        await translateSingleField(doc, lang, f, false, name)
      }
      if (fieldConfigs?.arrayFields) {
        for (const f of fieldConfigs.arrayFields) {
          await translateArrayField(doc, lang, f)
        }
      }
      if (fieldConfigs?.custom) {
        await fieldConfigs.custom(doc, lang)
      }
    }
    delete doc[DIRECTION_KEY]
    if (!DRY_RUN) {
      doc.markModified('translations')
      await doc.save()
    }
    count++
    if (count % 10 === 0) console.log(`  ${name}: ${count}/${total} processed`)
    checkpoint[name] = doc._id
    if (DRY_RUN && count >= 5) { console.log(`  Dry-run: ${name} stopping after 5`); break }
  }
  if (total > 0) console.log(`Done: ${count}/${total} ${name} processed.`)
}

async function translateProducts(Product) {
  if (TYPE_FILTER && TYPE_FILTER !== 'Product') return
  if (SKIP_LIST.includes('Product')) { console.log('Skipping Product...'); return }

  console.log('\n=== Translating Products ===');
  const query = {};
  if (checkpoint.Product) query._id = { $gt: checkpoint.Product };
  const all = await Product.countDocuments(query);
  if (all === 0) { console.log('No products to process.'); return }

  const cursor = Product.find(query).sort({ _id: 1 }).cursor();
  let count = 0, total = 0;

  for await (const product of cursor) {
    total++
    const processed = new Set()
    product[DIRECTION_KEY] = processed

    for (const lang of TARGET_LANGS) {
      await translateSingleField(product, lang, 'name', false, 'ProductName')
      await translateSingleField(product, lang, 'description', false, 'ProductDesc')
      await translateArrayField(product, lang, 'tags')

      // Collect and translate SKU attribute names and values
      if (product.skus) {
        for (const sku of product.skus) {
          if (sku.attrs) {
            for (const attr of sku.attrs) {
              const nameKey = `${attr.name}_${lang}`
              if (!processed.has(`skuName_${nameKey}`)) {
                processed.add(`skuName_${nameKey}`)
                const existing = product.translations?.skuAttrNames?.get?.(nameKey) || product.translations?.skuAttrNames?.[nameKey]
                if (!existing) {
                  const translated = await translateText(attr.name, lang)
                  setTranslation(product, lang, 'skuAttrNames', nameKey)
                  if (product.translations.skuAttrNames.set) {
                    product.translations.skuAttrNames.set(nameKey, translated)
                  } else {
                    product.translations.skuAttrNames[nameKey] = translated
                  }
                }
              }
              const valueKey = `${attr.value}_${lang}`
              if (!processed.has(`skuValue_${valueKey}`)) {
                processed.add(`skuValue_${valueKey}`)
                const existing = product.translations?.skuAttrValues?.get?.(valueKey) || product.translations?.skuAttrValues?.[valueKey]
                if (!existing) {
                  const translated = await translateText(attr.value, lang)
                  if (!product.translations.skuAttrValues) product.translations.skuAttrValues = {}
                  if (product.translations.skuAttrValues.set) {
                    product.translations.skuAttrValues.set(valueKey, translated)
                  } else {
                    product.translations.skuAttrValues[valueKey] = translated
                  }
                }
              }
            }
          }
        }
      }
    }
    delete product[DIRECTION_KEY]
    if (!DRY_RUN) {
      product.markModified('translations')
      await product.save()
    }
    count++
    if (count % 5 === 0) console.log(`  Products: ${count} processed`)
    checkpoint.Product = product._id
    if (DRY_RUN && count >= 3) { console.log('  Dry-run: stopping after 3'); break }
  }
  if (total > 0) console.log(`Done: ${count} products processed.`)
}

async function translateCategories(Category) {
  if (TYPE_FILTER && TYPE_FILTER !== 'Category') return
  if (SKIP_LIST.includes('Category')) { console.log('Skipping Category...'); return }
  console.log('\n=== Translating Categories ===');
  const query = {};
  if (checkpoint.Category) query._id = { $gt: checkpoint.Category };
  const total = await Category.countDocuments(query);
  if (total === 0) { console.log('All categories already have translations.'); return }
  console.log(`Categories to translate: ${total}`);
  const cursor = Category.find(query).sort({ _id: 1 }).cursor();
  let count = 0;
  for await (const cat of cursor) {
    const processed = new Set()
    cat[DIRECTION_KEY] = processed
    for (const lang of TARGET_LANGS) {
      await translateSingleField(cat, lang, 'name', false, 'Category')
    }
    delete cat[DIRECTION_KEY]
    if (!DRY_RUN) { cat.markModified('translations'); await cat.save() }
    count++
    checkpoint.Category = cat._id
    if (count % 10 === 0) console.log(`  Categories: ${count}/${total}`)
    if (DRY_RUN && count >= 5) { console.log('  Dry-run: stopping after 5'); break }
  }
  console.log(`Done: ${count} categories processed.`)
}

async function translateMenus(Menu) {
  if (TYPE_FILTER && TYPE_FILTER !== 'Menu') return
  if (SKIP_LIST.includes('Menu')) { console.log('Skipping Menu...'); return }
  console.log('\n=== Translating Menus ===');
  const menus = await Menu.find({});
  if (menus.length === 0) { console.log('No menus found.'); return }
  let count = 0;
  for (const menu of menus) {
    const processed = new Set()
    menu[DIRECTION_KEY] = processed
    function walkItems(items, prefix) {
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const key = `${prefix}${i}_label`
        for (const lang of TARGET_LANGS) {
          const fullKey = `${key}_${lang}`
          if (processed.has(fullKey)) continue
          processed.add(fullKey)
          const existing = menu.translations?.labels?.get?.(fullKey) || menu.translations?.labels?.[fullKey]
          if (!existing) {
            translateText(items[i].label, lang).then(translated => {
              if (!menu.translations) menu.translations = {}
              if (!menu.translations.labels) menu.translations.labels = {}
              const labels = menu.translations.labels
              labels[fullKey] = translated
            })
          }
        }
        if (items[i].children) walkItems(items[i].children, `${key}_children_`)
      }
    }
    walkItems(menu.items, '')
    await sleep(2000) // wait for pending translations
    if (!DRY_RUN) { menu.markModified('translations'); await menu.save() }
    count++
    console.log(`  Menus: ${count} processed`)
  }
  console.log(`Done: ${count} menus processed.`)
}

async function translateSystemSettings(SystemSettings) {
  if (TYPE_FILTER && TYPE_FILTER !== 'SystemSettings') return
  if (SKIP_LIST.includes('SystemSettings')) { console.log('Skipping SystemSettings...'); return }
  const settings = await SystemSettings.findOne()
  if (!settings || !settings.siteName) return
  console.log('\n=== Translating SystemSettings ===')
  const processed = new Set()
  settings[DIRECTION_KEY] = processed
  for (const lang of TARGET_LANGS) {
    await translateSingleField(settings, lang, 'siteName', false, 'SystemSettings')
  }
  delete settings[DIRECTION_KEY]
  if (!DRY_RUN) await settings.save()
  console.log('Done.')
}

async function translateLiveChat(LiveChatSetting) {
  if (TYPE_FILTER && TYPE_FILTER !== 'LiveChatSetting') return
  if (SKIP_LIST.includes('LiveChatSetting')) { console.log('Skipping LiveChatSetting...'); return }
  const settings = await LiveChatSetting.findOne()
  if (!settings) return
  console.log('\n=== Translating LiveChatSetting ===')
  for (const lang of TARGET_LANGS) {
    await translateSingleField(settings, lang, 'widgetTitle')
    await translateSingleField(settings, lang, 'autoGreeting')
    await translateSingleField(settings, lang, 'offlineMessage')
  }
  if (!DRY_RUN) { settings.markModified('translations'); await settings.save() }
  console.log('Done.')
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const ProductModel = mongoose.model('Product', require('../models/Product').schema);
  const CategoryModel = mongoose.model('Category', require('../models/Category').schema);
  const MenuModel = mongoose.model('Menu', require('../models/Menu').schema);
  const PageModel = mongoose.model('Page', require('../models/Page').schema);
  const BlogModel = mongoose.model('Blog', require('../models/Blog').schema);
  const FaqModel = mongoose.model('Faq', require('../models/Faq').schema);
  const BannerModel = mongoose.model('Banner', require('../models/Banner').schema);
  const HomepageSectionModel = mongoose.model('HomepageSection', require('../models/HomepageSection').schema);
  const ShopModel = mongoose.model('Shop', require('../models/Shop').schema);
  const SystemSettingsModel = mongoose.model('SystemSettings', require('../models/SystemSettings').schema);
  const LiveChatSettingModel = mongoose.model('LiveChatSetting', require('../models/LiveChatSetting').schema);
  const ShippingMethodModel = mongoose.model('ShippingMethod', require('../models/ShippingMethod').schema);
  const PaymentSettingModel = mongoose.model('PaymentSetting', require('../models/PaymentSetting').schema);
  const TaxRateModel = mongoose.model('TaxRate', require('../models/TaxRate').schema);
  const CurrencyModel = mongoose.model('Currency', require('../models/Currency').schema);
  const CouponModel = mongoose.model('Coupon', require('../models/Coupon').schema);

  const contentTypes = []

  contentTypes.push({
    name: 'Product',
    run: () => translateProducts(ProductModel),
  })

  contentTypes.push({
    name: 'Category',
    run: () => translateCategories(CategoryModel),
  })

  contentTypes.push({
    name: 'Page',
    run: () => translateGeneral('Page', PageModel,
      ['title', 'content', 'summary', 'metaTitle', 'metaDescription']),
  })
  contentTypes.push({
    name: 'Blog',
    run: () => translateGeneral('Blog', BlogModel,
      ['title', 'content', 'summary', 'category', 'author'],
      { arrayFields: ['tags'] }),
  })
  contentTypes.push({
    name: 'Faq',
    run: () => translateGeneral('Faq', FaqModel, ['question', 'answer', 'category']),
  })
  contentTypes.push({
    name: 'Banner',
    run: () => translateGeneral('Banner', BannerModel, ['title']),
  })
  contentTypes.push({
    name: 'HomepageSection',
    run: () => translateGeneral('HomepageSection', HomepageSectionModel,
      ['title', 'subtitle', 'configText', 'configHtml']),
  })
  contentTypes.push({
    name: 'Shop',
    run: () => translateGeneral('Shop', ShopModel,
      ['name', 'description', 'address', 'closedReason']),
  })
  contentTypes.push({
    name: 'ShippingMethod',
    run: () => translateGeneral('ShippingMethod', ShippingMethodModel,
      ['name', 'carrier', 'estimatedDays', 'regions']),
  })
  contentTypes.push({
    name: 'PaymentSetting',
    run: () => translateGeneral('PaymentSetting', PaymentSettingModel, ['label']),
  })
  contentTypes.push({
    name: 'TaxRate',
    run: () => translateGeneral('TaxRate', TaxRateModel, ['name', 'region']),
  })
  contentTypes.push({
    name: 'Currency',
    run: () => translateGeneral('Currency', CurrencyModel, ['name']),
  })
  contentTypes.push({
    name: 'Coupon',
    run: () => translateGeneral('Coupon', CouponModel, ['description']),
  })
  contentTypes.push({
    name: 'Menu',
    run: () => translateMenus(MenuModel),
  })
  contentTypes.push({
    name: 'SystemSettings',
    run: () => translateSystemSettings(SystemSettingsModel),
  })
  contentTypes.push({
    name: 'LiveChatSetting',
    run: () => translateLiveChat(LiveChatSettingModel),
  })

  for (const ct of contentTypes) {
    try {
      await ct.run()
    } catch (e) {
      console.error(`Error during ${ct.name}: ${e.message}`)
    }
    if (RESUME_FILE) {
      require('fs').writeFileSync(RESUME_FILE, JSON.stringify(checkpoint, null, 2))
      console.log(`Checkpoint saved to ${RESUME_FILE}`)
    }
  }

  console.log('\nAll done!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
