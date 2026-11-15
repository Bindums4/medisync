import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Icon from './Icon';

export function Logo({ light }) {
  return <Link to="/" className={`logo ${light ? 'light' : ''}`}><span className="logomark"><Icon name="heart" size={18} /></span>Medi<b>Sync</b></Link>;
}

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <>
      <header className="pubnav">
        <div className="container row between">
          <Logo />
          <nav className="row gap links">
            <NavLink to="/doctors">Find doctors</NavLink>
            <NavLink to="/symptoms">Symptom checker</NavLink>
            {user ? <Link to="/app" className="btn sm">Open dashboard</Link> : (<><Link to="/login" className="btn ghost sm">Log in</Link><Link to="/register" className="btn sm">Get started</Link></>)}
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="footer">
        <div className="container row between wrap gap">
          <div><Logo light /><p className="muted small">Quality healthcare, one tap away.</p></div>
          <p className="muted small">MediSync · MERN + React Native · This app gives general guidance and is not a substitute for emergency care.</p>
        </div>
      </footer>
    </>
  );
}
