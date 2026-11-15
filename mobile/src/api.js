import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });
api.interceptors.request.use(async (cfg) => {
  const t = await AsyncStorage.getItem('medisync_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export const errMsg = (e) => e.response?.data?.message || (e.request ? 'Cannot reach the server. Check API_URL in src/config.js' : e.message);
export default api;
