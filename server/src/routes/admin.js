const router = require('express').Router();
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const { auth, role } = require('../middleware/auth');
const { offsetDate } = require('../utils/slots');
const notify = require('../utils/notify');

router.use(auth, role('admin'));

router.get('/stats', async (_req, res, next) => {
  try {
    const [patients, doctors, profiles, appts] = await Promise.all([
      User.countDocuments({ role: 'patient' }), User.countDocuments({ role: 'doctor' }), DoctorProfile.find(), Appointment.find().select('date status fee doctor'),
    ]);
    const trend = [];
    for (let i = 6; i >= 0; i--) { const d = offsetDate(-i); trend.push({ key: d, day: new Date(`${d}T00:00:00`).toLocaleDateString('en', { weekday: 'short' }), appointments: 0 }); }
    appts.forEach((a) => { const t = trend.find((x) => x.key === a.date); if (t && a.status !== 'cancelled') t.appointments++; });
    const bySpec = {}; const specOf = Object.fromEntries(profiles.map((p) => [String(p._id), p.specialty]));
    appts.forEach((a) => { const s = specOf[String(a.doctor)]; if (s && a.status !== 'cancelled') bySpec[s] = (bySpec[s] || 0) + 1; });
    const byStatus = {}; appts.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
    res.json({
      totals: { patients, doctors, pendingDoctors: profiles.filter((p) => !p.approved).length, appointments: appts.length, revenue: appts.filter((a) => a.status === 'completed').reduce((s, a) => s + a.fee, 0) },
      trend: trend.map(({ day, appointments }) => ({ day, appointments })),
      bySpecialty: Object.entries(bySpec).map(([name, value]) => ({ name, value })),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    });
  } catch (e) { next(e); }
});

router.get('/doctors', async (req, res, next) => {
  try {
    const filter = req.query.status === 'pending' ? { approved: false } : req.query.status === 'approved' ? { approved: true } : {};
    res.json(await DoctorProfile.find(filter).sort({ approved: 1, createdAt: -1 }).populate('user', 'name email phone'));
  } catch (e) { next(e); }
});

router.put('/doctors/:id/approve', async (req, res, next) => {
  try {
    const p = await DoctorProfile.findById(req.params.id).populate('user', 'name email phone');
    if (!p) return res.status(404).json({ message: 'Doctor not found' });
    p.approved = !!req.body.approved;
    await p.save();
    await notify(req.app.get('io'), p.user._id, p.approved ? 'Your profile is approved. Patients can now book you.' : 'Your profile was moved back to review.', '/app');
    res.json(p);
  } catch (e) { next(e); }
});

router.get('/users', async (_req, res, next) => {
  try { res.json(await User.find().sort({ createdAt: -1 }).limit(300)); } catch (e) { next(e); }
});

router.get('/appointments', async (_req, res, next) => {
  try {
    res.json(await Appointment.find().sort({ date: -1, time: -1 }).limit(150)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } }).populate('patient', 'name'));
  } catch (e) { next(e); }
});

module.exports = router;
