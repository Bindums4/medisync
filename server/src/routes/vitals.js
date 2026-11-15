const router = require('express').Router();
const Vital = require('../models/Vital');
const { auth, role } = require('../middleware/auth');

const UNITS = { bp: 'mmHg', sugar: 'mg/dL', weight: 'kg', heart: 'bpm', temp: '°F' };

router.get('/', auth, role('patient'), async (req, res, next) => {
  try {
    const filter = { patient: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    res.json(await Vital.find(filter).sort({ measuredAt: 1 }).limit(365));
  } catch (e) { next(e); }
});

router.post('/', auth, role('patient'), async (req, res, next) => {
  try {
    const { type, value, value2, note, measuredAt } = req.body;
    if (!UNITS[type]) return res.status(400).json({ message: 'Unknown measurement type' });
    if (value === '' || value === undefined || isNaN(Number(value))) return res.status(400).json({ message: 'Enter a valid value' });
    if (type === 'bp' && (value2 === '' || value2 === undefined || isNaN(Number(value2)))) return res.status(400).json({ message: 'Enter both systolic and diastolic values' });
    res.status(201).json(await Vital.create({ patient: req.user._id, type, value: Number(value), value2: type === 'bp' ? Number(value2) : undefined, unit: UNITS[type], note, measuredAt: measuredAt || new Date() }));
  } catch (e) { next(e); }
});

router.delete('/:id', auth, role('patient'), async (req, res, next) => {
  try { await Vital.deleteOne({ _id: req.params.id, patient: req.user._id }); res.json({ ok: true }); } catch (e) { next(e); }
});

module.exports = router;
