const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
  doctorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  active: { type: Boolean, default: true },
  fee: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  prescription: [{ medicine: String, dosage: String, frequency: String, days: Number }],
  reviewed: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true });

schema.pre('validate', function (next) { this.active = ['pending', 'confirmed'].includes(this.status); next(); });
// A doctor can only have one live appointment per slot.
schema.index({ doctor: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { active: true } });

module.exports = mongoose.model('Appointment', schema);
