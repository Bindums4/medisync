import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { C, prettyDate, prettyTime, today } from '../config';
import StatusPill from '../components/StatusPill';
import Avatar from '../components/Avatar';
import s from '../styles';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [appts, setAppts] = useState([]);
  const [rem, setRem] = useState([]);
  const [bp, setBp] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setAppts((await api.get('/appointments/mine')).data);
      setRem((await api.get('/reminders')).data);
      setBp((await api.get('/vitals', { params: { type: 'bp' } })).data);
    } catch {}
    setBusy(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const t = today();
  const upcoming = appts.filter((a) => ['pending', 'confirmed'].includes(a.status) && a.date >= t).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcoming[0];
  const active = rem.filter((r) => r.startDate <= t && r.endDate >= t);
  const slots = active.flatMap((r) => r.times.map((time) => ({ r, time, done: r.taken.includes(`${t}|${time}`) }))).sort((a, b) => a.time.localeCompare(b.time));
  const toggle = async (r, time) => { const { data } = await api.put(`/reminders/${r._id}/take`, { date: t, time }); setRem(rem.map((x) => (x._id === r._id ? data : x))); };
  const last = bp[bp.length - 1];

  const Stat = ({ label, value, color }) => <View style={[s.card, { flex: 1, padding: 12 }]}><Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text><Text style={s.muted}>{label}</Text></View>;
  const Action = ({ label, icon, to }) => <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', padding: 14 }]} onPress={() => navigation.navigate(to)}><Text style={{ fontSize: 24 }}>{icon}</Text><Text style={{ fontWeight: '600', fontSize: 12 }}>{label}</Text></TouchableOpacity>;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
      <View><Text style={s.muted}>Welcome back</Text><Text style={s.h1}>{user.name.split(' ')[0]}</Text></View>
      <View style={s.row}><Stat label="Upcoming" value={upcoming.length} color={C.brand} /><Stat label="Medicines" value={active.length} color={C.accent} /><Stat label="Latest BP" value={last ? `${last.value}/${last.value2}` : '--'} color={C.text} /></View>
      <View style={s.row}><Action label="Find doctor" icon="🔎" to="Doctors" /><Action label="Symptoms" icon="✨" to="Symptoms" /><Action label="Health" icon="📈" to="Health" /></View>

      <View style={s.card}>
        <Text style={s.title}>Next appointment</Text>
        {next ? (
          <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Appointment', { id: next._id })}>
            <Avatar name={`Dr. ${next.doctor.user.name}`} size={50} />
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>Dr. {next.doctor.user.name}</Text><Text style={s.muted}>{next.doctor.specialty} · {prettyDate(next.date)}, {prettyTime(next.time)}</Text></View>
            <StatusPill status={next.status} />
          </TouchableOpacity>
        ) : <Text style={s.muted}>No upcoming visits. Tap "Find doctor" to book one.</Text>}
      </View>

      <View style={s.card}>
        <View style={s.between}><Text style={s.title}>Today's medicines</Text><TouchableOpacity onPress={() => navigation.navigate('Health')}><Text style={{ color: C.brand, fontWeight: '600' }}>Manage</Text></TouchableOpacity></View>
        {slots.map(({ r, time, done }) => (
          <TouchableOpacity key={r._id + time} style={[s.row, { padding: 10, borderRadius: 12, backgroundColor: done ? '#f0fdfa' : '#f8fafc' }]} onPress={() => toggle(r, time)}>
            <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: done ? C.brand : '#cbd5e1', backgroundColor: done ? C.brand : '#fff', alignItems: 'center', justifyContent: 'center' }}>{done && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}</View>
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '600', textDecorationLine: done ? 'line-through' : 'none' }}>{r.medicine}</Text><Text style={s.muted}>{r.dosage} · {prettyTime(time)}</Text></View>
          </TouchableOpacity>
        ))}
        {!slots.length && <Text style={s.muted}>Nothing scheduled today.</Text>}
      </View>
    </ScrollView>
  );
}
