const mongoose = require('mongoose');
module.exports = mongoose.model('Vital', new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['bp', 'sugar', 'weight', 'heart', 'temp'], required: true },
  value: { type: Number, required: true },
  value2: { type: Number },
  unit: String,
  note: { type: String, default: '' },
  measuredAt: { type: Date, default: Date.now },
}, { timestamps: true }));
