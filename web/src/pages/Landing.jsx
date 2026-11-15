import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { SPECIALTIES } from '../api';
import DoctorCard from '../components/DoctorCard';
import Icon from '../components/Icon';

const SPEC_ICON = { Cardiology: ['heart', ''], Dermatology: ['sparkle', 'p'], Pediatrics: ['users', 'o'], Orthopedics: ['activity', 'i'], Neurology: ['sparkle', 'i'], Dentistry: ['shield', ''], 'General Physician': ['user', 'o'], Psychiatry: ['chat', 'p'] };
const QUOTES = [
  ['Booked a cardiologist in under a minute and chatted with her before the visit. Brilliant.', 'Riya S.', 'Bengaluru'],
  ['My medicine reminders and health charts in one place. My dad finally tracks his BP.', 'Amit K.', 'Hyderabad'],
  ['The symptom checker told me which specialist to see. Saved me a lot of guesswork.', 'Neha S.', 'Pune'],
];

export default function Landing() {
  const nav = useNavigate();
  const [top, setTop] = useState([]);
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('');
  useEffect(() => { api.get('/doctors', { params: { sort: 'rating' } }).then((r) => setTop(r.data.slice(0, 4))).catch(() => {}); }, []);

  const search = (e) => { e.preventDefault(); nav(`/doctors?q=${encodeURIComponent(q)}&specialty=${encodeURIComponent(spec)}`); };

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <span className="chip teal"><Icon name="sparkle" size={14} /> AI-powered care, 24/7</span>
            <h1 style={{ marginTop: 14 }}>Healthcare,<br /><span>simplified.</span></h1>
            <p className="lead">Find trusted doctors, book in seconds, chat during your consultation, get digital prescriptions and keep your health on track, all in one app.</p>
            <form className="searchbox" onSubmit={search}>
              <input placeholder="Doctor, clinic or city" value={q} onChange={(e) => setQ(e.target.value)} />
              <select value={spec} onChange={(e) => setSpec(e.target.value)}><option value="">All specialties</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select>
              <button className="btn"><Icon name="search" size={18} /> Search</button>
            </form>
          </div>
          <div className="heroart">
            <div className="bigcircle" />
            <div className="floatcard a"><div className="icobox"><Icon name="calendar" /></div><div><b>Appointment confirmed</b><div className="muted small">Today, 10:30 AM</div></div></div>
            <div className="floatcard b"><div className="icobox i"><Icon name="activity" /></div><div><b>BP 122/80</b><div className="muted small">Healthy range</div></div></div>
            <div className="floatcard c"><div className="icobox p"><Icon name="pill" /></div><div><b>Take Vitamin D3</b><div className="muted small">Reminder · 9:00 PM</div></div></div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="statband">
          {[['500+', 'Verified doctors'], ['50k+', 'Happy patients'], ['4.8', 'Average rating'], ['24/7', 'Chat support']].map(([n, l]) => <div key={l} className="card"><b>{n}</b><span className="muted small">{l}</span></div>)}
        </div>

        <section className="section">
          <h2>Browse by specialty</h2><p className="sub">Pick the care you need and see available doctors instantly.</p>
          <div className="grid g4">
            {SPECIALTIES.map((s) => (
              <Link key={s} to={`/doctors?specialty=${encodeURIComponent(s)}`} className="card spec"><div className={`icobox ${SPEC_ICON[s][1]}`}><Icon name={SPEC_ICON[s][0]} /></div><b>{s}</b></Link>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>How MediSync works</h2><p className="sub">Three simple steps from symptom to treatment.</p>
          <div className="grid g3 steps">
            {[['Find your doctor', 'Search by specialty, rating, fee or city and read real patient reviews.'], ['Book a slot', 'Choose a day and time that suits you. Doctors confirm quickly and you are notified instantly.'], ['Consult and recover', 'Chat with your doctor, receive a digital prescription and track medicines and vitals.']].map(([t, d]) => (
              <div key={t} className="card step"><h3>{t}</h3><p className="muted">{d}</p></div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="row between wrap"><div><h2>Top rated doctors</h2><p className="sub">Loved by patients across India.</p></div><Link to="/doctors" className="btn ghost">View all</Link></div>
          <div className="grid g4">{top.map((d) => <DoctorCard key={d._id} d={d} />)}</div>
        </section>

        <section className="section">
          <div className="aibanner">
            <div style={{ maxWidth: 560 }}><h2 style={{ color: '#fff' }}>Not sure which doctor to see?</h2><p style={{ color: '#d1fae5', marginTop: 8 }}>Describe how you feel and our AI symptom checker suggests the right specialist and how urgent it is, in seconds.</p></div>
            <Link to="/symptoms" className="btn lg"><Icon name="sparkle" /> Try the symptom checker</Link>
          </div>
        </section>

        <section className="section">
          <h2>What patients say</h2><p className="sub">Real stories from the MediSync community.</p>
          <div className="grid g3">{QUOTES.map(([t, n, c]) => <div key={n} className="card quote"><span className="stars"><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /></span><p>“{t}”</p><p className="who">{n} <span className="muted small">· {c}</span></p></div>)}</div>
        </section>
      </div>
    </>
  );
}
