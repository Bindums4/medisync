import React from 'react';
import { Text, View } from 'react-native';
import { STATUS } from '../config';
export default function StatusPill({ status }) {
  const [bg, fg] = STATUS[status] || ['#e2e8f0', '#475569'];
  return <View style={{ backgroundColor: bg, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 }}><Text style={{ color: fg, fontWeight: '700', fontSize: 12, textTransform: 'capitalize' }}>{status}</Text></View>;
}
