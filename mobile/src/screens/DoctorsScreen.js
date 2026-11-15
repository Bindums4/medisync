import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../api';
import DoctorCard from '../components/DoctorCard';
import s from '../styles';

const SPECS = ['General Physician', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dentistry', 'Psychiatry'];
const SORTS = [['rating', 'Top rated'], ['fee_asc', 'Fee ↑'], ['fee_desc', 'Fee ↓'], ['experience', 'Experience']];

export default function DoctorsScreen({ route }) {
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState(route.params?.specialty || '');
  const [sort, setSort] = useState('rating');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (route.params?.specialty) setSpec(route.params.specialty); }, [route.params]);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => api.get('/doctors', { params: { q, specialty: spec, sort } }).then((r) => setDocs(r.data)).catch(() => {}).finally(() => setLoading(false)), 250);
    return () => clearTimeout(t);
  }, [q, spec, sort]);

  const Chip = ({ on, label, onPress }) => <TouchableOpacity onPress={onPress} style={[s.chip, on && s.chipOn]}><Text style={{ color: on ? '#fff' : '#0f172a', fontWeight: '600' }}>{label}</Text></TouchableOpacity>;

  return (
    <FlatList
      style={s.screen} contentContainerStyle={s.pad} data={docs} keyExtractor={(d) => d._id} renderItem={({ item }) => <DoctorCard d={item} />}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <TextInput style={s.input} placeholder="Search doctor, clinic or city" value={q} onChangeText={setQ} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip on={!spec} label="All" onPress={() => setSpec('')} />
            {SPECS.map((x) => <Chip key={x} on={spec === x} label={x} onPress={() => setSpec(x)} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {SORTS.map(([k, l]) => <Chip key={k} on={sort === k} label={l} onPress={() => setSort(k)} />)}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center', padding: 30 }]}>{loading ? 'Searching…' : 'No doctors found'}</Text>}
    />
  );
}
