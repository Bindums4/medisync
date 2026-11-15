import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { money, prettyDate, prettyTime } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminAppointments() {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('');
  useEffect(() => { api.get('/admin/appointments').then((r) => setList(r.data)); }, []);
  const rows = list.filter((a) => !status || a.status === status);

  return (
    <>
      <div className="pagetitle row between wrap"><div><h1>All appointments</h1><p>Latest 150 across the platform.</p></div><select style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{['pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select></div>
      <div className="card tablewrap"><table><thead><tr><th>Patient</th><th>Doctor</th><th>When</th><th>Fee</th><th>Status</th><th></th></tr></thead>
        <tbody>{rows.map((a) => <tr key={a._id}><td>{a.patient?.name}</td><td>Dr. {a.doctor?.user?.name}<div className="muted small">{a.doctor?.specialty}</div></td><td>{prettyDate(a.date)}<div className="muted small">{prettyTime(a.time)}</div></td><td>{money(a.fee)}</td><td><StatusBadge status={a.status} /></td><td><Link className="link" to={`/app/appointments/${a._id}`}>View</Link></td></tr>)}</tbody></table>
        {!rows.length && <div className="empty">No appointments.</div>}</div>
    </>
  );
}
