import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { getSocket } from '../socket';
import { C, money, prettyTime } from '../config';
import CompleteSheet from '../components/CompleteSheet';
import StatusPill from '../components/StatusPill';
import s from '../styles';

export default function DoctorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => { setBusy(true); try { setD((await api.get('/doctors/me/stats')).data); } catch {} setBusy(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const sock = getSocket();
    sock?.on('appointment:new', load); sock?.on('appointment:updated', load);
    return () => { sock?.off('appointment:new', load); sock?.off('appointment:updated', load); };
  }, [load]);

  const confirmAppt = async (id) => { try { await api.put(`/appointments/${id}/status`, { status: 'confirmed' }); load(); } catch (e) { Alert.alert('Error', errMsg(e)); } };
  if (!d) return <View style={s.screen}><Text style={{ padding: 20 }}>Loading…</Text></View>;
  const t = d.totals;
  const max = Math.max(1, ...d.trend.map((x) => x.count));
  const Stat = ({ label, value, color }) => <View style={[s.card, { width: '48%', padding: 12 }]}><Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text><Text style={s.muted}>{label}</Text></View>;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
      <View><Text style={s.muted}>Good day</Text><Text style={s.h1}>Dr. {user.name}</Text></View>
      {!d.approved && <View style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 12 }}><Text style={{ color: '#92400e', fontWeight: '600' }}>Your profile is awaiting admin approval.</Text></View>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat label="Awaiting confirmation" value={t.pending} color={C.warn} /><Stat label="Confirmed upcoming" value={t.upcoming} color={C.brand} />
        <Stat label="Patients treated" value={t.patients} color={C.accent} /><Stat label="Earnings" value={money(t.earnings)} color={C.text} />
      </View>
      <View style={s.card}>
        <Text style={s.title}>Today's schedule</Text>
        {d.today.map((a) => (
          <View key={a._id} style={{ gap: 8, paddingVertical: 6 }}>
            <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Appointment', { id: a._id })}>
              <View style={{ width: 62, alignItems: 'center', backgroundColor: C.soft, borderRadius: 12, paddingVertical: 6 }}><Text style={{ fontWeight: '800', color: C.brandDark }}>{prettyTime(a.time)}</Text></View>
              <View style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>{a.patient.name}</Text><Text style={s.muted} numberOfLines={1}>{a.reason}</Text></View><StatusPill status={a.status} />
            </TouchableOpacity>
            {a.status === 'pending' && <TouchableOpacity style={[s.btn, { backgroundColor: C.ok, paddingVertical: 9 }]} onPress={() => confirmAppt(a._id)}><Text style={s.btnText}>Confirm</Text></TouchableOpacity>}
            {a.status === 'confirmed' && <TouchableOpacity style={[s.btn, { paddingVertical: 9 }]} onPress={() => setModal(a)}><Text style={s.btnText}>Complete and prescribe</Text></TouchableOpacity>}
          </View>
        ))}
        {!d.today.length && <Text style={s.muted}>No appointments today.</Text>}
      </View>
      <View style={s.card}>
        <Text style={s.title}>Last 7 days</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8 }}>
          {d.trend.map((x) => <View key={x.day} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 100 }}><View style={{ width: '100%', height: 6 + (x.count / max) * 66, backgroundColor: C.brand, borderRadius: 6 }} /><Text style={s.muted}>{x.day}</Text></View>)}
        </View>
      </View>
      {modal && <CompleteSheet appointment={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </ScrollView>
  );
}
