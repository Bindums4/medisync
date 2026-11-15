import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import DoctorCard from '../components/DoctorCard';

export default function Doctors() {
  const [params, setParams] = useSearchParams();
  const [docs, setDocs] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const q = params.get('q') || '', specialty = params.get('specialty') || '', city = params.get('city') || '', sort = params.get('sort') || 'rating';
  const set = (k, v) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n); };

  useEffect(() => { api.get('/doctors/specialties').then((r) => setSpecs(r.data)); }, []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => api.get('/doctors', { params: { q, specialty, city, sort } }).then((r) => setDocs(r.data)).finally(() => setLoading(false)), 200);
    return () => clearTimeout(t);
  }, [q, specialty, city, sort]);

  return (
    <>
      <div className="pagehead"><div className="container"><h1>Find a doctor</h1><p className="muted">Verified specialists, transparent fees and real reviews.</p></div></div>
      <div className="container">
        <div className="filterbar">
          <input placeholder="Search name, clinic, city" value={q} onChange={(e) => set('q', e.target.value)} />
          <input placeholder="City" style={{ maxWidth: 160 }} value={city} onChange={(e) => set('city', e.target.value)} />
          <select value={sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="rating">Top rated</option><option value="experience">Most experienced</option><option value="fee_asc">Fee: low to high</option><option value="fee_desc">Fee: high to low</option>
          </select>
        </div>
        <div className="row wrap" style={{ marginBottom: 18 }}>
          <button className={`chip ${!specialty ? 'on' : ''}`} onClick={() => set('specialty', '')}>All</button>
          {specs.map((s) => <button key={s.name} className={`chip ${specialty === s.name ? 'on' : ''}`} onClick={() => set('specialty', s.name)}>{s.name} · {s.count}</button>)}
        </div>
        <p className="muted small" style={{ marginBottom: 12 }}>{loading ? 'Searching…' : `${docs.length} doctor${docs.length === 1 ? '' : 's'} found`}</p>
        <div className="grid g3">{docs.map((d) => <DoctorCard key={d._id} d={d} />)}</div>
        {!loading && !docs.length && <div className="empty card">No doctors match your filters. Try clearing some.</div>}
      </div>
    </>
  );
}
