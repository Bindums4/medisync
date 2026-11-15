import { useEffect, useState } from 'react';
import api from '../../api';
import Avatar from '../../components/Avatar';

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  useEffect(() => { api.get('/admin/users').then((r) => setList(r.data)); }, []);
  const rows = list.filter((u) => (!role || u.role === role) && (`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <div className="pagetitle"><h1>Users</h1><p>{list.length} registered accounts.</p></div>
      <div className="filterbar"><input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /><select value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="patient">Patients</option><option value="doctor">Doctors</option><option value="admin">Admins</option></select></div>
      <div className="card tablewrap"><table><thead><tr><th>User</th><th>Role</th><th>Phone</th><th>Joined</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u._id}><td><div className="row"><Avatar name={u.name} size={34} /><div><b>{u.name}</b><div className="muted small">{u.email}</div></div></div></td><td><span className="chip teal" style={{ textTransform: 'capitalize' }}>{u.role}</span></td><td>{u.phone || '-'}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
    </>
  );
}
