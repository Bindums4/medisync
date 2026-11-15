import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { errMsg } from '../api';
import { C } from '../config';
import s from '../styles';

const blank = { medicine: '', dosage: '', frequency: '', days: '' };

export default function CompleteSheet({ appointment, onClose, onDone }) {
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([{ ...blank }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (i, k, v) => setRows(rows.map((r, x) => (x === i ? { ...r, [k]: v } : r)));

  const submit = async () => {
    setError(''); setBusy(true);
    try { onDone((await api.put(`/appointments/${appointment._id}/complete`, { notes, prescription: rows })).data); } catch (e) { setError(errMsg(e)); setBusy(false); }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.pad, { paddingTop: 50 }]} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>Complete consultation</Text>
          <Text style={s.muted}>Patient: {appointment.patient.name}</Text>
          <Text style={s.label}>Doctor's notes</Text>
          <TextInput style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]} multiline placeholder="Diagnosis, advice, follow-up…" value={notes} onChangeText={setNotes} />
          <Text style={s.label}>Prescription</Text>
          {rows.map((r, i) => (
            <View key={i} style={[s.card, { gap: 8 }]}>
              <TextInput style={s.input} placeholder="Medicine" value={r.medicine} onChangeText={(v) => set(i, 'medicine', v)} />
              <View style={s.row}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Dosage" value={r.dosage} onChangeText={(v) => set(i, 'dosage', v)} />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Frequency" value={r.frequency} onChangeText={(v) => set(i, 'frequency', v)} />
                <TextInput style={[s.input, { width: 64 }]} placeholder="Days" keyboardType="number-pad" value={r.days} onChangeText={(v) => set(i, 'days', v)} />
              </View>
              {rows.length > 1 && <TouchableOpacity onPress={() => setRows(rows.filter((_, x) => x !== i))}><Text style={{ color: C.danger }}>Remove</Text></TouchableOpacity>}
            </View>
          ))}
          <TouchableOpacity style={s.ghost} onPress={() => setRows([...rows, { ...blank }])}><Text>+ Add medicine</Text></TouchableOpacity>
          {!!error && <Text style={s.error}>{error}</Text>}
          <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}><Text style={s.btnText}>{busy ? 'Saving…' : 'Complete and send'}</Text></TouchableOpacity>
          <TouchableOpacity style={s.ghost} onPress={onClose}><Text>Cancel</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
