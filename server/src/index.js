require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Appointment = require('./models/Appointment');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ app: 'MediSync API', status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

app.use((err, _req, res, _next) => {
  if (err.name === 'ValidationError') err.status = 400;
  if (!err.status || err.status >= 500) console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

io.use((socket, next) => {
  try { socket.userId = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET).id; next(); }
  catch { next(new Error('unauthorised')); }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  const member = (a) => a && (a.patient.equals(socket.userId) || a.doctorUser.equals(socket.userId));
  socket.on('appt:join', async (id) => { try { if (member(await Appointment.findById(id))) socket.join(`appt:${id}`); } catch {} });
  socket.on('chat:send', async ({ appointment, text }) => {
    try {
      if (!text || !text.trim()) return;
      const a = await Appointment.findById(appointment);
      if (!member(a) || a.status === 'cancelled') return;
      const msg = await Message.create({ appointment, sender: socket.userId, text: text.trim() });
      io.to(`appt:${appointment}`).emit('chat:message', await msg.populate('sender', 'name role'));
    } catch (e) { console.error(e.message); }
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`MediSync API running on :${PORT}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
