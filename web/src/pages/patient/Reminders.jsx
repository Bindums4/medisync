import { useEffect, useState } from 'react';
import api, { errMsg, prettyTime, today } from '../../api';
import Icon from '../../components/Icon';

export default function Reminders() {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ medicine: '', dosage: '', days: 7, times: ['08:00'] });
  const [error, setError] = useState('');
  const t = today();
  const load = () => api.get('/reminders').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const active = list.filter((r) => r.startDate <= t && r.endDate >= t);
  const slots = active.flatMap((r) => r.times.map((time) => ({ r, time, done: r.taken.includes(`${t}|${time}`) }))).sort((a, b) => a.time.localeCompare(b.time));
  const doneCount = slots.filter((s) => s.done).length;

  const toggle = async (r, time) => { const { data } = await api.put(`/reminders/${r._id}/take`, { date: t, time }); setList(list.map((x) => (x._id === r._id ? data : x))); };
  const add = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/reminders', f); setF({ medicine: '', dosage: '', days: 7, times: ['08:00'] }); load(); } catch (err) { setError(errMsg(err)); }
  };
  const del = async (id) => { await api.delete(`/reminders/${id}`); load(); };
  const setTime = (i, v) => setF({ ...f, times: f.times.map((x, k) => (k === i ? v : x)) });
  const adherence = (r) => { const total = r.times.length * Math.max(1, Math.min(r.endDate >= t ? Math.round((new Date(`${t}T00:00:00`) - new Date(`${r.startDate}T00:00:00`)) / 86400000) + 1 : 0, 365)); return total ? Math.min(100, Math.round((r.taken.length / total) * 100)) : 0; };

  return (
    <>
      <div className="pagetitle"><h1>Medicine reminders</h1><p>Never miss a dose. Tick medicines off as you take them.</p></div>
      <div className="two">
        <div className="col">
          <div className="card">
            <div className="row between"><h3>Today's schedule</h3><span className="chip teal">{doneCount}/{slots.length} taken</span></div>
            {slots.map(({ r, time, done }) => (
              <div key={r._id + time} className={`check ${done ? 'done' : ''}`} onClick={() => toggle(r, time)}><div className="box">{done && <Icon name="check" size={16} />}</div><div className="grow"><div className="label"><b>{r.medicine}</b> <span className="muted">{r.dosage}</span></div></div><span className="chip">{prettyTime(time)}</span></div>
            ))}
            {!slots.length && <div className="empty">Nothing scheduled for today.</div>}
          </div>
          <div className="card">
            <h3>All medicines</h3>
            {list.map((r) => (<div key={r._id} className="apptrow"><div className="icobox o"><Icon name="pill" /></div><div className="grow"><b>{r.medicine}</b><div className="muted small">{r.dosage} · {r.times.map(prettyTime).join(', ')} · until {r.endDate}</div></div><span className="chip teal">{adherence(r)}% on track</span><button className="x" onClick={() => del(r._id)} aria-label="Delete"><Icon name="trash" size={18} /></button></div>))}
            {!list.length && <div className="empty">No medicines added yet.</div>}
          </div>
        </div>
        <form className="card" onSubmit={add}>
          <h3>Add a medicine</h3>
          <div><label>Medicine</label><input placeholder="e.g. Metformin 500mg" value={f.medicine} onChange={(e) => setF({ ...f, medicine: e.target.value })} required /></div>
          <div className="row"><div style={{ flex: 1 }}><label>Dosage</label><input placeholder="1 tablet" value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} /></div><div style={{ flex: 1 }}><label>For how many days</label><input type="number" min="1" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></div></div>
          <label>Times each day</label>
          {f.times.map((x, i) => (<div className="row" key={i}><input type="time" value={x} onChange={(e) => setTime(i, e.target.value)} />{f.times.length > 1 && <button type="button" className="x" onClick={() => setF({ ...f, times: f.times.filter((_, k) => k !== i) })} aria-label="Remove time"><Icon name="x" /></button>}</div>))}
          <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, times: [...f.times, '20:00'] })}><Icon name="plus" size={16} /> Add another time</button>
          {error && <p className="error">{error}</p>}
          <button className="btn">Save reminder</button>
        </form>
      </div>
    </>
  );
}
