import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { money } from '../../api';
import Icon from '../../components/Icon';

const COLORS = ['#0d9488', '#6366f1', '#ec4899', '#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444'];
const ST = { pending: '#f59e0b', confirmed: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setD(r.data)); }, []);
  if (!d) return <p className="muted">Loading…</p>;
  const t = d.totals;
  const cards = [['Patients', t.patients, 'users', ''], ['Doctors', t.doctors, 'shield', 'i'], ['Pending approvals', t.pendingDoctors, 'clock', 'o'], ['Appointments', t.appointments, 'calendar', ''], ['Platform revenue', money(t.revenue), 'rupee', 'p']];

  return (
    <>
      <div className="pagetitle"><h1>Platform overview</h1><p>Everything happening across MediSync.</p></div>
      <div className="grid g4 mb">{cards.map(([l, v, i, c]) => <div key={l} className="card stat"><div className={`icobox ${c}`}><Icon name={i} /></div><div><div className="num">{v}</div><div className="muted small">{l}</div></div></div>)}</div>
      <div className="grid g2">
        <div className="card"><h3>Appointments, last 7 days</h3><ResponsiveContainer width="100%" height={260}><BarChart data={d.trend}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="appointments" fill="#0d9488" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="card"><h3>Demand by specialty</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={d.bySpecialty} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{d.bySpecialty.map((x, i) => <Cell key={x.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
        <div className="card"><h3>Appointments by status</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={d.byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{d.byStatus.map((x) => <Cell key={x.name} fill={ST[x.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
      </div>
    </>
  );
}
