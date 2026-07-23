const User = require('../models/User');
const { success, fail } = require('../utils/response');

exports.getInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    res.json(success(user));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    res.json(success(user));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.edit = async (req, res) => {
  try {
    const { username, avatar, phone, fullName, bio, dateOfBirth, gender, country, city, postalCode } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    if (username) user.username = username;
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (country !== undefined) user.country = country;
    if (city !== undefined) user.city = city;
    if (postalCode !== undefined) user.postalCode = postalCode;
    await user.save();
    res.json(success(user, 'Profile updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.editEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    user.email = email;
    await user.save();
    res.json(success(user, 'Email updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.editMobile = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    user.phone = phone;
    await user.save();
    res.json(success(user, 'Phone updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.editPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) return res.json(fail('Old password incorrect'));
    user.password = newPassword;
    await user.save();
    res.json(success(null, 'Password updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.editFundPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    user.fundPassword = password;
    await user.save();
    res.json(success(null, 'Fund password updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};