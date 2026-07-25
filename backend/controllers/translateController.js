const Product = require('../models/Product');
const Category = require('../models/Category');
const Menu = require('../models/Menu');
const Page = require('../models/Page');
const Blog = require('../models/Blog');
const Faq = require('../models/Faq');
const Banner = require('../models/Banner');
const HomepageSection = require('../models/HomepageSection');
const Shop = require('../models/Shop');
const SystemSettings = require('../models/SystemSettings');
const LiveChatSetting = require('../models/LiveChatSetting');
const ShippingMethod = require('../models/ShippingMethod');
const PaymentSetting = require('../models/PaymentSetting');
const TaxRate = require('../models/TaxRate');
const Currency = require('../models/Currency');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const { success, fail } = require('../utils/response');
const { SUPPORTED_LANGS } = require('../utils/translate');

const MODELS = { Product, Category, Menu, Page, Blog, Faq, Banner, HomepageSection, Shop, SystemSettings, LiveChatSetting, ShippingMethod, PaymentSetting, TaxRate, Currency, Coupon, Notification }

exports.updateTranslation = async (req, res) => {
  try {
    const { contentId, model, field, lang, value } = req.body
    if (!contentId || !model || !field || !lang || value == null) {
      return res.json(fail('contentId, model, field, lang, and value are required'))
    }
    if (!SUPPORTED_LANGS.includes(lang)) {
      return res.json(fail(`Unsupported language: ${lang}`))
    }
    if (!MODELS[model]) {
      return res.json(fail(`Unsupported model: ${model}`))
    }
    const Model = MODELS[model]
    const doc = await Model.findById(contentId)
    if (!doc) return res.json(fail('Document not found'))

    if (!doc.translations) doc.translations = {}
    if (!doc.translations[field]) doc.translations[field] = {}
    doc.translations[field][lang] = value
    doc.markModified('translations')
    await doc.save()

    res.json(success({ contentId, model, field, lang, value }))
  } catch (error) {
    res.json(fail(error.message))
  }
}

exports.batchUpdateTranslations = async (req, res) => {
  try {
    const { contentId, model, translations } = req.body
    if (!contentId || !model || !Array.isArray(translations) || translations.length === 0) {
      return res.json(fail('contentId, model, and translations array are required'))
    }
    if (!MODELS[model]) {
      return res.json(fail(`Unsupported model: ${model}`))
    }
    const Model = MODELS[model]
    const doc = await Model.findById(contentId)
    if (!doc) return res.json(fail('Document not found'))

    if (!doc.translations) doc.translations = {}
    for (const { field, lang, value } of translations) {
      if (!field || !lang || value == null) continue
      if (!SUPPORTED_LANGS.includes(lang)) continue
      if (!doc.translations[field]) doc.translations[field] = {}
      doc.translations[field][lang] = value
    }
    doc.markModified('translations')
    await doc.save()

    res.json(success({ contentId, model, count: translations.length }))
  } catch (error) {
    res.json(fail(error.message))
  }
}

exports.getTranslations = async (req, res) => {
  try {
    const { contentId, model } = req.query
    if (!contentId || !model) {
      return res.json(fail('contentId and model are required'))
    }
    if (!MODELS[model]) {
      return res.json(fail(`Unsupported model: ${model}`))
    }
    const Model = MODELS[model]
    const doc = await Model.findById(contentId).select('translations')
    if (!doc) return res.json(fail('Document not found'))

    res.json(success(doc.translations || {}))
  } catch (error) {
    res.json(fail(error.message))
  }
}

exports.listUntranslated = async (req, res) => {
  try {
    const { model, lang, field, limit } = req.query
    if (!model || !lang || !field) {
      return res.json(fail('model, lang, and field are required'))
    }
    if (!SUPPORTED_LANGS.includes(lang)) {
      return res.json(fail(`Unsupported language: ${lang}`))
    }
    if (!MODELS[model]) {
      return res.json(fail(`Unsupported model: ${model}`))
    }
    const Model = MODELS[model]
    const query = {
      $or: [
        { [`translations.${field}.${lang}`]: { $exists: false } },
        { [`translations.${field}.${lang}`]: null },
        { [`translations.${field}.${lang}`]: '' },
      ],
    }
    const docs = await Model.find(query)
      .select(`_id name ${field}`)
      .limit(parseInt(limit) || 50)
      .lean()

    res.json(success(docs))
  } catch (error) {
    res.json(fail(error.message))
  }
}
