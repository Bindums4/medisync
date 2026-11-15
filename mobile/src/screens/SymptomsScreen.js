import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { errMsg } from '../api';
import DoctorCard from '../components/DoctorCard';
import { C } from '../config';
import s from '../styles';

const QUICK = ['Fever and body ache', 'Headache and dizziness', 'Skin rash and itching', 'Knee pain when walking', 'Feeling anxious, cannot sleep'];
const URG = { low: ['#d1fae5', '#065f46', 'Low urgency: self-care and monitor'], medium: ['#fef3c7', '#92400e', 'See a doctor soon'], high: ['#fee2e2', '#991b1b', 'Urgent: seek care now'] };

export default function SymptomsScreen() {
  const [text, setText] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => { setError(''); setBusy(true); setRes(null); try { setRes((await api.post('/ai/symptoms', { symptoms: text })).data); } catch (e) { setError(errMsg(e)); } setBusy(false); };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.h1}>AI symptom checker</Text>
      <Text style={s.muted}>Describe how you feel. This is guidance, not a diagnosis.</Text>
      <TextInput style={[s.input, { minHeight: 110, textAlignVertical: 'top' }]} multiline placeholder="e.g. Fever and sore throat for two days…" value={text} onChangeText={setText} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{QUICK.map((q) => <TouchableOpacity key={q} style={s.chip} onPress={() => setText(q)}><Text>{q}</Text></TouchableOpacity>)}</ScrollView>
      {!!error && <Text style={s.error}>{error}</Text>}
      <TouchableOpacity style={s.btn} onPress={run} disabled={busy}><Text style={s.btnText}>{busy ? 'Analysing…' : 'Check my symptoms'}</Text></TouchableOpacity>
      {res && (<>
        <View style={{ backgroundColor: URG[res.urgency][0], padding: 14, borderRadius: 14 }}><Text style={{ color: URG[res.urgency][1], fontWeight: '700' }}>{URG[res.urgency][2]}</Text></View>
        <View style={s.card}>
          <Text style={s.title}>Suggested specialist</Text><Text style={{ color: C.brandDark, fontWeight: '700' }}>{res.specialty}</Text>
          <Text style={s.title}>Possible causes</Text>{res.causes.map((c) => <Text key={c} style={{ color: C.muted }}>• {c}</Text>)}
          <Text style={s.title}>Advice</Text><Text style={{ color: C.muted }}>{res.advice}</Text>
          <Text style={s.muted}>{res.disclaimer}</Text>
        </View>
        <Text style={s.title}>Recommended doctors</Text>
        {res.doctors.map((d) => <DoctorCard key={d._id} d={d} />)}
      </>)}
    </ScrollView>
  );
}
