import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { closeSocket, connectSocket } from './socket';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('medisync_token');
        if (t) { setUser((await api.get('/auth/me')).data); connectSocket(t); }
      } catch { await AsyncStorage.removeItem('medisync_token'); }
      setLoading(false);
    })();
  }, []);

  const authenticate = async (path, body) => {
    const { data } = await api.post(`/auth/${path}`, body);
    await AsyncStorage.setItem('medisync_token', data.token);
    connectSocket(data.token);
    setUser(data.user);
  };
  const logout = async () => { await AsyncStorage.removeItem('medisync_token'); closeSocket(); setUser(null); };
  const refresh = async () => setUser((await api.get('/auth/me')).data);

  return <Ctx.Provider value={{ user, loading, refresh, login: (b) => authenticate('login', b), register: (b) => authenticate('register', b), logout }}>{children}</Ctx.Provider>;
}
