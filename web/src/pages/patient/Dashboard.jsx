import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { prettyTime, today } from '../../api';
import { useAuth } from '../../AuthContext';
import { getSocket } from '../../socket';
import Icon from '../../components/Icon';
import StatusBadge from '../../components/StatusBadge';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appts, setAppts] = useState([]);
  const [bp, setBp] = useState([]);
  const [rem, setRem] = useState([]);

  const load = () => { api.get('/appointments/mine').then((r) => setAppts(r.data)); api.get('/vitals', { params: { type: 'bp' } }).then((r) => setBp(r.data)); api.get('/reminders').then((r) => setRem(r.data)); };
  useEffect(() => {
    load();
    const s = getSocket(); const on = () => api.get('/appointments/mine').then((r) => setAppts(r.data));
    s.on('appointment:updated', on);
    return () => s.off('appointment:updated', on);
  }, []);

  const t = today();
  const upcoming = appts.filter((a) => ['pending', 'confirmed'].includes(a.status) && a.date >= t).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcoming[0];
  const active = rem.filter((r) => r.startDate <= t && r.endDate >= t);
  const slots = active.flatMap((r) => r.times.map((time) => ({ r, time, done: r.taken.includes(`${t}|${time}`) }))).sort((a, b) => a.time.localeCompare(b.time));
  const toggle = async (r, time) => { const { data } = await api.put(`/reminders/${r._id}/take`, { date: t, time }); setRem(rem.map((x) => (x._id === r._id ? data : x))); };
  const last = bp[bp.length - 1];
  const chart = bp.slice(-14).map((v) => ({ day: new Date(v.measuredAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }), Systolic: v.value, Diastolic: v.value2 }));

  return (
    <>
      <div className="pagetitle"><h1>Hello, {user.name.split(' ')[0]}</h1><p>Here is your health at a glance.</p></div>
      <div className="grid g4 mb">
        <div className="card stat hot"><div className="icobox" style={{ background: '#ffffff30' }}><Icon name="calendar" /></div><div><div className="num">{upcoming.length}</div><div className="muted small">Upcoming visits</div></div></div>
        <div className="card stat"><div className="icobox i"><Icon name="check" /></div><div><div className="num">{appts.filter((a) => a.status === 'completed').length}</div><div className="muted small">Completed visits</div></div></div>
        <div className="card stat"><div className="icobox o"><Icon name="pill" /></div><div><div className="num">{active.length}</div><div className="muted small">Active medicines</div></div></div>
        <div className="card stat"><div className="icobox p"><Icon name="activity" /></div><div><div className="num">{last ? `${last.value}/${last.value2}` : '--'}</div><div className="muted small">Latest BP (mmHg)</div></div></div>
      </div>

      <div className="two">
        <div className="col">
          <div className="card">
            <div className="row between"><h3>Next appointment</h3><Link to="/app/appointments" className="link">View all</Link></div>
            {next ? (
              <div className="apptrow">
                <div className="datebox"><b>{new Date(`${next.date}T00:00:00`).getDate()}</b><span>{new Date(`${next.date}T00:00:00`).toLocaleDateString('en', { month: 'short' })}</span></div>
                <div className="grow"><b>Dr. {next.doctor.user.name}</b><div className="muted small">{next.doctor.specialty} · {prettyTime(next.time)}</div></div>
                <StatusBadge status={next.status} /><Link to={`/app/appointments/${next._id}`} className="btn sm">Open</Link>
              </div>
            ) : <div className="empty">No upcoming visits. <Link to="/doctors" className="link">Find a doctor</Link></div>}
          </div>
          <div className="card">
            <div className="row between"><h3>Blood pressure, last 14 readings</h3><Link to="/app/records" className="link">Log vitals</Link></div>
            {chart.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={chart}><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" fontSize={12} /><YAxis domain={['dataMin - 10', 'dataMax + 10']} fontSize={12} /><Tooltip />
                  <Area type="monotone" dataKey="Systolic" stroke="#0d9488" strokeWidth={3} fill="url(#g1)" /><Area type="monotone" dataKey="Diastolic" stroke="#6366f1" strokeWidth={3} fill="none" /></AreaChart>
              </ResponsiveContainer>
            ) : <div className="empty">No readings yet.</div>}
          </div>
        </div>
        <div className="col">
          <div className="card">
            <div className="row between"><h3>Today's medicines</h3><Link to="/app/reminders" className="link">Manage</Link></div>
            {slots.map(({ r, time, done }) => (
              <div key={r._id + time} className={`check ${done ? 'done' : ''}`} onClick={() => toggle(r, time)}><div className="box">{done && <Icon name="check" size={16} />}</div><div className="grow"><div className="label"><b>{r.medicine}</b></div><div className="muted small">{r.dosage} · {prettyTime(time)}</div></div></div>
            ))}
            {!slots.length && <div className="empty">No medicines scheduled today.</div>}
          </div>
          <div className="card">
            <h3>Quick actions</h3>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Link to="/doctors" className="btn ghost"><Icon name="search" size={18} /> Find doctor</Link>
              <Link to="/app/symptoms" className="btn ghost"><Icon name="sparkle" size={18} /> Symptoms</Link>
              <Link to="/app/records" className="btn ghost"><Icon name="activity" size={18} /> Log vitals</Link>
              <Link to="/app/reminders" className="btn ghost"><Icon name="pill" size={18} /> Add medicine</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
