import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Availability() {
  const [av, setAv] = useState(null);
  const [slot, setSlot] = useState(30);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.get('/auth/me').then((r) => { const p = r.data.doctor; setAv([...p.availability].sort((a, b) => a.day - b.day)); setSlot(p.slotMinutes); }); }, []);
  const upd = (day, k, v) => setAv(av.map((a) => (a.day === day ? { ...a, [k]: v } : a)));
  const save = async () => {
    setError(''); setMsg('');
    try { await api.put('/doctors/me/availability', { availability: av, slotMinutes: slot }); setMsg('Availability saved'); setTimeout(() => setMsg(''), 2500); } catch (e) { setError(errMsg(e)); }
  };

  if (!av) return <p className="muted">Loading…</p>;
  const open = av.filter((a) => a.enabled).length;

  return (
    <>
      <div className="pagetitle"><h1>Availability</h1><p>Set your weekly hours. Patients can only book inside these windows.</p></div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="row between wrap"><div><b>{open} working days</b><div className="muted small">Changes apply to new bookings immediately.</div></div>
          <div className="row"><label style={{ margin: 0 }}>Slot length</label><select style={{ width: 120 }} value={slot} onChange={(e) => setSlot(Number(e.target.value))}>{[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}</select></div></div>
        {av.map((a) => (
          <div key={a.day} className="dayrow">
            <b>{DAYS[a.day]}</b>
            <button type="button" className={`switch ${a.enabled ? 'on' : ''}`} onClick={() => upd(a.day, 'enabled', !a.enabled)} aria-label={`Toggle ${DAYS[a.day]}`} />
            <input type="time" value={a.start} disabled={!a.enabled} onChange={(e) => upd(a.day, 'start', e.target.value)} />
            <input type="time" value={a.end} disabled={!a.enabled} onChange={(e) => upd(a.day, 'end', e.target.value)} />
          </div>
        ))}
        {error && <p className="error">{error}</p>}
        <div className="row"><button className="btn" onClick={save}>Save availability</button>{msg && <span className="ok">{msg}</span>}</div>
      </div>
    </>
  );
}
