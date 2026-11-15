import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, money, prettyTime, ymd } from '../api';
import { useAuth } from '../AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Stars from '../components/Stars';

export default function DoctorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return { key: ymd(d), wd: d.toLocaleDateString('en', { weekday: 'short' }), day: d.getDate(), mon: d.toLocaleDateString('en', { month: 'short' }), dow: d.getDay() }; }), []);

  useEffect(() => { api.get(`/doctors/${id}`).then((r) => setData(r.data)).catch(() => nav('/doctors')); window.scrollTo(0, 0); }, [id, nav]);
  const works = (dow) => data?.doctor.availability.some((a) => a.day === dow && a.enabled);
  useEffect(() => { if (data && !date) { const first = days.find((d) => works(d.dow)); if (first) setDate(first.key); } }, [data]);
  useEffect(() => { if (!date) return; setTime(''); api.get(`/doctors/${id}/slots`, { params: { date } }).then((r) => setSlots(r.data.slots)); }, [date, id]);

  if (!data) return <div className="container"><p className="muted" style={{ padding: 40 }}>Loading…</p></div>;
  const { doctor: d, reviews } = data;
  const name = `Dr. ${d.user.name}`;

  const book = async () => {
    setError('');
    if (!user) return nav('/login');
    setBusy(true);
    try { const { data: a } = await api.post('/appointments', { doctor: d._id, date, time, reason }); nav(`/app/appointments/${a._id}`); }
    catch (e) { setError(errMsg(e)); setBusy(false); api.get(`/doctors/${id}/slots`, { params: { date } }).then((r) => setSlots(r.data.slots)); }
  };

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <div className="two">
        <div className="col">
          <div className="card">
            <div className="profilehead">
              <Avatar name={name} size={96} />
              <div className="col" style={{ gap: 6 }}>
                <h1>{name}</h1>
                <div className="row wrap"><span className="chip teal">{d.specialty}</span><Stars value={d.rating} count={d.numReviews} /></div>
                <div className="muted small">{d.qualifications}</div>
                <div className="muted small row"><Icon name="pin" size={14} /> {[d.clinic, d.city].filter(Boolean).join(', ')}</div>
              </div>
            </div>
            <div className="grid g4" style={{ marginTop: 6 }}>
              <div><div className="muted small">Experience</div><b>{d.experience} years</b></div>
              <div><div className="muted small">Consultation fee</div><b>{money(d.fee)}</b></div>
              <div><div className="muted small">Slot length</div><b>{d.slotMinutes} min</b></div>
            </div>
          </div>
          <div className="card"><h3>About</h3><p className="muted">{d.bio || 'No biography added yet.'}</p></div>
          <div className="card">
            <h3>Patient reviews ({reviews.length})</h3>
            {reviews.map((r) => (<div key={r._id} className="col" style={{ gap: 4, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}><div className="row between"><b>{r.patient?.name}</b><Stars value={r.rating} /></div><p className="muted">{r.comment || 'No comment.'}</p></div>))}
            {!reviews.length && <p className="muted">No reviews yet.</p>}
          </div>
        </div>

        <div className="card booking">
          <h3>Book an appointment</h3>
          <div className="datestrip">
            {days.map((x) => <button key={x.key} disabled={!works(x.dow)} className={`datepill ${date === x.key ? 'on' : ''} ${!works(x.dow) ? 'off' : ''}`} onClick={() => setDate(x.key)}><span className="small">{x.wd}</span><b>{x.day}</b><span className="small">{x.mon}</span></button>)}
          </div>
          <label>Available times</label>
          {slots.length ? <div className="slots">{slots.map((s) => <button key={s.time} disabled={!s.available} className={`slot ${time === s.time ? 'on' : ''}`} onClick={() => setTime(s.time)}>{prettyTime(s.time)}</button>)}</div> : <p className="muted small">No slots on this day.</p>}
          <label>Reason for visit</label>
          <textarea placeholder="Briefly describe your concern" value={reason} onChange={(e) => setReason(e.target.value)} />
          {error && <p className="error">{error}</p>}
          {user && user.role !== 'patient' ? <p className="muted small">Log in as a patient to book appointments.</p> : (
            <button className="btn lg" disabled={!time || busy} onClick={book}>{busy ? 'Booking…' : user ? `Confirm · ${money(d.fee)}` : 'Log in to book'}</button>
          )}
          <p className="muted small center">You pay at the clinic. Free cancellation anytime.</p>
        </div>
      </div>
    </div>
  );
}
