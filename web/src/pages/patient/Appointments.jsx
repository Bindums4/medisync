import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, prettyDate, prettyTime, today } from '../../api';
import { getSocket } from '../../socket';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';

export default function PatientAppointments() {
  const [list, setList] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [error, setError] = useState('');
  const load = () => api.get('/appointments/mine').then((r) => setList(r.data));
  useEffect(() => { load(); const s = getSocket(); s.on('appointment:updated', load); return () => s.off('appointment:updated', load); }, []);

  const t = today();
  const groups = {
    upcoming: list.filter((a) => ['pending', 'confirmed'].includes(a.status) && a.date >= t).reverse(),
    past: list.filter((a) => a.status === 'completed' || (['pending', 'confirmed'].includes(a.status) && a.date < t)),
    cancelled: list.filter((a) => a.status === 'cancelled'),
  };
  const cancel = async (id) => { if (!confirm('Cancel this appointment?')) return; try { await api.put(`/appointments/${id}/status`, { status: 'cancelled' }); load(); } catch (e) { setError(errMsg(e)); } };

  return (
    <>
      <div className="pagetitle row between wrap"><div><h1>My appointments</h1><p>Track, chat and manage your visits.</p></div><Link to="/doctors" className="btn">Book new</Link></div>
      <div className="tabs">{Object.keys(groups).map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} style={{ textTransform: 'capitalize' }}>{k} ({groups[k].length})</button>)}</div>
      {error && <p className="error">{error}</p>}
      <div className="col">
        {groups[tab].map((a) => (
          <div key={a._id} className="card"><div className="apptrow" style={{ background: 'transparent', border: 0, padding: 0 }}>
            <Avatar name={`Dr. ${a.doctor.user.name}`} size={52} />
            <div className="grow"><b>Dr. {a.doctor.user.name}</b><div className="muted small">{a.doctor.specialty} · {prettyDate(a.date)} · {prettyTime(a.time)}</div><div className="small">{a.reason}</div></div>
            <StatusBadge status={a.status} />
            <Link to={`/app/appointments/${a._id}`} className="btn ghost sm">Details</Link>
            {['pending', 'confirmed'].includes(a.status) && <button className="btn danger sm" onClick={() => cancel(a._id)}>Cancel</button>}
          </div></div>
        ))}
        {!groups[tab].length && <div className="card empty">Nothing here yet.</div>}
      </div>
    </>
  );
}
