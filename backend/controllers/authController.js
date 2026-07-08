const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');
const LoginHistory = require('../models/LoginHistory');
const emailService = require('../services/emailService');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = require('../config/app');
const { success, fail } = require('../utils/response');
const { verifyRefreshToken } = require('../middleware/auth');

const recordLogin = (userId, req, method = 'password', success = true) => {
  LoginHistory.create({
    userId,
    ip: req.ip || req.connection?.remoteAddress || '',
    userAgent: req.headers?.['user-agent'] || '',
    method,
    success,
  }).catch(() => {});
};

const generateToken = (id) => {
  return jwt.sign({ id, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = (user) => {
  const version = user.tokenVersion || '';
  return jwt.sign({ id: user._id, type: 'refresh', version }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

const sendVerificationEmail = async (user) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationCode = code;
  user.emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  await emailService.sendMail({
    to: user.email,
    subject: 'Verify your email - THE OUTNET',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
<h2>Welcome to THE OUTNET</h2>
<p>Hi ${user.username},</p>
<p>Use the code below to verify your email address:</p>
<div style="font-size:32px;letter-spacing:8px;font-weight:700;text-align:center;padding:20px;background:#f4f2ee;border-radius:8px;margin:20px 0">${code}</div>
<p>This code expires in 30 minutes.</p>
<p>If you didn't create an account, you can ignore this email.</p>
</div>`,
  });
};

const issueTokens = (user) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user);
  return { token, refreshToken };
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
      recordLogin(user._id, req, 'password', true);
      const tempToken = jwt.sign({ id: user._id, twoFactorPending: true }, JWT_SECRET, { expiresIn: '5m' });
      return res.json(success({ twoFactorRequired: true, tempToken, method: user.twoFactorMethod }, '2FA verification required'));
    }
    recordLogin(user._id, req, 'password', true);
    const tokens = issueTokens(user);
    const extra = user.needsPasswordSetup ? { needsPasswordSetup: true } : {};
    res.json(success({ ...tokens, userInfo: user, ...extra }, 'Login successful'));
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
      recordLogin(user._id, req, '2fa', true);
      const tokens = issueTokens(user);
      return res.json(success({ ...tokens, userInfo: user }, 'Login successful'));
    }
    const isBackup = user.backupCodes.find(c => bcrypt.compareSync(twoFactorCode, c));
    if (isBackup) {
      user.backupCodes = user.backupCodes.filter(c => c !== isBackup);
      await user.save();
      recordLogin(user._id, req, 'backup_code', true);
      const tokens = issueTokens(user);
      return res.json(success({ ...tokens, userInfo: user }, 'Login successful (backup code used)'));
    }
    recordLogin(user._id, req, '2fa', false);
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
    recordLogin(user._id, req, 'register', true);
    const tokens = issueTokens(user);
    sendVerificationEmail(user).catch(() => {});
    res.json(success({ ...tokens, userInfo: user, emailVerificationSent: true }, 'Registration successful'));
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
    recordLogin(user._id, req, 'reset', true);
    res.json(success(null, 'Password reset successful'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.setupPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.json(fail('Password must be at least 6 characters'));
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json(fail('User not found'));
    }
    if (!user.needsPasswordSetup) {
      return res.json(fail('Password already set up'));
    }
    user.password = password;
    user.needsPasswordSetup = false;
    await user.save();
    res.json(success(null, 'Password set successfully. Please login with your new password.'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.json(fail('Refresh token required'));
    }
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.json({ code: -1, msg: 'Invalid or expired refresh token' });
    }
    const user = await User.findById(decoded.id);
    if (!user || user.status === 0) {
      return res.json({ code: -1, msg: 'User not found or disabled' });
    }
    if (user.tokenVersion && decoded.version !== user.tokenVersion) {
      return res.json({ code: -1, msg: 'Refresh token revoked' });
    }
    const tokens = issueTokens(user);
    res.json(success({ ...tokens, userInfo: user }, 'Token refreshed'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.tokenVersion = crypto.randomBytes(8).toString('hex');
      await user.save();
    }
    res.json(success(null, 'Logged out successfully'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.sendEmailCode = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json(fail('Email required'));
    const user = await User.findOne({ email });
    if (!user) return res.json(fail('User not found'));
    if (user.isEmailVerified) return res.json(success(null, 'Email already verified'));
    await sendVerificationEmail(user);
    res.json(success(null, 'Verification code sent to your email'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json(fail('Verification code required'));
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    if (user.isEmailVerified) return res.json(success(null, 'Email already verified'));
    if (user.emailVerificationCode !== code) return res.json(fail('Invalid verification code'));
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return res.json(fail('Verification code expired. Request a new one.'));
    }
    user.isEmailVerified = true;
    user.emailVerificationCode = '';
    user.emailVerificationExpires = null;
    await user.save();
    res.json(success({ isEmailVerified: true }, 'Email verified successfully'));
  } catch (error) {
    res.json(fail(error.message));
  }
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
