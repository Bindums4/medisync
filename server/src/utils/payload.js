const DoctorProfile = require('../models/DoctorProfile');
// User JSON plus doctor profile when the user is a doctor
module.exports = async (user) => {
  const o = user.toJSON();
  if (user.role === 'doctor') o.doctor = await DoctorProfile.findOne({ user: user._id });
  return o;
};
