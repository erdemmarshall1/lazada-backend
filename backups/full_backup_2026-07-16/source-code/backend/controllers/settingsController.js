const Setting = require('../models/Setting');
const TaxRate = require('../models/TaxRate');
const Currency = require('../models/Currency');
const ShippingMethod = require('../models/ShippingMethod');
const { success, fail } = require('../utils/response');

// ---- General Settings ----
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ key: 1 });
    res.json(success(settings));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value, type, label, description } = req.body;
    if (!key) return res.json(fail('Key is required'));
    let setting = await Setting.findOne({ key });
    if (setting) {
      if (value !== undefined) setting.value = value;
      if (type) setting.type = type;
      if (label) setting.label = label;
      if (description) setting.description = description;
      await setting.save();
    } else {
      setting = await Setting.create({ key, value, type: type || 'string', label, description });
    }
    res.json(success(setting, 'Setting saved'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) return res.json(fail('settings array required'));
    for (const s of settings) {
      if (!s.key) continue;
      await Setting.findOneAndUpdate({ key: s.key }, { $set: { value: s.value } }, { upsert: true });
    }
    res.json(success(null, 'Settings saved'));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- Tax Rates ----
exports.getTaxRates = async (req, res) => {
  try {
    const rates = await TaxRate.find().sort({ name: 1 });
    res.json(success(rates));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createTaxRate = async (req, res) => {
  try {
    const { name, rate, type, region, isDefault } = req.body;
    if (!name || rate === undefined) return res.json(fail('Name and rate required'));
    if (isDefault) await TaxRate.updateMany({}, { isDefault: false });
    const tax = await TaxRate.create({ name, rate, type, region, isDefault });
    res.json(success(tax, 'Tax rate created'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updateTaxRate = async (req, res) => {
  try {
    const { isDefault } = req.body;
    if (isDefault) await TaxRate.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    const tax = await TaxRate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tax) return res.json(fail('Tax rate not found'));
    res.json(success(tax, 'Tax rate updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.deleteTaxRate = async (req, res) => {
  try {
    const tax = await TaxRate.findByIdAndDelete(req.params.id);
    if (!tax) return res.json(fail('Tax rate not found'));
    res.json(success(null, 'Tax rate deleted'));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- Currencies ----
exports.getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find().sort({ sort: 1, code: 1 });
    res.json(success(currencies));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, exchangeRate, isDefault } = req.body;
    if (!code || !name || !symbol) return res.json(fail('Code, name, and symbol required'));
    if (isDefault) await Currency.updateMany({}, { isDefault: false });
    const currency = await Currency.create({ code, name, symbol, exchangeRate: exchangeRate || 1, isDefault });
    res.json(success(currency, 'Currency created'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updateCurrency = async (req, res) => {
  try {
    const { isDefault } = req.body;
    if (isDefault) await Currency.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!currency) return res.json(fail('Currency not found'));
    res.json(success(currency, 'Currency updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.deleteCurrency = async (req, res) => {
  try {
    const currency = await Currency.findByIdAndDelete(req.params.id);
    if (!currency) return res.json(fail('Currency not found'));
    res.json(success(null, 'Currency deleted'));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- Shipping Methods ----
exports.getShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find().sort({ sort: 1, name: 1 });
    res.json(success(methods));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createShippingMethod = async (req, res) => {
  try {
    const { name, carrier, type, rate, freeShippingThreshold, estimatedDays, regions } = req.body;
    if (!name) return res.json(fail('Name required'));
    const method = await ShippingMethod.create({ name, carrier, type, rate, freeShippingThreshold, estimatedDays, regions });
    res.json(success(method, 'Shipping method created'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updateShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!method) return res.json(fail('Shipping method not found'));
    res.json(success(method, 'Shipping method updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.deleteShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findByIdAndDelete(req.params.id);
    if (!method) return res.json(fail('Shipping method not found'));
    res.json(success(null, 'Shipping method deleted'));
  } catch (error) { res.json(fail(error.message)); }
};
