const Notification = require('../models/Notification');
module.exports = async (io, userId, text, link = '') => {
  const n = await Notification.create({ user: userId, text, link });
  io.to(`user:${userId}`).emit('notification', n);
  return n;
};
