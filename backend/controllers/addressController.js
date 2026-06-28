const Address = require('../models/Address');
const { success, fail } = require('../utils/response');

exports.getList = async (req, res) => {
  try {
    const list = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.add = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user._id };
    if (data.isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }
    const address = await Address.create(data);
    res.json(success(address, 'Address added'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getInfo = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.query.id, userId: req.user._id });
    if (!address) return res.json(fail('Address not found'));
    res.json(success(address));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.edit = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (data.isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }
    const address = await Address.findOneAndUpdate(
      { _id: id, userId: req.user._id }, data, { new: true }
    );
    if (!address) return res.json(fail('Address not found'));
    res.json(success(address, 'Address updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.setDefault = async (req, res) => {
  try {
    const { id } = req.body;
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: id, userId: req.user._id }, { isDefault: true }, { new: true }
    );
    if (!address) return res.json(fail('Address not found'));
    res.json(success(address, 'Default address set'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.del = async (req, res) => {
  try {
    const { id } = req.body;
    const address = await Address.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!address) return res.json(fail('Address not found'));
    res.json(success(null, 'Address deleted'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
