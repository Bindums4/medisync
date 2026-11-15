import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getSocket } from '../socket';
import Avatar from './Avatar';
import Icon from './Icon';
import { Logo } from './PublicLayout';

const NAV = {
  patient: [['/app', 'Dashboard', 'grid', true], ['/doctors', 'Find doctors', 'search'], ['/app/appointments', 'Appointments', 'calendar'], ['/app/records', 'Health records', 'activity'], ['/app/reminders', 'Medicines', 'pill'], ['/app/symptoms', 'Symptom checker', 'sparkle'], ['/app/profile', 'My profile', 'user']],
  doctor: [['/app', 'Dashboard', 'grid', true], ['/app/appointments', 'Appointments', 'calendar'], ['/app/availability', 'Availability', 'clock'], ['/app/profile', 'My profile', 'user']],
  admin: [['/app', 'Dashboard', 'grid', true], ['/app/doctors', 'Doctors', 'shield'], ['/app/users', 'Users', 'users'], ['/app/appointments', 'Appointments', 'calendar']],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState('');
  const unread = notes.filter((n) => !n.read).length;

  const load = useCallback(() => api.get('/notifications').then((r) => setNotes(r.data)).catch(() => {}), []);
  useEffect(() => {
    load();
    const s = getSocket();
    const on = (n) => { setNotes((p) => [n, ...p]); setToast(n.text); setTimeout(() => setToast(''), 5000); };
    s.on('notification', on);
    return () => s.off('notification', on);
  }, [load]);

  const readAll = async () => { await api.put('/notifications/read-all'); setNotes(notes.map((n) => ({ ...n, read: true }))); };
  const go = (n) => { setOpen(false); if (n.link) nav(n.link); };
  const title = user.role === 'doctor' ? `Dr. ${user.name}` : user.name;

  return (
    <div className="shell">
      <aside className={`side ${menu ? 'open' : ''}`} onClick={() => setMenu(false)}>
        <Logo light />
        <nav>
          {NAV[user.role].map(([to, label, icon, end]) => <NavLink key={to} to={to} end={end}><Icon name={icon} size={18} />{label}</NavLink>)}
        </nav>
        <button className="logout" onClick={logout}><Icon name="logout" size={18} /> Log out</button>
      </aside>
      <div className="content">
        <header className="topbar">
          <button className="menubtn" onClick={() => setMenu(!menu)} aria-label="Menu"><Icon name="menu" /></button>
          <div><div className="muted small">Welcome back</div><b>{title}</b></div>
          <div className="row gap">
            <div className="bellwrap">
              <button className="bell" onClick={() => setOpen(!open)} aria-label="Notifications"><Icon name="bell" />{unread > 0 && <span className="dotbadge">{unread}</span>}</button>
              {open && (
                <div className="dropdown">
                  <div className="row between"><b>Notifications</b><button className="link" onClick={readAll}>Mark all read</button></div>
                  {notes.slice(0, 8).map((n) => (<button key={n._id} className={`note ${n.read ? '' : 'unread'}`} onClick={() => go(n)}><span>{n.text}</span><span className="muted small">{new Date(n.createdAt).toLocaleString()}</span></button>))}
                  {!notes.length && <p className="muted small center">You're all caught up.</p>}
                </div>
              )}
            </div>
            <Avatar name={user.name} size={40} />
          </div>
        </header>
        <main className="page"><Outlet /></main>
      </div>
      {toast && <div className="toast"><Icon name="bell" size={18} /> {toast}</div>}
    </div>
  );
}
