import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, money } from '../config';
import s from '../styles';
import Avatar from './Avatar';

export default function DoctorCard({ d }) {
  const nav = useNavigation();
  const name = `Dr. ${d.user.name}`;
  return (
    <TouchableOpacity style={s.card} onPress={() => nav.navigate('DoctorDetail', { id: d._id })}>
      <View style={s.row}>
        <Avatar name={name} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.title}>{name}</Text>
          <Text style={{ color: C.brandDark, fontWeight: '600' }}>{d.specialty}</Text>
          <Text style={s.muted}>{d.experience} yrs · {d.clinic || d.city}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: C.warn, fontWeight: '700' }}>★ {d.rating ? d.rating.toFixed(1) : 'New'}</Text>
          <Text style={{ fontWeight: '800', color: C.text }}>{money(d.fee)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
