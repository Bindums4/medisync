require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DoctorProfile = require('./models/DoctorProfile');
const Appointment = require('./models/Appointment');
const Review = require('./models/Review');
const Message = require('./models/Message');
const Vital = require('./models/Vital');
const Reminder = require('./models/Reminder');
const Notification = require('./models/Notification');
const { offsetDate } = require('./utils/slots');

const DOCS = [
  ['Ananya Rao', 'ananya', 'Cardiology', 14, 900, 'Bengaluru', 'Apollo Heart Clinic', 'MBBS, MD, DM Cardiology', 'Interventional cardiologist focused on preventive heart care, hypertension and cardiac rehabilitation.', true],
  ['Karan Mehta', 'karan', 'Dermatology', 9, 700, 'Bengaluru', 'Glow Skin Studio', 'MBBS, MD Dermatology', 'Treats acne, eczema, hair loss and cosmetic skin concerns with evidence-based care.', true],
  ['Sneha Iyer', 'sneha', 'Pediatrics', 11, 600, 'Chennai', 'Little Steps Children Hospital', 'MBBS, DCH, MD Pediatrics', 'Caring for newborns to teenagers: vaccinations, growth, nutrition and common illnesses.', true],
  ['Rahul Verma', 'rahul', 'Orthopedics', 16, 1000, 'Hyderabad', 'BoneCare Centre', 'MBBS, MS Orthopedics', 'Joint replacement, sports injuries and spine care for active adults and seniors.', true],
  ['Priya Nair', 'priya', 'General Physician', 8, 400, 'Bengaluru', 'City Family Clinic', 'MBBS, MD General Medicine', 'First point of care for fever, infections, diabetes, thyroid and lifestyle health.', true],
  ['Arjun Menon', 'arjun', 'Neurology', 13, 1100, 'Kochi', 'NeuroLife Institute', 'MBBS, MD, DM Neurology', 'Specialist in migraine, epilepsy, stroke recovery and movement disorders.', true],
  ['Meera Kapoor', 'meera', 'Dentistry', 7, 500, 'Mumbai', 'Smile Dental Care', 'BDS, MDS Orthodontics', 'Braces, aligners, root canals and gentle dentistry for the whole family.', true],
  ['Vikram Shah', 'vikram', 'Psychiatry', 6, 800, 'Pune', 'MindWell Clinic', 'MBBS, MD Psychiatry', 'Supports patients with anxiety, depression, sleep and stress management.', false],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, DoctorProfile, Appointment, Review, Message, Vital, Reminder, Notification].map((m) => m.deleteMany({})));
  await Appointment.syncIndexes();

  await User.create({ name: 'MediSync Admin', email: 'admin@medisync.dev', password: 'Admin@123', role: 'admin' });
  const patients = [];
  for (const [n, e, ph] of [['Riya Sharma', 'patient', '9876543210'], ['Amit Kumar', 'amit', '9876500001'], ['Neha Singh', 'neha', '9876500002']])
    patients.push(await User.create({ name: n, email: `${e}@medisync.dev`, password: 'Patient@123', role: 'patient', phone: ph, gender: 'female', dob: '1996-05-14', bloodGroup: 'B+' }));

  const profiles = [];
  for (const [name, e, specialty, experience, fee, city, clinic, qualifications, bio, approved] of DOCS) {
    const u = await User.create({ name, email: `${e}@medisync.dev`, password: 'Doctor@123', role: 'doctor', phone: '9000000000' });
    profiles.push(await DoctorProfile.create({ user: u._id, specialty, experience, fee, city, clinic, qualifications, bio, approved, rating: 0, numReviews: 0 }));
  }

  const A = (p, d, date, time, status, extra = {}) => Appointment.create({ patient: p._id, doctor: d._id, doctorUser: d.user, date, time, status, fee: d.fee, reason: extra.reason || 'General consultation', ...extra });
  const rx = [{ medicine: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily, morning', days: 30 }, { medicine: 'Vitamin D3', dosage: '1 capsule', frequency: 'Weekly', days: 8 }];
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30'];

  // history spread over the last 7 days for charts
  let k = 0;
  for (let day = 7; day >= 1; day--) {
    for (let j = 0; j < 3 + (day % 3); j++) {
      const d = profiles[(k + j) % 7]; const p = patients[(k + j) % 3];
      const a = await A(p, d, offsetDate(-day), times[(k + j * 2) % times.length], 'completed', { reason: 'Follow-up visit', notes: 'Condition stable. Continue current routine.', completedAt: new Date() });
      if ((k + j) % 3 === 0) { await Review.create({ doctor: d._id, patient: p._id, appointment: a._id, rating: 4 + ((k + j) % 2), comment: ['Very patient and clear explanations.', 'Great experience, highly recommend.', 'Friendly doctor and no waiting time.'][(k + j) % 3] }); a.reviewed = true; await a.save(); }
    }
    k += 3;
  }
  for (const d of profiles) { const r = await Review.find({ doctor: d._id }); if (r.length) { d.numReviews = r.length; d.rating = Math.round((r.reduce((s, x) => s + x.rating, 0) / r.length) * 10) / 10; await d.save(); } }

  const main = patients[0];
  const done = await A(main, profiles[0], offsetDate(-10), '10:00', 'completed', { reason: 'High blood pressure check', notes: 'BP slightly elevated. Reduce salt, walk 30 minutes daily, review in 4 weeks.', prescription: rx, completedAt: new Date() });
  const conf = await A(main, profiles[0], offsetDate(2), '10:30', 'confirmed', { reason: 'Follow-up for blood pressure' });
  await A(main, profiles[1], offsetDate(4), '11:00', 'pending', { reason: 'Skin allergy on arms' });
  await A(patients[1], profiles[4], offsetDate(0), '17:00', 'confirmed', { reason: 'Fever and cold' }).catch(() => {});
  await A(patients[2], profiles[2], offsetDate(1), '09:30', 'pending', { reason: 'Child vaccination' });

  await Message.create([
    { appointment: conf._id, sender: profiles[0].user, text: 'Hello Riya, please bring your latest BP readings to the visit.' },
    { appointment: conf._id, sender: main._id, text: 'Sure doctor, I have logged them in the app for the last two weeks.' },
  ]);

  for (let i = 13; i >= 0; i--) {
    const t = new Date(); t.setDate(t.getDate() - i); t.setHours(8, 0, 0, 0);
    await Vital.create([
      { patient: main._id, type: 'bp', value: 128 + ((i * 7) % 14), value2: 82 + ((i * 3) % 8), unit: 'mmHg', measuredAt: t },
      { patient: main._id, type: 'sugar', value: 96 + ((i * 5) % 22), unit: 'mg/dL', measuredAt: t },
      { patient: main._id, type: 'weight', value: 64 - i * 0.05, unit: 'kg', measuredAt: t },
      { patient: main._id, type: 'heart', value: 70 + ((i * 4) % 12), unit: 'bpm', measuredAt: t },
    ]);
  }
  await Reminder.create([
    { patient: main._id, medicine: 'Amlodipine 5mg', dosage: '1 tablet', times: ['08:00'], startDate: offsetDate(-3), endDate: offsetDate(26) },
    { patient: main._id, medicine: 'Vitamin D3', dosage: '1 capsule', times: ['09:00', '21:00'], startDate: offsetDate(-1), endDate: offsetDate(5) },
  ]);
  await Notification.create([
    { user: main._id, text: `Dr. Ananya Rao confirmed your appointment on ${offsetDate(2)} at 10:30`, link: `/app/appointments/${conf._id}` },
    { user: main._id, text: 'Your prescription from your last visit is ready.', link: `/app/appointments/${done._id}` },
  ]);

  console.log('Seeded.\n  Patient: patient@medisync.dev / Patient@123\n  Doctor:  ananya@medisync.dev / Doctor@123 (also karan, sneha, rahul, priya, arjun, meera)\n  Pending doctor: vikram@medisync.dev / Doctor@123\n  Admin:   admin@medisync.dev / Admin@123');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
