import { StyleSheet } from 'react-native';
import { C } from './config';
export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 16, gap: 14 },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 10, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  input: { borderWidth: 1.5, borderColor: C.line, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: '#fff', fontSize: 15, color: C.text },
  btn: { backgroundColor: C.brand, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ghost: { borderWidth: 1.5, borderColor: C.line, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontWeight: '700', fontSize: 16, color: C.text },
  h1: { fontWeight: '800', fontSize: 24, color: C.text },
  muted: { color: C.muted, fontSize: 12 },
  label: { color: C.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  error: { color: C.danger },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.brand, borderColor: C.brand },
});
