const BankCard = require('../models/BankCard');
const { success, fail } = require('../utils/response');

exports.add = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user._id };
    const card = await BankCard.create(data);
    res.json(success(card, 'Bank card added'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.del = async (req, res) => {
  try {
    const card = await BankCard.findOneAndDelete({ _id: req.body.id, userId: req.user._id });
    if (!card) return res.json(fail('Bank card not found'));
    res.json(success(null, 'Bank card deleted'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getList = async (req, res) => {
  try {
    const list = await BankCard.find({ userId: req.user._id });
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
};
