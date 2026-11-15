const router = require('express').Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Review = require('../models/Review');
const { auth, role } = require('../middleware/auth');
const { buildSlots, isPast } = require('../utils/slots');
const notify = require('../utils/notify');

const pop = (q) => q.populate({ path: 'doctor', populate: { path: 'user', select: 'name' } }).populate('patient', 'name phone email gender dob bloodGroup');
const push = (req, a, event = 'appointment:updated') => {
  const io = req.app.get('io');
  io.to(`user:${a.patient._id || a.patient}`).emit(event, a);
  io.to(`user:${a.doctorUser}`).emit(event, a);
};

router.post('/', auth, role('patient'), async (req, res, next) => {
  try {
    const { doctor, date, time, reason } = req.body;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) return res.status(400).json({ message: 'Choose a date and time' });
    if (!mongoose.isValidObjectId(doctor)) return res.status(404).json({ message: 'Doctor not found' });
    const prof = await DoctorProfile.findById(doctor);
    if (!prof || !prof.approved) return res.status(404).json({ message: 'Doctor not found' });
    if (isPast(date, time)) return res.status(400).json({ message: 'That time has already passed' });
    if (!buildSlots(prof, date).includes(time)) return res.status(400).json({ message: 'The doctor is not available at that time' });
    let a;
    try { a = await Appointment.create({ patient: req.user._id, doctor: prof._id, doctorUser: prof.user, date, time, reason, fee: prof.fee }); }
    catch (e) { if (e.code === 11000) return res.status(400).json({ message: 'Sorry, that slot was just booked. Please pick another.' }); throw e; }
    const full = await pop(Appointment.findById(a._id));
    await notify(req.app.get('io'), prof.user, `New appointment request from ${req.user.name} on ${date} at ${time}`, `/app/appointments/${a._id}`);
    push(req, full, 'appointment:new');
    res.status(201).json(full);
  } catch (e) { next(e); }
});

router.get('/mine', auth, role('patient', 'doctor'), async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctorUser: req.user._id } : { patient: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    res.json(await pop(Appointment.find(filter).sort({ date: -1, time: -1 }).limit(200)));
  } catch (e) { next(e); }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Appointment not found' });
    const a = await pop(Appointment.findById(req.params.id));
    if (!a) return res.status(404).json({ message: 'Appointment not found' });
    const mine = a.patient._id.equals(req.user._id) || a.doctorUser.equals(req.user._id);
    if (!mine && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    res.json(a);
  } catch (e) { next(e); }
});

router.put('/:id/status', auth, async (req, res, next) => {
  try {
    const a = await Appointment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Appointment not found' });
    const isPatient = a.patient.equals(req.user._id), isDoctor = a.doctorUser.equals(req.user._id);
    if (!isPatient && !isDoctor) return res.status(403).json({ message: 'Forbidden' });
    const { status } = req.body;
    const live = ['pending', 'confirmed'].includes(a.status);
    const ok = (isDoctor && status === 'confirmed' && a.status === 'pending') || (status === 'cancelled' && live);
    if (!ok) return res.status(400).json({ message: 'That change is not allowed for this appointment' });
    a.status = status;
    await a.save();
    const full = await pop(Appointment.findById(a._id));
    const io = req.app.get('io');
    const text = status === 'confirmed' ? `Dr. ${full.doctor.user.name} confirmed your appointment on ${a.date} at ${a.time}`
      : isDoctor ? `Dr. ${full.doctor.user.name} cancelled your appointment on ${a.date}` : `${full.patient.name} cancelled the appointment on ${a.date} at ${a.time}`;
    await notify(io, isDoctor ? a.patient : a.doctorUser, text, `/app/appointments/${a._id}`);
    push(req, full);
    res.json(full);
  } catch (e) { next(e); }
});

router.put('/:id/complete', auth, role('doctor'), async (req, res, next) => {
  try {
    const a = await Appointment.findOne({ _id: req.params.id, doctorUser: req.user._id });
    if (!a) return res.status(404).json({ message: 'Appointment not found' });
    if (a.status !== 'confirmed') return res.status(400).json({ message: 'Confirm the appointment before completing it' });
    a.status = 'completed'; a.completedAt = new Date();
    a.notes = req.body.notes || '';
    a.prescription = (req.body.prescription || []).filter((p) => p.medicine && p.medicine.trim()).map((p) => ({ medicine: p.medicine.trim(), dosage: p.dosage, frequency: p.frequency, days: Number(p.days) || 0 }));
    await a.save();
    const full = await pop(Appointment.findById(a._id));
    await notify(req.app.get('io'), a.patient, `Your consultation is complete. ${a.prescription.length ? 'Your prescription is ready.' : 'Notes are available.'}`, `/app/appointments/${a._id}`);
    push(req, full);
    res.json(full);
  } catch (e) { next(e); }
});

router.post('/:id/review', auth, role('patient'), async (req, res, next) => {
  try {
    const a = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!a) return res.status(404).json({ message: 'Appointment not found' });
    if (a.status !== 'completed') return res.status(400).json({ message: 'You can review after the consultation' });
    if (a.reviewed) return res.status(400).json({ message: 'You already reviewed this visit' });
    const rating = Number(req.body.rating);
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: 'Rating must be 1 to 5' });
    await Review.create({ doctor: a.doctor, patient: req.user._id, appointment: a._id, rating, comment: req.body.comment });
    a.reviewed = true; await a.save();
    const all = await Review.find({ doctor: a.doctor });
    await DoctorProfile.findByIdAndUpdate(a.doctor, { numReviews: all.length, rating: Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10 });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
