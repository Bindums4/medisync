const router = require('express').Router();
const mongoose = require('mongoose');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const { auth, role } = require('../middleware/auth');
const { buildSlots, dateStr, isPast, offsetDate } = require('../utils/slots');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res, next) => {
  try {
    const { q, specialty, city, sort } = req.query;
    const filter = { approved: true };
    if (specialty) filter.specialty = specialty;
    if (city) filter.city = new RegExp(esc(city), 'i');
    let docs = await DoctorProfile.find(filter).populate('user', 'name');
    if (q) { const re = new RegExp(esc(q), 'i'); docs = docs.filter((d) => re.test(d.user.name) || re.test(d.specialty) || re.test(d.clinic) || re.test(d.city)); }
    const by = { rating: (a, b) => b.rating - a.rating, fee_asc: (a, b) => a.fee - b.fee, fee_desc: (a, b) => b.fee - a.fee, experience: (a, b) => b.experience - a.experience };
    docs.sort(by[sort] || by.rating);
    res.json(docs);
  } catch (e) { next(e); }
});

router.get('/specialties', async (_req, res, next) => {
  try {
    const agg = await DoctorProfile.aggregate([{ $match: { approved: true } }, { $group: { _id: '$specialty', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    res.json(agg.map((x) => ({ name: x._id, count: x.count })));
  } catch (e) { next(e); }
});

router.get('/me/stats', auth, role('doctor'), async (req, res, next) => {
  try {
    const prof = await DoctorProfile.findOne({ user: req.user._id });
    const appts = await Appointment.find({ doctor: prof._id }).populate('patient', 'name phone');
    const today = dateStr();
    const trend = [];
    for (let i = 6; i >= 0; i--) { const d = offsetDate(-i); trend.push({ key: d, day: new Date(`${d}T00:00:00`).toLocaleDateString('en', { weekday: 'short' }), count: 0 }); }
    appts.forEach((a) => { if (a.status !== 'cancelled') { const t = trend.find((x) => x.key === a.date); if (t) t.count++; } });
    res.json({
      approved: prof.approved,
      today: appts.filter((a) => a.date === today && a.active).sort((a, b) => a.time.localeCompare(b.time)),
      totals: {
        pending: appts.filter((a) => a.status === 'pending').length,
        upcoming: appts.filter((a) => a.status === 'confirmed' && a.date >= today).length,
        completed: appts.filter((a) => a.status === 'completed').length,
        patients: new Set(appts.filter((a) => a.status === 'completed').map((a) => String(a.patient._id))).size,
        earnings: appts.filter((a) => a.status === 'completed').reduce((s, a) => s + a.fee, 0),
      },
      trend: trend.map(({ day, count }) => ({ day, count })),
    });
  } catch (e) { next(e); }
});

router.put('/me/profile', auth, role('doctor'), async (req, res, next) => {
  try {
    const prof = await DoctorProfile.findOne({ user: req.user._id });
    ['specialty', 'experience', 'fee', 'bio', 'qualifications', 'clinic', 'city'].forEach((k) => { if (req.body[k] !== undefined) prof[k] = req.body[k]; });
    await prof.save();
    res.json(prof);
  } catch (e) { e.status = 400; next(e); }
});

router.put('/me/availability', auth, role('doctor'), async (req, res, next) => {
  try {
    const prof = await DoctorProfile.findOne({ user: req.user._id });
    const { availability, slotMinutes } = req.body;
    if (Array.isArray(availability)) {
      for (const a of availability) if (a.enabled && a.start >= a.end) return res.status(400).json({ message: 'End time must be after start time' });
      prof.availability = availability;
    }
    if (slotMinutes) prof.slotMinutes = Number(slotMinutes);
    await prof.save();
    res.json(prof);
  } catch (e) { e.status = 400; next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Doctor not found' });
    const doctor = await DoctorProfile.findById(req.params.id).populate('user', 'name');
    if (!doctor || !doctor.approved) return res.status(404).json({ message: 'Doctor not found' });
    const reviews = await Review.find({ doctor: doctor._id }).sort({ createdAt: -1 }).limit(20).populate('patient', 'name');
    res.json({ doctor, reviews });
  } catch (e) { next(e); }
});

router.get('/:id/slots', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ message: 'A valid date is required' });
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor || !doctor.approved) return res.status(404).json({ message: 'Doctor not found' });
    const booked = new Set((await Appointment.find({ doctor: doctor._id, date, active: true }).select('time')).map((a) => a.time));
    res.json({ date, slots: buildSlots(doctor, date).map((time) => ({ time, available: !booked.has(time) && !isPast(date, time) })) });
  } catch (e) { next(e); }
});

module.exports = router;
