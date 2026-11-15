import { useEffect, useState } from 'react';
import api from '../../api';
import Avatar from '../../components/Avatar';

export default function AdminDoctors() {
  const [list, setList] = useState([]);
  const [tab, setTab] = useState('pending');
  const load = () => api.get('/admin/doctors').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const decide = async (id, approved) => { await api.put(`/admin/doctors/${id}/approve`, { approved }); load(); };
  const rows = list.filter((p) => (tab === 'pending' ? !p.approved : p.approved));

  return (
    <>
      <div className="pagetitle"><h1>Doctors</h1><p>Review new doctor registrations before they go live.</p></div>
      <div className="tabs"><button className={tab === 'pending' ? 'on' : ''} onClick={() => setTab('pending')}>Pending ({list.filter((p) => !p.approved).length})</button><button className={tab === 'approved' ? 'on' : ''} onClick={() => setTab('approved')}>Approved ({list.filter((p) => p.approved).length})</button></div>
      <div className="col">
        {rows.map((p) => (
          <div key={p._id} className="card"><div className="apptrow" style={{ background: 'transparent', border: 0, padding: 0 }}>
            <Avatar name={p.user.name} size={52} />
            <div className="grow"><b>Dr. {p.user.name}</b><div className="muted small">{p.specialty} · {p.experience} yrs · {p.city || 'No city'} · {p.user.email}</div><div className="small muted">{p.qualifications}</div></div>
            {p.approved ? <button className="btn danger sm" onClick={() => decide(p._id, false)}>Suspend</button> : <button className="btn ok sm" onClick={() => decide(p._id, true)}>Approve</button>}
          </div></div>
        ))}
        {!rows.length && <div className="card empty">Nothing to show here.</div>}
      </div>
    </>
  );
}
