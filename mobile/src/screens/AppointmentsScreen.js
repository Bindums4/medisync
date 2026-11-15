import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { getSocket } from '../socket';
import { C, prettyDate, prettyTime, today } from '../config';
import Avatar from '../components/Avatar';
import CompleteSheet from '../components/CompleteSheet';
import StatusPill from '../components/StatusPill';
import s from '../styles';

export default function AppointmentsScreen({ navigation }) {
  const { user } = useAuth();
  const isDoc = user.role === 'doctor';
  const tabs = isDoc ? ['pending', 'confirmed', 'completed'] : ['upcoming', 'past', 'cancelled'];
  const [tab, setTab] = useState(tabs[0]);
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => { setBusy(true); try { setList((await api.get('/appointments/mine')).data); } catch {} setBusy(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const sock = getSocket(); const on = () => load();
    sock?.on('appointment:updated', on); sock?.on('appointment:new', on);
    return () => { sock?.off('appointment:updated', on); sock?.off('appointment:new', on); };
  }, [load]);

  const t = today();
  const rows = isDoc ? list.filter((a) => a.status === tab) : list.filter((a) =>
    tab === 'upcoming' ? ['pending', 'confirmed'].includes(a.status) && a.date >= t
      : tab === 'past' ? a.status === 'completed' || (['pending', 'confirmed'].includes(a.status) && a.date < t) : a.status === 'cancelled');
  const act = async (id, status) => { try { await api.put(`/appointments/${id}/status`, { status }); load(); } catch (e) { Alert.alert('Error', errMsg(e)); } };
  const ask = (id, text) => Alert.alert(text, '', [{ text: 'No' }, { text: 'Yes', style: 'destructive', onPress: () => act(id, 'cancelled') }]);

  return (
    <View style={s.screen}>
      <View style={[s.row, { padding: 12, paddingBottom: 0 }]}>
        {tabs.map((k) => <TouchableOpacity key={k} onPress={() => setTab(k)} style={[s.chip, tab === k && s.chipOn]}><Text style={{ color: tab === k ? '#fff' : C.text, fontWeight: '600', textTransform: 'capitalize' }}>{k}</Text></TouchableOpacity>)}
      </View>
      <FlatList
        contentContainerStyle={s.pad} data={rows} keyExtractor={(a) => a._id} refreshing={busy} onRefresh={load}
        ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center', padding: 30 }]}>Nothing here yet.</Text>}
        renderItem={({ item: a }) => {
          const name = isDoc ? a.patient.name : `Dr. ${a.doctor.user.name}`;
          return (
            <View style={s.card}>
              <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Appointment', { id: a._id })}>
                <Avatar name={name} size={48} />
                <View style={{ flex: 1 }}><Text style={s.title}>{name}</Text><Text style={s.muted}>{prettyDate(a.date)} · {prettyTime(a.time)}</Text>{!!a.reason && <Text style={{ fontSize: 13 }} numberOfLines={1}>{a.reason}</Text>}</View>
                <StatusPill status={a.status} />
              </TouchableOpacity>
              {isDoc && a.status === 'pending' && <View style={s.row}><TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: C.ok, paddingVertical: 10 }]} onPress={() => act(a._id, 'confirmed')}><Text style={s.btnText}>Confirm</Text></TouchableOpacity><TouchableOpacity style={[s.ghost, { flex: 1 }]} onPress={() => ask(a._id, 'Decline this appointment?')}><Text style={{ color: C.danger }}>Decline</Text></TouchableOpacity></View>}
              {isDoc && a.status === 'confirmed' && <TouchableOpacity style={[s.btn, { paddingVertical: 10 }]} onPress={() => setModal(a)}><Text style={s.btnText}>Complete and prescribe</Text></TouchableOpacity>}
              {!isDoc && ['pending', 'confirmed'].includes(a.status) && <TouchableOpacity style={s.ghost} onPress={() => ask(a._id, 'Cancel this appointment?')}><Text style={{ color: C.danger }}>Cancel appointment</Text></TouchableOpacity>}
            </View>
          );
        }}
      />
      {modal && <CompleteSheet appointment={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </View>
  );
}
