const router = require('express').Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

router.get('/:appointment', auth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.appointment)) return res.status(404).json({ message: 'Not found' });
    const a = await Appointment.findById(req.params.appointment);
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (!a.patient.equals(req.user._id) && !a.doctorUser.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    res.json(await Message.find({ appointment: a._id }).sort({ createdAt: 1 }).limit(300).populate('sender', 'name role'));
  } catch (e) { next(e); }
});

module.exports = router;
