// Use your computer's LAN IP, not localhost. Android emulator: http://10.0.2.2:5000
export const API_URL = 'http://192.168.1.5:5000';
export const C = { brand: '#0d9488', brandDark: '#0f766e', soft: '#ccfbf1', bg: '#f4f8f9', card: '#fff', text: '#0f172a', muted: '#64748b', line: '#e2e8f0', danger: '#ef4444', warn: '#f59e0b', ok: '#10b981', accent: '#6366f1' };
export const money = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd(new Date());
export const prettyDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const prettyTime = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`; };
export const STATUS = { pending: ['#fef3c7', '#b45309'], confirmed: ['#dbeafe', '#1d4ed8'], completed: ['#d1fae5', '#047857'], cancelled: ['#fee2e2', '#b91c1c'] };
