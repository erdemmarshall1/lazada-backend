const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const UserWallet = require('../models/UserWallet');
const Setting = require('../models/Setting');
const { createNotification } = require('./notificationController');
const { success, fail, paginate } = require('../utils/response');

exports.add = async (req, res) => {
  try {
    const { label, address, type } = req.body;
    if (!label || !address) return res.json(fail('Label and address are required'));
    const count = await UserWallet.countDocuments({ userId: req.user._id });
    const wallet = await UserWallet.create({
      userId: req.user._id, label, address, type: type || 'other',
      isDefault: count === 0,
    });
    res.json(success(wallet, 'Wallet added'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.del = async (req, res) => {
  try {
    const wallet = await UserWallet.findOneAndDelete({ _id: req.body.id, userId: req.user._id });
    if (!wallet) return res.json(fail('Wallet not found'));
    res.json(success(null, 'Wallet deleted'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.update = async (req, res) => {
  try {
    const { id, label, address, type, isDefault } = req.body;
    if (!id) return res.json(fail('Wallet ID is required'));
    if (isDefault) {
      await UserWallet.updateMany({ userId: req.user._id }, { isDefault: false });
    }
    const wallet = await UserWallet.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { label, address, type, isDefault },
      { new: true }
    );
    if (!wallet) return res.json(fail('Wallet not found'));
    res.json(success(wallet, 'Wallet updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getAddressList = async (req, res) => {
  try {
    const list = await UserWallet.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getList = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }
    res.json(success([wallet]));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.rechargeAdd = async (req, res) => {
  try {
    const { amount, paymentMethod, receipt } = req.body;
    if (!amount || amount <= 0) return res.json(fail('Invalid amount'));
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.json(fail('Wallet not found'));

    const approvalSetting = await Setting.findOne({ key: 'payment_approval' });
    const autoApprove = approvalSetting?.value?.autoApprove === true;
    const autoApproveAmount = Number(approvalSetting?.value?.autoApproveAmount) || 0;
    const shouldAutoApprove = autoApprove || (autoApproveAmount > 0 && amount <= autoApproveAmount);

    let status = shouldAutoApprove ? 1 : 0;
    let balanceAfter = wallet.balance;
    if (shouldAutoApprove) {
      wallet.balance += amount;
      wallet.totalRecharge += amount;
      await wallet.save();
      balanceAfter = wallet.balance;
    }

    const tx = await Transaction.create({
      userId: req.user._id, type: 'recharge', amount,
      balanceBefore: shouldAutoApprove ? balanceAfter - amount : wallet.balance,
      balanceAfter,
      paymentMethod: paymentMethod || '', status,
      receipt: receipt || '',
      description: paymentMethod ? `Recharge via ${paymentMethod}` : 'Account recharge',
    });

    if (shouldAutoApprove) {
      createNotification(req.user._id, 'payment', 'Deposit Approved',
        `Your deposit of $${amount} has been approved automatically`,
        { transactionId: tx._id }, '/balance');
      return res.json(success(tx, 'Deposit approved automatically'));
    }

    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id').lean();
    await Promise.all(admins.map(a =>
      createNotification(a._id, 'payment', 'New Payment Submitted',
        `$${amount} recharge via ${paymentMethod || 'unknown'} — pending approval`,
        { transactionId: tx._id }, '/admin/transactions')
    ));

    res.json(success(tx, 'Recharge submitted for admin approval'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.checkFundPassword = async (req, res) => {
  try {
    res.json(success({ hasPassword: !!req.user?.fundPassword }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.rechargeGetList = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { userId: req.user._id, type: 'recharge' };
    const [list, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.withdrawAdd = async (req, res) => {
  try {
    const { amount, paymentMethod, withdrawalDetails, fundPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    if (!user.fundPassword) return res.json(fail('Please set a transaction password first'));
    const isMatch = await user.matchFundPassword(fundPassword);
    if (!isMatch) return res.json(fail('Invalid transaction password'));
    if (!amount || amount <= 0) return res.json(fail('Invalid amount'));
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.json(fail('Wallet not found'));
    if (wallet.balance < amount) return res.json(fail('Insufficient balance'));
    const detailsStr = withdrawalDetails ? JSON.stringify(withdrawalDetails) : '';
    const tx = await Transaction.create({
      userId: req.user._id, type: 'withdraw', amount: -amount,
      balanceBefore: wallet.balance, balanceAfter: wallet.balance,
      paymentMethod: paymentMethod || '', status: 0,
      description: paymentMethod
        ? `Withdrawal via ${paymentMethod}${detailsStr ? ' - ' + detailsStr : ''}`
        : 'Withdrawal',
    });
    res.json(success(tx, 'Withdrawal submitted for admin approval'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.withdrawGetList = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { userId: req.user._id, type: 'withdraw' };
    const [list, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getAmountList = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    res.json(success(wallet ? [wallet] : []));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getTradeList = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { userId: req.user._id };
    const [list, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getTradeInfo = async (req, res) => {
  try {
    const trade = await Transaction.findById(req.query.id);
    if (!trade) return res.json(fail('Transaction not found'));
    res.json(success(trade));
  } catch (error) {
    res.json(fail(error.message));
  }
};

// --- Admin: approve / reject pending transactions ---

exports.adminGetPendingRecharges = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { type: 'recharge', status: 0 };
    const [list, total] = await Promise.all([
      Transaction.find(query).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminGetPendingWithdraws = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { type: 'withdraw', status: 0 };
    const [list, total] = await Promise.all([
      Transaction.find(query).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminApproveTransaction = async (req, res) => {
  try {
    const { id, transactionId } = req.body;
    const txId = id || transactionId;
    if (!txId || !mongoose.Types.ObjectId.isValid(txId)) {
      return res.json(fail('Invalid transaction ID'));
    }
    const tx = await Transaction.findById(txId);
    if (!tx) return res.json(fail('Transaction not found'));
    if (tx.status !== 0) return res.json(fail('Transaction already processed'));
    const wallet = await Wallet.findOne({ userId: tx.userId });
    if (!wallet) return res.json(fail('Wallet not found'));
    if (tx.type === 'recharge') {
      wallet.balance += tx.amount;
      wallet.totalRecharge += tx.amount;
    } else if (tx.type === 'withdraw') {
      if (wallet.balance < Math.abs(tx.amount)) return res.json(fail('Insufficient balance'));
      wallet.balance -= Math.abs(tx.amount);
      wallet.totalWithdraw += Math.abs(tx.amount);
    }
    await wallet.save();
    tx.status = 1;
    tx.balanceBefore = wallet.balance - (tx.type === 'recharge' ? tx.amount : -Math.abs(tx.amount));
    tx.balanceAfter = wallet.balance;
    await tx.save();
    createNotification(tx.userId, 'payment', 'Transaction Approved',
      `Your ${tx.type} of $${Math.abs(tx.amount)} has been approved`,
      { transactionId: tx._id }, tx.type === 'recharge' ? '/balance' : '');
    res.json(success(tx, 'Transaction approved'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminRejectTransaction = async (req, res) => {
  try {
    const { id, transactionId } = req.body;
    const txId = id || transactionId;
    if (!txId || !mongoose.Types.ObjectId.isValid(txId)) {
      return res.json(fail('Invalid transaction ID'));
    }
    const tx = await Transaction.findById(txId);
    if (!tx) return res.json(fail('Transaction not found'));
    if (tx.status !== 0) return res.json(fail('Transaction already processed'));
    tx.status = 2;
    await tx.save();
    createNotification(tx.userId, 'payment', 'Transaction Rejected',
      `Your ${tx.type} of $${Math.abs(tx.amount)} has been rejected`,
      { transactionId: tx._id }, '');
    res.json(success(tx, 'Transaction rejected'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
