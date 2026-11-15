import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { SPECIALTIES, errMsg } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';

export default function Auth({ mode }) {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const isLogin = mode === 'login';
  const [role, setRole] = useState('patient');
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', specialty: SPECIALTIES[0], fee: '', experience: '', city: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (user) return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await (isLogin ? login(f) : register({ ...f, role })); nav('/app'); } catch (err) { setError(errMsg(err)); setBusy(false); }
  };
  const demo = (email, password) => setF({ ...f, email, password });

  return (
    <div className="authwrap">
      <form className="card auth" onSubmit={submit}>
        <div className="center"><div className="logomark" style={{ margin: '0 auto 10px', width: 48, height: 48 }}><Icon name="heart" size={24} /></div><h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2><p className="muted small">{isLogin ? 'Log in to manage your care.' : 'Join MediSync in under a minute.'}</p></div>
        {!isLogin && <div className="seg"><button type="button" className={role === 'patient' ? 'on' : ''} onClick={() => setRole('patient')}>I'm a patient</button><button type="button" className={role === 'doctor' ? 'on' : ''} onClick={() => setRole('doctor')}>I'm a doctor</button></div>}
        {!isLogin && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input type="password" placeholder="Password (min 6 characters)" value={f.password} onChange={set('password')} required />
        {!isLogin && <input placeholder="Phone" value={f.phone} onChange={set('phone')} />}
        {!isLogin && role === 'doctor' && (
          <>
            <select value={f.specialty} onChange={set('specialty')}>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select>
            <div className="row"><input type="number" placeholder="Fee (₹)" value={f.fee} onChange={set('fee')} required /><input type="number" placeholder="Experience (yrs)" value={f.experience} onChange={set('experience')} /></div>
            <input placeholder="City" value={f.city} onChange={set('city')} />
            <p className="muted small">Doctor profiles are reviewed by our team before going live.</p>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn lg" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
        <p className="center small muted">{isLogin ? <>New to MediSync? <Link to="/register" className="link">Sign up</Link></> : <>Already registered? <Link to="/login" className="link">Log in</Link></>}</p>
        {isLogin && (
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button type="button" className="chip" onClick={() => demo('patient@medisync.dev', 'Patient@123')}>Demo patient</button>
            <button type="button" className="chip" onClick={() => demo('ananya@medisync.dev', 'Doctor@123')}>Demo doctor</button>
            <button type="button" className="chip" onClick={() => demo('admin@medisync.dev', 'Admin@123')}>Demo admin</button>
          </div>
        )}
      </form>
    </div>
  );
}
