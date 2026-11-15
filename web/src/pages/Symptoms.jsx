import { useState } from 'react';
import api, { errMsg } from '../api';
import DoctorCard from '../components/DoctorCard';
import Icon from '../components/Icon';

const QUICK = ['Fever and body ache', 'Headache and dizziness', 'Skin rash and itching', 'Knee pain when walking', 'Cough and sore throat', 'Feeling anxious and unable to sleep'];

export default function Symptoms({ inApp }) {
  const [text, setText] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (e) => {
    e.preventDefault(); setError(''); setBusy(true); setRes(null);
    try { setRes((await api.post('/ai/symptoms', { symptoms: text, age, gender })).data); } catch (err) { setError(errMsg(err)); }
    setBusy(false);
  };

  const body = (
    <>
      <div className="pagetitle"><h1 className="row"><Icon name="sparkle" size={28} /> AI symptom checker</h1><p>Describe how you feel. We suggest the right specialist and how urgent it is. This is guidance, not a diagnosis.</p></div>
      <div className="two">
        <form className="card" onSubmit={run}>
          <label>What are you experiencing?</label>
          <textarea style={{ minHeight: 130 }} placeholder="e.g. I have had a fever and sore throat for two days with body ache…" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row wrap">{QUICK.map((q) => <button type="button" key={q} className="chip" onClick={() => setText(q)}>{q}</button>)}</div>
          <div className="row"><input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} /><select value={gender} onChange={(e) => setGender(e.target.value)}><option value="">Gender</option><option>Female</option><option>Male</option><option>Other</option></select></div>
          {error && <p className="error">{error}</p>}
          <button className="btn lg" disabled={busy}>{busy ? 'Analysing…' : 'Check my symptoms'}</button>
        </form>
        <div className="col">
          {!res && <div className="card empty"><Icon name="sparkle" size={36} /><p>Your result will appear here.</p></div>}
          {res && (
            <>
              <div className={`urgency ${res.urgency}`}>{res.urgency === 'high' ? 'Urgent: seek care now' : res.urgency === 'medium' ? 'See a doctor soon' : 'Low urgency: self-care and monitor'}</div>
              <div className="card">
                <h3>Suggested specialist</h3><span className="chip teal" style={{ alignSelf: 'flex-start' }}>{res.specialty}</span>
                <h3 style={{ marginTop: 6 }}>Possible causes</h3>
                <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>{res.causes.map((c) => <li key={c}>{c}</li>)}</ul>
                <h3 style={{ marginTop: 6 }}>Advice</h3><p className="muted">{res.advice}</p>
                <p className="small muted">{res.ai ? 'Generated with Claude.' : 'Rule-based guidance.'} {res.disclaimer}</p>
              </div>
            </>
          )}
        </div>
      </div>
      {res && res.doctors.length > 0 && (<><h2 className="mt mb">Recommended doctors</h2><div className="grid g3">{res.doctors.map((d) => <DoctorCard key={d._id} d={d} />)}</div></>)}
    </>
  );
  return inApp ? body : <div className="container" style={{ paddingTop: 36 }}>{body}</div>;
}
