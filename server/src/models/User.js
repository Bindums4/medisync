const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  gender: { type: String, default: '' },
  dob: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
}, { timestamps: true });

schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
schema.methods.matches = function (pw) { return bcrypt.compare(pw, this.password); };
schema.methods.toJSON = function () { const o = this.toObject(); delete o.password; return o; };

module.exports = mongoose.model('User', schema);
