const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  status: { type: Number, enum: [0, 1], default: 1 },
  type: { type: Number, default: 0 },
  fundPassword: { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('fundPassword') && this.fundPassword) {
    this.fundPassword = await bcrypt.hash(this.fundPassword, salt);
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchFundPassword = async function (enteredPassword) {
  if (!this.fundPassword) return false;
  return await bcrypt.compare(enteredPassword, this.fundPassword);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.fundPassword;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
