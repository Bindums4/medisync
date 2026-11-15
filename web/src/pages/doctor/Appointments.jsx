import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, prettyDate, prettyTime } from '../../api';
import { getSocket } from '../../socket';
import Avatar from '../../components/Avatar';
import CompleteModal from '../../components/CompleteModal';
import StatusBadge from '../../components/StatusBadge';

const TABS = [['pending', 'Pending'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];

export default function DoctorAppointments() {
  const [list, setList] = useState([]);
  const [tab, setTab] = useState('pending');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get('/appointments/mine').then((r) => setList(r.data));
  useEffect(() => {
    load();
    const s = getSocket();
    s.on('appointment:new', load); s.on('appointment:updated', load);
    return () => { s.off('appointment:new', load); s.off('appointment:updated', load); };
  }, []);

  const act = async (id, status) => { setError(''); try { await api.put(`/appointments/${id}/status`, { status }); load(); } catch (e) { setError(errMsg(e)); } };
  const rows = list.filter((a) => a.status === tab).sort((a, b) => (tab === 'completed' || tab === 'cancelled' ? (b.date + b.time).localeCompare(a.date + a.time) : (a.date + a.time).localeCompare(b.date + b.time)));

  return (
    <>
      <div className="pagetitle"><h1>Appointments</h1><p>Confirm requests, consult and send prescriptions.</p></div>
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l} ({list.filter((a) => a.status === k).length})</button>)}</div>
      {error && <p className="error">{error}</p>}
      <div className="col">
        {rows.map((a) => (
          <div key={a._id} className="card"><div className="apptrow" style={{ background: 'transparent', border: 0, padding: 0 }}>
            <Avatar name={a.patient.name} size={52} />
            <div className="grow"><b>{a.patient.name}</b><div className="muted small">{prettyDate(a.date)} · {prettyTime(a.time)}</div><div className="small">{a.reason}</div></div>
            <StatusBadge status={a.status} />
            {a.status === 'pending' && <><button className="btn ok sm" onClick={() => act(a._id, 'confirmed')}>Confirm</button><button className="btn danger sm" onClick={() => confirm('Decline this appointment?') && act(a._id, 'cancelled')}>Decline</button></>}
            {a.status === 'confirmed' && <><button className="btn sm" onClick={() => setModal(a)}>Complete</button><button className="btn danger sm" onClick={() => confirm('Cancel this appointment?') && act(a._id, 'cancelled')}>Cancel</button></>}
            <Link to={`/app/appointments/${a._id}`} className="btn ghost sm">Open</Link>
          </div></div>
        ))}
        {!rows.length && <div className="card empty">No {tab} appointments.</div>}
      </div>
      {modal && <CompleteModal appointment={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </>
  );
}
