import { useState } from 'react';
import api, { SPECIALTIES, errMsg } from '../api';
import { useAuth } from '../AuthContext';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { user, refresh } = useAuth();
  const isDoc = user.role === 'doctor';
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', gender: user.gender || '', dob: user.dob || '', bloodGroup: user.bloodGroup || '' });
  const [d, setD] = useState(isDoc ? { specialty: user.doctor.specialty, experience: user.doctor.experience, fee: user.doctor.fee, qualifications: user.doctor.qualifications, clinic: user.doctor.clinic, city: user.doctor.city, bio: user.doctor.bio } : null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setDoc = (k) => (e) => setD({ ...d, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try { await api.put('/auth/me', f); if (isDoc) await api.put('/doctors/me/profile', d); await refresh(); setMsg('Profile saved'); setTimeout(() => setMsg(''), 2500); } catch (err) { setError(errMsg(err)); }
  };

  return (
    <>
      <div className="pagetitle"><h1>My profile</h1><p>{user.email} · {user.role}</p></div>
      <form className="card" onSubmit={save} style={{ maxWidth: 760 }}>
        <div className="row gap"><Avatar name={user.name} size={64} /><div><h3>{user.name}</h3>{isDoc && <span className={`st ${user.doctor.approved ? 'completed' : 'pending'}`}>{user.doctor.approved ? 'Approved' : 'Pending approval'}</span>}</div></div>
        <div className="grid g2"><div><label>Full name</label><input value={f.name} onChange={set('name')} required /></div><div><label>Phone</label><input value={f.phone} onChange={set('phone')} /></div></div>
        {!isDoc && <div className="grid g2"><div><label>Gender</label><select value={f.gender} onChange={set('gender')}><option value="">Select</option><option>female</option><option>male</option><option>other</option></select></div><div><label>Date of birth</label><input type="date" value={f.dob} onChange={set('dob')} /></div><div><label>Blood group</label><select value={f.bloodGroup} onChange={set('bloodGroup')}><option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b}>{b}</option>)}</select></div></div>}
        {isDoc && (
          <>
            <hr /><h3>Professional details</h3>
            <div className="grid g2">
              <div><label>Specialty</label><select value={d.specialty} onChange={setDoc('specialty')}>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label>Qualifications</label><input value={d.qualifications} onChange={setDoc('qualifications')} /></div>
              <div><label>Experience (years)</label><input type="number" value={d.experience} onChange={setDoc('experience')} /></div>
              <div><label>Consultation fee (₹)</label><input type="number" value={d.fee} onChange={setDoc('fee')} /></div>
              <div><label>Clinic</label><input value={d.clinic} onChange={setDoc('clinic')} /></div>
              <div><label>City</label><input value={d.city} onChange={setDoc('city')} /></div>
            </div>
            <div><label>About you</label><textarea value={d.bio} onChange={setDoc('bio')} /></div>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <div className="row"><button className="btn">Save changes</button>{msg && <span className="ok">{msg}</span>}</div>
      </form>
    </>
  );
}
