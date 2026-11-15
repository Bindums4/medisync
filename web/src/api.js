import axios from 'axios';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: `${API_URL}/api` });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('medisync_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export const money = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => ymd(new Date());
export const prettyDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const prettyTime = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
export const SPECIALTIES = ['General Physician', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dentistry', 'Psychiatry'];
export default api;
