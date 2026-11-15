import React from 'react';
import { Text, View } from 'react-native';
const COLORS = ['#0d9488', '#6366f1', '#ec4899', '#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444'];
export default function Avatar({ name = '?', size = 48 }) {
  const clean = name.replace(/^Dr\.?\s*/i, '');
  const color = COLORS[[...clean].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];
  const initials = clean.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text></View>;
}
