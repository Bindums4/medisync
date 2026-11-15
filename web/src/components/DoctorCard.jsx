import { Link } from 'react-router-dom';
import { money } from '../api';
import Avatar from './Avatar';
import Icon from './Icon';
import Stars from './Stars';

export default function DoctorCard({ d }) {
  const name = `Dr. ${d.user.name}`;
  return (
    <div className="card doc-card">
      <div className="row gap">
        <Avatar name={name} size={60} />
        <div>
          <h3>{name}</h3>
          <span className="chip teal">{d.specialty}</span>
        </div>
      </div>
      <div className="row between small muted">
        <Stars value={d.rating} count={d.numReviews} />
        <span>{d.experience} yrs exp.</span>
      </div>
      <div className="small muted row"><Icon name="pin" size={14} /> {d.clinic || d.city}{d.clinic && d.city ? `, ${d.city}` : ''}</div>
      <div className="row between">
        <div><div className="muted small">Consultation</div><b className="big">{money(d.fee)}</b></div>
        <Link to={`/doctors/${d._id}`} className="btn">Book visit</Link>
      </div>
    </div>
  );
}
