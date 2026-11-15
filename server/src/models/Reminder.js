const mongoose = require('mongoose');
module.exports = mongoose.model('Reminder', new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicine: { type: String, required: true, trim: true },
  dosage: { type: String, default: '' },
  times: [String],
  startDate: String,
  endDate: String,
  taken: [String],
}, { timestamps: true }));
