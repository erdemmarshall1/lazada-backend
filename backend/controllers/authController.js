const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/app');
const { success, fail } = require('../utils/response');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json(fail('Username and password required'));
    }
    const user = await User.findOne({
      $or: [{ email: username }, { username }, { phone: username }],
    });
    if (!user) {
      return res.json(fail('User not found'));
    }
    if (user.status === 0) {
      return res.json(fail('Account disabled'));
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.json(fail('Invalid password'));
    }
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ id: user._id, twoFactorPending: true }, JWT_SECRET, { expiresIn: '5m' });
      return res.json(success({ twoFactorRequired: true, tempToken, method: user.twoFactorMethod }, '2FA verification required'));
    }
    const token = generateToken(user._id);
    res.json(success({ token, userInfo: user }, 'Login successful'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.login2fa = async (req, res) => {
  try {
    const { tempToken, token: twoFactorCode } = req.body;
    if (!tempToken || !twoFactorCode) {
      return res.json(fail('Temporary token and 2FA code required'));
    }
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.json(fail('Temporary token expired or invalid'));
    }
    if (!decoded.twoFactorPending) {
      return res.json(fail('Invalid token'));
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json(fail('User not found'));
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2,
    });
    if (verified) {
      const token = generateToken(user._id);
      return res.json(success({ token, userInfo: user }, 'Login successful'));
    }
    const isBackup = user.backupCodes.find(c => bcrypt.compareSync(twoFactorCode, c));
    if (isBackup) {
      user.backupCodes = user.backupCodes.filter(c => c !== isBackup);
      await user.save();
      const token = generateToken(user._id);
      return res.json(success({ token, userInfo: user }, 'Login successful (backup code used)'));
    }
    res.json(fail('Invalid 2FA code'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    if (!username || !email || !password) {
      return res.json(fail('Username, email and password required'));
    }
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.json(fail('Username or email already exists'));
    }
    const user = await User.create({ username, email, password, phone });
    await Cart.create({ userId: user._id, items: [] });
    await Wallet.create({ userId: user._id });
    const token = generateToken(user._id);
    res.json(success({ token, userInfo: user }, 'Registration successful'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json(fail('Email and new password required'));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json(fail('User not found'));
    }
    user.password = password;
    await user.save();
    res.json(success(null, 'Password reset successful'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.sendEmailCode = async (req, res) => {
  res.json(success(null, 'Code sent'));
};

exports.sendMobileCode = async (req, res) => {
  res.json(success(null, 'Code sent'));
};

exports.getCountryList = async (req, res) => {
  const countries = [
    { code: 'CN', name: 'China', phoneCode: '+86' },
    { code: 'US', name: 'United States', phoneCode: '+1' },
    { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
    { code: 'DE', name: 'Germany', phoneCode: '+49' },
    { code: 'FR', name: 'France', phoneCode: '+33' },
    { code: 'JP', name: 'Japan', phoneCode: '+81' },
    { code: 'VN', name: 'Vietnam', phoneCode: '+84' },
    { code: 'ES', name: 'Spain', phoneCode: '+34' },
  ];
  res.json(success(countries));
};
