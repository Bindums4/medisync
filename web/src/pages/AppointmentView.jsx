import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, money, prettyDate, prettyTime } from '../api';
import { useAuth } from '../AuthContext';
import { getSocket } from '../socket';
import Avatar from '../components/Avatar';
import Chat from '../components/Chat';
import CompleteModal from '../components/CompleteModal';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';

export default function AppointmentView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [a, setA] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [rv, setRv] = useState({ rating: 5, comment: '' });

  const load = () => api.get(`/appointments/${id}`).then((r) => setA(r.data)).catch(() => nav('/app/appointments'));
  useEffect(() => {
    load();
    const s = getSocket();
    const on = (u) => u._id === id && setA(u);
    s.on('appointment:updated', on);
    return () => s.off('appointment:updated', on);
  }, [id]);

  if (!a) return <p className="muted">Loading…</p>;
  const isDoc = user.role === 'doctor', isPatient = user.role === 'patient';
  const other = isDoc ? a.patient.name : `Dr. ${a.doctor.user.name}`;
  const act = async (status) => { setError(''); try { setA((await api.put(`/appointments/${id}/status`, { status })).data); } catch (e) { setError(errMsg(e)); } };
  const review = async (e) => { e.preventDefault(); setError(''); try { await api.post(`/appointments/${id}/review`, rv); load(); } catch (err) { setError(errMsg(err)); } };
  const live = ['pending', 'confirmed'].includes(a.status);

  return (
    <>
      <div className="pagetitle row between wrap"><div><h1>Appointment</h1><p>{prettyDate(a.date)} at {prettyTime(a.time)}</p></div><StatusBadge status={a.status} /></div>
      <div className="two">
        <div className="col">
          <div className="card">
            <div className="row gap"><Avatar name={other} size={60} /><div><h3>{other}</h3><span className="muted small">{isDoc ? [a.patient.gender, a.patient.bloodGroup && `Blood ${a.patient.bloodGroup}`, a.patient.phone].filter(Boolean).join(' · ') : a.doctor.specialty}</span></div></div>
            <hr />
            <div className="grid g2">
              <div><div className="muted small">Date and time</div><b>{prettyDate(a.date)}, {prettyTime(a.time)}</b></div>
              <div><div className="muted small">Consultation fee</div><b>{money(a.fee)}</b></div>
              <div style={{ gridColumn: '1 / -1' }}><div className="muted small">Reason for visit</div><b>{a.reason || 'General consultation'}</b></div>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="row wrap noprint">
              {isDoc && a.status === 'pending' && <button className="btn ok" onClick={() => act('confirmed')}><Icon name="check" size={18} /> Confirm</button>}
              {isDoc && a.status === 'confirmed' && <button className="btn" onClick={() => setModal(true)}><Icon name="file" size={18} /> Complete and prescribe</button>}
              {(isDoc || isPatient) && live && <button className="btn danger" onClick={() => confirm('Cancel this appointment?') && act('cancelled')}>Cancel appointment</button>}
              {isPatient && <Link className="btn ghost" to={`/doctors/${a.doctor._id}`}>View doctor</Link>}
            </div>
          </div>

          {a.status === 'completed' && (
            <div className="rxcard">
              <div className="row between"><h3 className="row"><Icon name="pill" /> Prescription and notes</h3><button className="btn ghost sm noprint" onClick={() => window.print()}>Print</button></div>
              {a.notes && <p style={{ margin: '10px 0' }}><b>Doctor's notes:</b> {a.notes}</p>}
              {a.prescription.length > 0 ? (
                <div className="tablewrap"><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Days</th></tr></thead><tbody>{a.prescription.map((p, i) => <tr key={i}><td><b>{p.medicine}</b></td><td>{p.dosage}</td><td>{p.frequency}</td><td>{p.days || '-'}</td></tr>)}</tbody></table></div>
              ) : <p className="muted">No medicines prescribed.</p>}
              <p className="muted small" style={{ marginTop: 10 }}>Issued digitally by Dr. {a.doctor.user.name} · {a.doctor.specialty}</p>
            </div>
          )}

          {isPatient && a.status === 'completed' && !a.reviewed && (
            <form className="card noprint" onSubmit={review}>
              <h3>How was your visit?</h3>
              <div className="row">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className="x" style={{ color: n <= rv.rating ? 'var(--warn)' : '#cbd5e1' }} onClick={() => setRv({ ...rv, rating: n })} aria-label={`${n} stars`}><Icon name="star" size={30} /></button>)}</div>
              <textarea placeholder="Share your experience (optional)" value={rv.comment} onChange={(e) => setRv({ ...rv, comment: e.target.value })} />
              <button className="btn" style={{ alignSelf: 'flex-start' }}>Submit review</button>
            </form>
          )}
          {isPatient && a.reviewed && <div className="card"><p className="ok row"><Icon name="check" /> Thanks, your review has been submitted.</p></div>}
        </div>
        <div className="noprint">{user.role !== 'admin' ? <Chat appointmentId={id} disabled={a.status === 'cancelled'} /> : <div className="card muted">Admins can view appointment details but not private chats.</div>}</div>
      </div>
      {modal && <CompleteModal appointment={a} onClose={() => setModal(false)} onDone={(u) => { setA(u); setModal(false); }} />}
    </>
  );
}
