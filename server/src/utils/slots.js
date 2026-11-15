const pad = (n) => String(n).padStart(2, '0');
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const offsetDate = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };
const isPast = (date, time) => new Date(`${date}T${time}:00`) < new Date();

// All times a doctor works on a given date (ignores bookings)
function buildSlots(profile, date) {
  const weekday = new Date(`${date}T00:00:00`).getDay();
  const a = profile.availability.find((x) => x.day === weekday && x.enabled);
  if (!a) return [];
  const out = [];
  for (let t = toMin(a.start); t + profile.slotMinutes <= toMin(a.end); t += profile.slotMinutes) out.push(fromMin(t));
  return out;
}
module.exports = { buildSlots, dateStr, offsetDate, isPast, toMin };
