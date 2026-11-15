const mongoose = require('mongoose');
module.exports = mongoose.model('Review', new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
}, { timestamps: true }));
