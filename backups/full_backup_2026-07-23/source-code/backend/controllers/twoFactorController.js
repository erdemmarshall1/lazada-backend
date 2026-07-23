const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { success, fail } = require('../utils/response');

exports.setup = async (req, res) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.json(fail('2FA is already enabled'));
    }
    const secret = speakeasy.generateSecret({ name: `THE OUTNET WHOLESALE (${req.user.email || req.user.username})` });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();
    res.json(success({ secret: secret.base32, qrCodeUrl }, '2FA setup initialized. Verify with a code to enable.'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.verify = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.json(fail('Verification code required'));
    }
    if (!req.user.twoFactorSecret) {
      return res.json(fail('2FA not initialized. Run setup first.'));
    }
    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
    if (!verified) {
      return res.json(fail('Invalid verification code'));
    }
    req.user.twoFactorEnabled = true;
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(require('crypto').randomBytes(4).toString('hex').toUpperCase());
    }
    req.user.backupCodes = codes.map(c => require('bcryptjs').hashSync(c, 6));
    await req.user.save();
    res.json(success({ backupCodes: codes }, '2FA enabled successfully. Save your backup codes.'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.disable = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.json(fail('Password required to disable 2FA'));
    }
    const isMatch = await req.user.matchPassword(password);
    if (!isMatch) {
      return res.json(fail('Invalid password'));
    }
    req.user.twoFactorEnabled = false;
    req.user.twoFactorSecret = '';
    req.user.twoFactorMethod = 'app';
    req.user.backupCodes = [];
    await req.user.save();
    res.json(success(null, '2FA disabled successfully'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.backupCodes = async (req, res) => {
  try {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(require('crypto').randomBytes(4).toString('hex').toUpperCase());
    }
    req.user.backupCodes = codes.map(c => require('bcryptjs').hashSync(c, 6));
    await req.user.save();
    res.json(success({ backupCodes: codes }, 'New backup codes generated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
