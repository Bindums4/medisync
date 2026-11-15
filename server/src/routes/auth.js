const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const payload = require('../utils/payload');
const { auth } = require('../middleware/auth');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, role, specialty, fee, experience, city, bio } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const isDoctor = role === 'doctor';
    if (isDoctor && (!specialty || !fee)) return res.status(400).json({ message: 'Doctors must provide a specialty and consultation fee' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone, role: isDoctor ? 'doctor' : 'patient' });
    if (isDoctor) await DoctorProfile.create({ user: user._id, specialty, fee: Number(fee), experience: Number(experience) || 0, city, bio });
    res.status(201).json({ token: sign(user), user: await payload(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!user || !(await user.matches(req.body.password || ''))) return res.status(400).json({ message: 'Invalid email or password' });
    res.json({ token: sign(user), user: await payload(user) });
  } catch (e) { next(e); }
});

router.get('/me', auth, async (req, res, next) => { try { res.json(await payload(req.user)); } catch (e) { next(e); } });

router.put('/me', auth, async (req, res, next) => {
  try {
    ['name', 'phone', 'gender', 'dob', 'bloodGroup'].forEach((k) => { if (req.body[k] !== undefined) req.user[k] = req.body[k]; });
    await req.user.save();
    res.json(await payload(req.user));
  } catch (e) { next(e); }
});

module.exports = router;
