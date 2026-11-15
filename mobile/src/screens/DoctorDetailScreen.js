import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { errMsg } from '../api';
import Avatar from '../components/Avatar';
import { C, money, prettyTime, ymd } from '../config';
import s from '../styles';

export default function DoctorDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return { key: ymd(d), wd: d.toLocaleDateString('en', { weekday: 'short' }), day: d.getDate(), dow: d.getDay() }; }), []);
  useEffect(() => { api.get(`/doctors/${id}`).then((r) => setData(r.data)).catch(() => navigation.goBack()); }, [id]);
  const works = (dow) => data?.doctor.availability.some((a) => a.day === dow && a.enabled);
  useEffect(() => { if (data && !date) { const f = days.find((d) => works(d.dow)); if (f) setDate(f.key); } }, [data]);
  const loadSlots = () => api.get(`/doctors/${id}/slots`, { params: { date } }).then((r) => setSlots(r.data.slots)).catch(() => {});
  useEffect(() => { if (date) { setTime(''); loadSlots(); } }, [date]);

  if (!data) return <View style={s.screen}><Text style={{ padding: 20 }}>Loading…</Text></View>;
  const { doctor: d, reviews } = data;
  const book = async () => {
    setError(''); setBusy(true);
    try { const { data: a } = await api.post('/appointments', { doctor: d._id, date, time, reason }); navigation.replace('Appointment', { id: a._id }); }
    catch (e) { setError(errMsg(e)); setBusy(false); loadSlots(); }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View style={[s.card, { alignItems: 'center' }]}>
        <Avatar name={`Dr. ${d.user.name}`} size={84} />
        <Text style={s.h1}>Dr. {d.user.name}</Text>
        <Text style={{ color: C.brandDark, fontWeight: '700' }}>{d.specialty}</Text>
        <Text style={s.muted}>{d.qualifications}</Text>
        <View style={[s.row, { marginTop: 6 }]}>
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={{ fontWeight: '800' }}>★ {d.rating ? d.rating.toFixed(1) : 'New'}</Text><Text style={s.muted}>{d.numReviews} reviews</Text></View>
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={{ fontWeight: '800' }}>{d.experience} yrs</Text><Text style={s.muted}>Experience</Text></View>
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={{ fontWeight: '800' }}>{money(d.fee)}</Text><Text style={s.muted}>Fee</Text></View>
        </View>
      </View>
      {!!d.bio && <View style={s.card}><Text style={s.title}>About</Text><Text style={{ color: C.muted }}>{d.bio}</Text><Text style={s.muted}>{[d.clinic, d.city].filter(Boolean).join(', ')}</Text></View>}

      <View style={s.card}>
        <Text style={s.title}>Book an appointment</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((x) => { const on = date === x.key, off = !works(x.dow); return (
            <TouchableOpacity key={x.key} disabled={off} onPress={() => setDate(x.key)} style={{ width: 56, paddingVertical: 10, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: on ? C.brand : C.line, backgroundColor: on ? C.brand : '#fff', opacity: off ? 0.35 : 1 }}>
              <Text style={{ color: on ? '#fff' : C.muted, fontSize: 12 }}>{x.wd}</Text><Text style={{ color: on ? '#fff' : C.text, fontWeight: '800', fontSize: 18 }}>{x.day}</Text>
            </TouchableOpacity>); })}
        </ScrollView>
        <Text style={s.label}>Available times</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {slots.map((sl) => { const on = time === sl.time; return (
            <TouchableOpacity key={sl.time} disabled={!sl.available} onPress={() => setTime(sl.time)} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: on ? C.brand : C.line, backgroundColor: on ? C.brand : sl.available ? '#fff' : '#f1f5f9' }}>
              <Text style={{ color: on ? '#fff' : sl.available ? C.text : '#b6c0cc', fontWeight: '600', textDecorationLine: sl.available ? 'none' : 'line-through' }}>{prettyTime(sl.time)}</Text>
            </TouchableOpacity>); })}
          {!slots.length && <Text style={s.muted}>No slots on this day.</Text>}
        </View>
        <TextInput style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]} multiline placeholder="Reason for visit" value={reason} onChangeText={setReason} />
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={[s.btn, (!time || busy) && { opacity: 0.5 }]} disabled={!time || busy} onPress={book}><Text style={s.btnText}>{busy ? 'Booking…' : `Confirm booking · ${money(d.fee)}`}</Text></TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.title}>Reviews ({reviews.length})</Text>
        {reviews.map((r) => <View key={r._id} style={{ gap: 2 }}><View style={s.between}><Text style={{ fontWeight: '600' }}>{r.patient?.name}</Text><Text style={{ color: C.warn }}>{'★'.repeat(r.rating)}</Text></View><Text style={{ color: C.muted }}>{r.comment}</Text></View>)}
        {!reviews.length && <Text style={s.muted}>No reviews yet.</Text>}
      </View>
    </ScrollView>
  );
}
