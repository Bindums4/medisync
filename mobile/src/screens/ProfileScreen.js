import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import Avatar from '../components/Avatar';
import { C } from '../config';
import s from '../styles';

export default function ProfileScreen() {
  const { user, refresh, logout } = useAuth();
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', bloodGroup: user.bloodGroup || '', gender: user.gender || '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const save = async () => { setError(''); try { await api.put('/auth/me', f); await refresh(); setMsg('Saved ✓'); setTimeout(() => setMsg(''), 2000); } catch (e) { setError(errMsg(e)); } };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View style={[s.card, { alignItems: 'center' }]}><Avatar name={user.name} size={72} /><Text style={s.h1}>{user.name}</Text><Text style={s.muted}>{user.email} · {user.role}</Text></View>
      <View style={s.card}>
        <Text style={s.label}>Full name</Text><TextInput style={s.input} value={f.name} onChangeText={(v) => setF({ ...f, name: v })} />
        <Text style={s.label}>Phone</Text><TextInput style={s.input} keyboardType="phone-pad" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} />
        {user.role === 'patient' && (<><Text style={s.label}>Blood group</Text><TextInput style={s.input} autoCapitalize="characters" placeholder="e.g. B+" value={f.bloodGroup} onChangeText={(v) => setF({ ...f, bloodGroup: v })} /></>)}
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={s.btn} onPress={save}><Text style={s.btnText}>{msg || 'Save changes'}</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={[s.btn, { backgroundColor: C.danger }]} onPress={logout}><Text style={s.btnText}>Log out</Text></TouchableOpacity>
    </ScrollView>
  );
}
