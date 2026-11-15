const mongoose = require('mongoose');

const day = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6 },
  enabled: { type: Boolean, default: false },
  start: { type: String, default: '09:00' },
  end: { type: String, default: '17:00' },
}, { _id: false });

const defaultAvailability = () => [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, enabled: d >= 1 && d <= 5, start: '09:00', end: d === 6 ? '13:00' : '17:00' }));

module.exports = mongoose.model('DoctorProfile', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialty: { type: String, required: true, index: true },
  experience: { type: Number, default: 0 },
  fee: { type: Number, required: true, min: 0 },
  bio: { type: String, default: '' },
  qualifications: { type: String, default: '' },
  clinic: { type: String, default: '' },
  city: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  approved: { type: Boolean, default: false },
  slotMinutes: { type: Number, default: 30, min: 10, max: 120 },
  availability: { type: [day], default: defaultAvailability },
}, { timestamps: true }));
