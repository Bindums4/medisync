import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';
import { C } from '../config';
import s from '../styles';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const submit = async () => {
    setError(''); setBusy(true);
    try { await (mode === 'login' ? login(f) : register({ ...f, role: 'patient' })); } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center', gap: 12 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 30 }}>♥</Text></View>
          <Text style={{ fontSize: 34, fontWeight: '800', color: C.text }}>Medi<Text style={{ color: C.brand }}>Sync</Text></Text>
          <Text style={s.muted}>Healthcare, simplified</Text>
        </View>
        {mode === 'register' && (<>
          <TextInput style={s.input} placeholder="Full name" value={f.name} onChangeText={set('name')} />
          <TextInput style={s.input} placeholder="Phone" keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
        </>)}
        <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={set('email')} />
        <TextInput style={s.input} placeholder="Password" secureTextEntry value={f.password} onChangeText={set('password')} />
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}><Text style={s.btnText}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create patient account'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}><Text style={{ color: C.brand, textAlign: 'center', fontWeight: '600' }}>{mode === 'login' ? 'New here? Sign up' : 'Already registered? Log in'}</Text></TouchableOpacity>
        {mode === 'login' && (
          <View style={[s.row, { justifyContent: 'center' }]}>
            <TouchableOpacity style={s.chip} onPress={() => setF({ ...f, email: 'patient@medisync.dev', password: 'Patient@123' })}><Text>Demo patient</Text></TouchableOpacity>
            <TouchableOpacity style={s.chip} onPress={() => setF({ ...f, email: 'ananya@medisync.dev', password: 'Doctor@123' })}><Text>Demo doctor</Text></TouchableOpacity>
          </View>
        )}
        {mode === 'register' && <Text style={[s.muted, { textAlign: 'center' }]}>Doctors can register on the MediSync website.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
