const router = require('express').Router();
const Reminder = require('../models/Reminder');
const { auth, role } = require('../middleware/auth');
const { dateStr, offsetDate } = require('../utils/slots');

router.get('/', auth, role('patient'), async (req, res, next) => {
  try { res.json(await Reminder.find({ patient: req.user._id }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});

router.post('/', auth, role('patient'), async (req, res, next) => {
  try {
    const { medicine, dosage, times, days } = req.body;
    if (!medicine || !medicine.trim()) return res.status(400).json({ message: 'Medicine name is required' });
    const t = (times || []).filter((x) => /^\d{2}:\d{2}$/.test(x)).sort();
    if (!t.length) return res.status(400).json({ message: 'Add at least one time' });
    const n = Math.max(1, Math.min(365, Number(days) || 7));
    res.status(201).json(await Reminder.create({ patient: req.user._id, medicine: medicine.trim(), dosage, times: t, startDate: dateStr(), endDate: offsetDate(n - 1) }));
  } catch (e) { next(e); }
});

router.put('/:id/take', auth, role('patient'), async (req, res, next) => {
  try {
    const r = await Reminder.findOne({ _id: req.params.id, patient: req.user._id });
    if (!r) return res.status(404).json({ message: 'Reminder not found' });
    const key = `${req.body.date}|${req.body.time}`;
    const i = r.taken.indexOf(key);
    if (i >= 0) r.taken.splice(i, 1); else r.taken.push(key);
    await r.save();
    res.json(r);
  } catch (e) { next(e); }
});

router.delete('/:id', auth, role('patient'), async (req, res, next) => {
  try { await Reminder.deleteOne({ _id: req.params.id, patient: req.user._id }); res.json({ ok: true }); } catch (e) { next(e); }
});

module.exports = router;
