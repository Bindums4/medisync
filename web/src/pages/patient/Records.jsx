import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../../api';
import Icon from '../../components/Icon';

const TYPES = {
  bp: { label: 'Blood pressure', unit: 'mmHg', hint: 'Normal: below 120/80' },
  sugar: { label: 'Blood sugar', unit: 'mg/dL', hint: 'Fasting normal: 70 to 100' },
  weight: { label: 'Weight', unit: 'kg', hint: 'Track weekly for best trends' },
  heart: { label: 'Heart rate', unit: 'bpm', hint: 'Resting normal: 60 to 100' },
  temp: { label: 'Temperature', unit: '°F', hint: 'Normal: about 98.6' },
};

export default function Records() {
  const [type, setType] = useState('bp');
  const [data, setData] = useState([]);
  const [f, setF] = useState({ value: '', value2: '', note: '' });
  const [error, setError] = useState('');
  const load = () => api.get('/vitals', { params: { type } }).then((r) => setData(r.data));
  useEffect(() => { load(); setF({ value: '', value2: '', note: '' }); }, [type]);

  const add = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/vitals', { type, ...f }); setF({ value: '', value2: '', note: '' }); load(); } catch (err) { setError(errMsg(err)); }
  };
  const del = async (id) => { await api.delete(`/vitals/${id}`); load(); };

  const chart = data.slice(-30).map((v) => ({ day: new Date(v.measuredAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }), [type === 'bp' ? 'Systolic' : TYPES[type].label]: v.value, ...(type === 'bp' ? { Diastolic: v.value2 } : {}) }));
  const vals = data.map((v) => v.value);
  const avg = vals.length ? (vals.reduce((s, x) => s + x, 0) / vals.length).toFixed(1) : '--';
  const last = data[data.length - 1];

  return (
    <>
      <div className="pagetitle"><h1>Health records</h1><p>Log your vitals and watch the trends. Share the charts with your doctor.</p></div>
      <div className="tabs">{Object.entries(TYPES).map(([k, v]) => <button key={k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>{v.label}</button>)}</div>
      <div className="grid g4 mb">
        <div className="card"><div className="muted small">Latest</div><div className="big"><b>{last ? (type === 'bp' ? `${last.value}/${last.value2}` : last.value) : '--'}</b> <span className="muted small">{TYPES[type].unit}</span></div></div>
        <div className="card"><div className="muted small">Average ({type === 'bp' ? 'systolic' : 'all'})</div><div className="big"><b>{avg}</b></div></div>
        <div className="card"><div className="muted small">Min / Max</div><div className="big"><b>{vals.length ? `${Math.min(...vals)} / ${Math.max(...vals)}` : '--'}</b></div></div>
        <div className="card"><div className="muted small">Guide</div><b className="small">{TYPES[type].hint}</b></div>
      </div>
      <div className="two">
        <div className="card">
          <h3>{TYPES[type].label} trend</h3>
          {chart.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" fontSize={12} /><YAxis domain={['dataMin - 5', 'dataMax + 5']} fontSize={12} /><Tooltip /><Legend />
                {type === 'bp' ? (<><Line type="monotone" dataKey="Systolic" stroke="#0d9488" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="Diastolic" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} /></>) : <Line type="monotone" dataKey={TYPES[type].label} stroke="#0d9488" strokeWidth={3} dot={{ r: 3 }} />}
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty">No readings yet. Add your first one.</div>}
        </div>
        <div className="col">
          <form className="card" onSubmit={add}>
            <h3>Add reading</h3>
            <div className="row"><input type="number" step="any" placeholder={type === 'bp' ? 'Systolic' : `Value (${TYPES[type].unit})`} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} required />{type === 'bp' && <input type="number" placeholder="Diastolic" value={f.value2} onChange={(e) => setF({ ...f, value2: e.target.value })} required />}</div>
            <input placeholder="Note (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            {error && <p className="error">{error}</p>}
            <button className="btn"><Icon name="plus" size={18} /> Save reading</button>
          </form>
          <div className="card" style={{ maxHeight: 280, overflow: 'auto' }}>
            <h3>History</h3>
            {[...data].reverse().slice(0, 15).map((v) => (<div key={v._id} className="row between small"><span>{new Date(v.measuredAt).toLocaleDateString()}</span><b>{type === 'bp' ? `${v.value}/${v.value2}` : v.value} {v.unit}</b><button className="x" onClick={() => del(v._id)} aria-label="Delete"><Icon name="trash" size={16} /></button></div>))}
          </div>
        </div>
      </div>
    </>
  );
}
