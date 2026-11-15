import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg, money, prettyTime } from '../../api';
import { useAuth } from '../../AuthContext';
import { getSocket } from '../../socket';
import CompleteModal from '../../components/CompleteModal';
import Icon from '../../components/Icon';
import StatusBadge from '../../components/StatusBadge';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get('/doctors/me/stats').then((r) => setS(r.data));
  useEffect(() => {
    load();
    const sock = getSocket();
    sock.on('appointment:new', load); sock.on('appointment:updated', load);
    return () => { sock.off('appointment:new', load); sock.off('appointment:updated', load); };
  }, []);

  const act = async (id, status) => { setError(''); try { await api.put(`/appointments/${id}/status`, { status }); load(); } catch (e) { setError(errMsg(e)); } };
  if (!s) return <p className="muted">Loading…</p>;
  const t = s.totals;

  return (
    <>
      <div className="pagetitle"><h1>Good day, Dr. {user.name.split(' ').slice(-1)[0]}</h1><p>Here is your practice overview.</p></div>
      {!s.approved && <div className="urgency medium mb">Your profile is awaiting admin approval. Patients can book you once it is approved.</div>}
      <div className="grid g4 mb">
        <div className="card stat hot"><div className="icobox" style={{ background: '#ffffff30' }}><Icon name="clock" /></div><div><div className="num">{t.pending}</div><div className="muted small">Awaiting confirmation</div></div></div>
        <div className="card stat"><div className="icobox i"><Icon name="calendar" /></div><div><div className="num">{t.upcoming}</div><div className="muted small">Confirmed upcoming</div></div></div>
        <div className="card stat"><div className="icobox o"><Icon name="users" /></div><div><div className="num">{t.patients}</div><div className="muted small">Patients treated</div></div></div>
        <div className="card stat"><div className="icobox p"><Icon name="rupee" /></div><div><div className="num">{money(t.earnings)}</div><div className="muted small">Total earnings</div></div></div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="two">
        <div className="card">
          <div className="row between"><h3>Today's schedule</h3><Link to="/app/appointments" className="link">All appointments</Link></div>
          {s.today.map((a) => (
            <div key={a._id} className="apptrow">
              <div className="datebox"><b style={{ fontSize: 15 }}>{prettyTime(a.time).split(' ')[0]}</b><span>{prettyTime(a.time).split(' ')[1]}</span></div>
              <div className="grow"><b>{a.patient.name}</b><div className="muted small">{a.reason}</div></div>
              <StatusBadge status={a.status} />
              {a.status === 'pending' && <button className="btn ok sm" onClick={() => act(a._id, 'confirmed')}>Confirm</button>}
              {a.status === 'confirmed' && <button className="btn sm" onClick={() => setModal(a)}>Complete</button>}
              <Link to={`/app/appointments/${a._id}`} className="btn ghost sm">Open</Link>
            </div>
          ))}
          {!s.today.length && <div className="empty">No appointments today. Enjoy the quiet.</div>}
        </div>
        <div className="card">
          <h3>Appointments, last 7 days</h3>
          <ResponsiveContainer width="100%" height={250}><BarChart data={s.trend}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="count" name="Appointments" fill="#0d9488" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </div>
      {modal && <CompleteModal appointment={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </>
  );
}
