import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { getSocket } from '../socket';
import { C, money, prettyDate, prettyTime } from '../config';
import Avatar from '../components/Avatar';
import CompleteSheet from '../components/CompleteSheet';
import StatusPill from '../components/StatusPill';
import s from '../styles';

export default function AppointmentScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const isDoc = user.role === 'doctor';
  const [a, setA] = useState(null);
  const [tab, setTab] = useState('details');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [modal, setModal] = useState(false);
  const [rv, setRv] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');
  const list = useRef(null);

  const load = () => api.get(`/appointments/${id}`).then((r) => setA(r.data)).catch(() => navigation.goBack());
  useEffect(() => {
    load();
    api.get(`/messages/${id}`).then((r) => setMessages(r.data)).catch(() => {});
    const sock = getSocket();
    const join = () => sock?.emit('appt:join', id);
    join(); sock?.on('connect', join);
    const upd = (u) => u._id === id && setA(u);
    const msg = (m) => m.appointment === id && setMessages((p) => (p.some((x) => x._id === m._id) ? p : [...p, m]));
    sock?.on('appointment:updated', upd); sock?.on('chat:message', msg);
    return () => { sock?.off('connect', join); sock?.off('appointment:updated', upd); sock?.off('chat:message', msg); };
  }, [id]);

  if (!a) return <View style={s.screen}><Text style={{ padding: 20 }}>Loading…</Text></View>;
  const other = isDoc ? a.patient.name : `Dr. ${a.doctor.user.name}`;
  const live = ['pending', 'confirmed'].includes(a.status);
  const act = async (status) => { try { setA((await api.put(`/appointments/${id}/status`, { status })).data); } catch (e) { setError(errMsg(e)); } };
  const send = () => { if (!text.trim()) return; getSocket()?.emit('chat:send', { appointment: id, text }); setText(''); };
  const review = async () => { try { await api.post(`/appointments/${id}/review`, rv); load(); } catch (e) { setError(errMsg(e)); } };

  const Tabs = (
    <View style={[s.row, { padding: 12, paddingBottom: 0 }]}>
      {[['details', 'Details'], ['chat', 'Chat']].map(([k, l]) => <TouchableOpacity key={k} onPress={() => setTab(k)} style={[s.chip, tab === k && s.chipOn]}><Text style={{ color: tab === k ? '#fff' : C.text, fontWeight: '600' }}>{l}</Text></TouchableOpacity>)}
    </View>
  );

  if (tab === 'chat') {
    return (
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {Tabs}
        <FlatList ref={list} data={messages} keyExtractor={(m) => m._id} contentContainerStyle={{ padding: 12, gap: 6 }} onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center', padding: 20 }]}>Say hello. Only you and your {isDoc ? 'patient' : 'doctor'} can see this chat.</Text>}
          renderItem={({ item }) => { const me = item.sender._id === user._id; return (
            <View style={{ alignSelf: me ? 'flex-end' : 'flex-start', backgroundColor: me ? C.brand : '#fff', padding: 10, borderRadius: 14, maxWidth: '80%' }}>
              {!me && <Text style={{ fontWeight: '700', fontSize: 12 }}>{item.sender.name}</Text>}
              <Text style={{ color: me ? '#fff' : C.text }}>{item.text}</Text>
            </View>); }} />
        {a.status === 'cancelled' ? <Text style={[s.muted, { textAlign: 'center', padding: 12 }]}>Appointment cancelled, chat is closed.</Text> : (
          <View style={[s.row, { padding: 8 }]}><TextInput style={[s.input, { flex: 1 }]} placeholder="Type a message" value={text} onChangeText={setText} onSubmitEditing={send} /><TouchableOpacity style={[s.btn, { paddingHorizontal: 18 }]} onPress={send}><Text style={s.btnText}>Send</Text></TouchableOpacity></View>
        )}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={s.screen}>
      {Tabs}
      <ScrollView contentContainerStyle={s.pad}>
        <View style={s.card}>
          <View style={s.row}><Avatar name={other} size={56} /><View style={{ flex: 1 }}><Text style={s.title}>{other}</Text><Text style={s.muted}>{isDoc ? [a.patient.gender, a.patient.bloodGroup && `Blood ${a.patient.bloodGroup}`].filter(Boolean).join(' · ') : a.doctor.specialty}</Text></View><StatusPill status={a.status} /></View>
          <View style={s.between}><Text style={s.muted}>When</Text><Text style={{ fontWeight: '600' }}>{prettyDate(a.date)}, {prettyTime(a.time)}</Text></View>
          <View style={s.between}><Text style={s.muted}>Fee</Text><Text style={{ fontWeight: '600' }}>{money(a.fee)}</Text></View>
          <View><Text style={s.muted}>Reason</Text><Text style={{ fontWeight: '600' }}>{a.reason || 'General consultation'}</Text></View>
          {!!error && <Text style={s.error}>{error}</Text>}
          {isDoc && a.status === 'pending' && <TouchableOpacity style={[s.btn, { backgroundColor: C.ok }]} onPress={() => act('confirmed')}><Text style={s.btnText}>Confirm appointment</Text></TouchableOpacity>}
          {isDoc && a.status === 'confirmed' && <TouchableOpacity style={s.btn} onPress={() => setModal(true)}><Text style={s.btnText}>Complete and prescribe</Text></TouchableOpacity>}
          {live && <TouchableOpacity style={s.ghost} onPress={() => Alert.alert('Cancel this appointment?', '', [{ text: 'No' }, { text: 'Yes', style: 'destructive', onPress: () => act('cancelled') }])}><Text style={{ color: C.danger }}>Cancel appointment</Text></TouchableOpacity>}
        </View>

        {a.status === 'completed' && (
          <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed', borderColor: '#99f6e4', backgroundColor: '#f0fdfa' }]}>
            <Text style={s.title}>Prescription and notes</Text>
            {!!a.notes && <Text><Text style={{ fontWeight: '700' }}>Notes: </Text>{a.notes}</Text>}
            {a.prescription.map((p, i) => <View key={i} style={{ paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: '#d5f5ee' }}><Text style={{ fontWeight: '700' }}>{p.medicine}</Text><Text style={s.muted}>{[p.dosage, p.frequency, p.days ? `${p.days} days` : ''].filter(Boolean).join(' · ')}</Text></View>)}
            {!a.prescription.length && <Text style={s.muted}>No medicines prescribed.</Text>}
          </View>
        )}

        {!isDoc && a.status === 'completed' && !a.reviewed && (
          <View style={s.card}>
            <Text style={s.title}>How was your visit?</Text>
            <View style={s.row}>{[1, 2, 3, 4, 5].map((n) => <TouchableOpacity key={n} onPress={() => setRv({ ...rv, rating: n })}><Text style={{ fontSize: 32, color: n <= rv.rating ? C.warn : '#e2e8f0' }}>★</Text></TouchableOpacity>)}</View>
            <TextInput style={s.input} placeholder="Share your experience (optional)" value={rv.comment} onChangeText={(t) => setRv({ ...rv, comment: t })} />
            <TouchableOpacity style={s.btn} onPress={review}><Text style={s.btnText}>Submit review</Text></TouchableOpacity>
          </View>
        )}
        {!isDoc && a.reviewed && <Text style={{ color: C.ok, fontWeight: '600', textAlign: 'center' }}>Thanks for your review ✓</Text>}
      </ScrollView>
      {modal && <CompleteSheet appointment={a} onClose={() => setModal(false)} onDone={(u) => { setA(u); setModal(false); }} />}
    </View>
  );
}
