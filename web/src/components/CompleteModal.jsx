import { useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon';

const blank = { medicine: '', dosage: '', frequency: '', days: '' };

export default function CompleteModal({ appointment, onClose, onDone }) {
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([{ ...blank }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (i, k, v) => setRows(rows.map((r, x) => (x === i ? { ...r, [k]: v } : r)));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { const { data } = await api.put(`/appointments/${appointment._id}/complete`, { notes, prescription: rows }); onDone(data); }
    catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="row between"><h2>Complete consultation</h2><button type="button" className="x" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        <p className="muted">Patient: <b>{appointment.patient.name}</b> · {appointment.reason || 'General consultation'}</p>
        <label>Doctor's notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Diagnosis, advice, follow-up plan…" />
        <label>Prescription</label>
        {rows.map((r, i) => (
          <div className="rxrow" key={i}>
            <input placeholder="Medicine" value={r.medicine} onChange={(e) => set(i, 'medicine', e.target.value)} />
            <input placeholder="Dosage" value={r.dosage} onChange={(e) => set(i, 'dosage', e.target.value)} />
            <input placeholder="Frequency" value={r.frequency} onChange={(e) => set(i, 'frequency', e.target.value)} />
            <input placeholder="Days" type="number" value={r.days} onChange={(e) => set(i, 'days', e.target.value)} />
            {rows.length > 1 && <button type="button" className="x" onClick={() => setRows(rows.filter((_, x) => x !== i))} aria-label="Remove"><Icon name="trash" size={16} /></button>}
          </div>
        ))}
        <button type="button" className="btn ghost sm" onClick={() => setRows([...rows, { ...blank }])}><Icon name="plus" size={16} /> Add medicine</button>
        {error && <p className="error">{error}</p>}
        <div className="row end"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Complete and send'}</button></div>
      </form>
    </div>
  );
}
