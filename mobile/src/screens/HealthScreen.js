import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { errMsg } from '../api';
import { C, prettyTime, today } from '../config';
import s from '../styles';

const TYPES = { bp: ['Blood pressure', 'mmHg'], sugar: ['Blood sugar', 'mg/dL'], weight: ['Weight', 'kg'], heart: ['Heart rate', 'bpm'], temp: ['Temperature', '°F'] };

function Bars({ data, type }) {
  const vals = data.slice(-14);
  if (!vals.length) return <Text style={s.muted}>No readings yet.</Text>;
  const nums = vals.map((v) => v.value);
  const lo = Math.min(...nums) * 0.9, hi = Math.max(...nums) * 1.02 || 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 }}>
      {vals.map((v) => (
        <View key={v._id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 120 }}>
          <View style={{ width: '100%', height: 10 + ((v.value - lo) / (hi - lo || 1)) * 90, backgroundColor: C.brand, borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
        </View>
      ))}
    </View>
  );
}

export default function HealthScreen() {
  const [seg, setSeg] = useState('vitals');
  return (
    <View style={s.screen}>
      <View style={[s.row, { padding: 12, paddingBottom: 0 }]}>
        {[['vitals', 'Vitals'], ['meds', 'Medicines']].map(([k, l]) => <TouchableOpacity key={k} onPress={() => setSeg(k)} style={[s.chip, seg === k && s.chipOn]}><Text style={{ color: seg === k ? '#fff' : C.text, fontWeight: '600' }}>{l}</Text></TouchableOpacity>)}
      </View>
      {seg === 'vitals' ? <Vitals /> : <Meds />}
    </View>
  );
}

function Vitals() {
  const [type, setType] = useState('bp');
  const [data, setData] = useState([]);
  const [f, setF] = useState({ value: '', value2: '' });
  const [error, setError] = useState('');
  const load = useCallback(() => api.get('/vitals', { params: { type } }).then((r) => setData(r.data)).catch(() => {}), [type]);
  useEffect(() => { load(); setF({ value: '', value2: '' }); }, [type]);
  const add = async () => { setError(''); try { await api.post('/vitals', { type, ...f }); setF({ value: '', value2: '' }); load(); } catch (e) { setError(errMsg(e)); } };
  const last = data[data.length - 1];

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {Object.entries(TYPES).map(([k, [l]]) => <TouchableOpacity key={k} onPress={() => setType(k)} style={[s.chip, type === k && s.chipOn]}><Text style={{ color: type === k ? '#fff' : C.text, fontWeight: '600' }}>{l}</Text></TouchableOpacity>)}
      </ScrollView>
      <View style={s.card}>
        <Text style={s.muted}>Latest {TYPES[type][0].toLowerCase()}</Text>
        <Text style={{ fontSize: 30, fontWeight: '800', color: C.text }}>{last ? (type === 'bp' ? `${last.value}/${last.value2}` : last.value) : '--'} <Text style={s.muted}>{TYPES[type][1]}</Text></Text>
        <Bars data={data} type={type} />
        <Text style={s.muted}>Last 14 readings</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Add reading</Text>
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 1 }]} keyboardType="decimal-pad" placeholder={type === 'bp' ? 'Systolic' : TYPES[type][1]} value={f.value} onChangeText={(v) => setF({ ...f, value: v })} />
          {type === 'bp' && <TextInput style={[s.input, { flex: 1 }]} keyboardType="number-pad" placeholder="Diastolic" value={f.value2} onChangeText={(v) => setF({ ...f, value2: v })} />}
        </View>
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={s.btn} onPress={add}><Text style={s.btnText}>Save reading</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Meds() {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ medicine: '', dosage: '', times: '08:00', days: '7' });
  const [error, setError] = useState('');
  const t = today();
  const load = useCallback(() => api.get('/reminders').then((r) => setList(r.data)).catch(() => {}), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = list.filter((r) => r.startDate <= t && r.endDate >= t);
  const slots = active.flatMap((r) => r.times.map((time) => ({ r, time, done: r.taken.includes(`${t}|${time}`) }))).sort((a, b) => a.time.localeCompare(b.time));
  const toggle = async (r, time) => { const { data } = await api.put(`/reminders/${r._id}/take`, { date: t, time }); setList(list.map((x) => (x._id === r._id ? data : x))); };
  const add = async () => {
    setError('');
    try { await api.post('/reminders', { medicine: f.medicine, dosage: f.dosage, days: f.days, times: f.times.split(',').map((x) => x.trim()) }); setF({ medicine: '', dosage: '', times: '08:00', days: '7' }); load(); } catch (e) { setError(errMsg(e)); }
  };
  const del = async (id) => { await api.delete(`/reminders/${id}`); load(); };

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <View style={s.between}><Text style={s.title}>Today's schedule</Text><Text style={{ color: C.brand, fontWeight: '700' }}>{slots.filter((x) => x.done).length}/{slots.length} taken</Text></View>
        {slots.map(({ r, time, done }) => (
          <TouchableOpacity key={r._id + time} style={[s.row, { padding: 10, borderRadius: 12, backgroundColor: done ? '#f0fdfa' : '#f8fafc' }]} onPress={() => toggle(r, time)}>
            <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: done ? C.brand : '#cbd5e1', backgroundColor: done ? C.brand : '#fff', alignItems: 'center', justifyContent: 'center' }}>{done && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}</View>
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '600', textDecorationLine: done ? 'line-through' : 'none' }}>{r.medicine}</Text><Text style={s.muted}>{r.dosage} · {prettyTime(time)}</Text></View>
          </TouchableOpacity>
        ))}
        {!slots.length && <Text style={s.muted}>Nothing scheduled today.</Text>}
      </View>
      <View style={s.card}>
        <Text style={s.title}>Add a medicine</Text>
        <TextInput style={s.input} placeholder="Medicine name" value={f.medicine} onChangeText={(v) => setF({ ...f, medicine: v })} />
        <View style={s.row}><TextInput style={[s.input, { flex: 1 }]} placeholder="Dosage" value={f.dosage} onChangeText={(v) => setF({ ...f, dosage: v })} /><TextInput style={[s.input, { width: 80 }]} placeholder="Days" keyboardType="number-pad" value={f.days} onChangeText={(v) => setF({ ...f, days: v })} /></View>
        <TextInput style={s.input} placeholder="Times, e.g. 08:00, 20:00" value={f.times} onChangeText={(v) => setF({ ...f, times: v })} />
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={s.btn} onPress={add}><Text style={s.btnText}>Save reminder</Text></TouchableOpacity>
      </View>
      {list.map((r) => (
        <View key={r._id} style={[s.card, s.between]}><View style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>{r.medicine}</Text><Text style={s.muted}>{r.times.map(prettyTime).join(', ')} · until {r.endDate}</Text></View><TouchableOpacity onPress={() => del(r._id)}><Text style={{ color: C.danger }}>Delete</Text></TouchableOpacity></View>
      ))}
    </ScrollView>
  );
}
